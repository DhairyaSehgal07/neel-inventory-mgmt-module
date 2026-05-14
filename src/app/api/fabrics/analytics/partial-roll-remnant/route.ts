import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import type { PartialRollRemnantBucket } from '@/lib/fabricAnalytics';
import {
  fabricAnalyticsFabricFiltersSql,
  parseFabricAnalyticsFilters,
} from '@/lib/fabricAnalyticsQuery';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';

const BUCKET_META: Array<Pick<PartialRollRemnantBucket, 'id' | 'label'>> = [
  { id: '0-50', label: '0–50 m' },
  { id: '50-100', label: '50–100 m' },
  { id: '100-200', label: '100–200 m' },
  { id: '200+', label: '200+ m' },
];

const BUCKET_IDS = new Set(BUCKET_META.map((b) => b.id));

/**
 * Partial rolls: remaining length &gt; 0, still below original length (remnants).
 * Excludes REJECTED / TRADED so counts align with usable inventory.
 */
const PARTIAL_BASE = Prisma.sql`
  f."fabricLengthCurrent" > 0
  AND f."fabricLengthCurrent" < f."fabricLengthInitial"
  AND (
    f.status IS NULL
    OR f.status NOT IN ('REJECTED'::"FabricStatus", 'TRADED'::"FabricStatus")
  )
`;

function bucketPredicateSql(bucketId: string): Prisma.Sql {
  switch (bucketId) {
    case '0-50':
      return Prisma.sql`f."fabricLengthCurrent" <= 50`;
    case '50-100':
      return Prisma.sql`f."fabricLengthCurrent" > 50 AND f."fabricLengthCurrent" <= 100`;
    case '100-200':
      return Prisma.sql`f."fabricLengthCurrent" > 100 AND f."fabricLengthCurrent" <= 200`;
    case '200+':
      return Prisma.sql`f."fabricLengthCurrent" > 200`;
    default:
      return Prisma.sql`false`;
  }
}

type DrilldownRow = {
  fabric_id: number;
  fabric_code: string;
  width_cm: number;
  strength_name: string;
  location_display: string | null;
  remaining_m: number;
};

/**
 * GET /api/fabrics/analytics/partial-roll-remnant?bucket=0-50&location=&fabricCode=
 *
 * Without `bucket`: summary + histogram buckets.
 * With `bucket`: rolls in that remaining-length band (fabric code, width, strength, location).
 *
 * Requires FABRIC_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_VIEW, async () => {
    try {
      await dbConnect();

      const { searchParams } = request.nextUrl;
      const filters = parseFabricAnalyticsFilters(searchParams);
      const fabricExtra = fabricAnalyticsFabricFiltersSql(filters);
      const bucketParam = searchParams.get('bucket')?.trim();

      const partialWhere = Prisma.sql`(${PARTIAL_BASE}) AND (${fabricExtra})`;

      if (bucketParam && BUCKET_IDS.has(bucketParam as PartialRollRemnantBucket['id'])) {
        const bucketId = bucketParam as PartialRollRemnantBucket['id'];
        const bucketSql = bucketPredicateSql(bucketId);

        const rows = await prisma.$queryRaw<DrilldownRow[]>`
          SELECT
            f.id AS fabric_id,
            f."fabricCode" AS fabric_code,
            w.value::float AS width_cm,
            s.name AS strength_name,
            (
              SELECT COALESCE(
                string_agg(
                  CASE
                    WHEN NULLIF(TRIM(loc.floor), '') IS NOT NULL THEN TRIM(loc.area) || ', ' || TRIM(loc.floor)
                    ELSE TRIM(loc.area)
                  END,
                  '; '
                  ORDER BY loc.id
                ),
                '—'
              )
              FROM locations loc
              WHERE loc."fabricId" = f.id
            ) AS location_display,
            f."fabricLengthCurrent"::float AS remaining_m
          FROM fabrics f
          INNER JOIN fabric_widths w ON w.id = f."fabricWidthId"
          INNER JOIN fabric_strengths s ON s.id = f."fabricStrengthId"
          WHERE (${partialWhere})
            AND (${bucketSql})
          ORDER BY f."fabricCode" ASC
        `;

        return NextResponse.json({
          success: true,
          data: {
            bucket: bucketId,
            rolls: rows.map((r) => ({
              fabricId: Number(r.fabric_id),
              fabricCode: r.fabric_code,
              widthValueCm: Number(r.width_cm) || 0,
              strengthName: r.strength_name,
              locationDisplay: r.location_display?.trim() || '—',
              remainingM: Number(r.remaining_m) || 0,
            })),
          },
        });
      }

      const summary = await prisma.$queryRaw<[{ c: bigint; t: number }]>`
        SELECT
          COUNT(*)::bigint AS c,
          COALESCE(SUM(f."fabricLengthCurrent"), 0)::float AS t
        FROM fabrics f
        WHERE ${partialWhere}
      `;

      const row = summary[0];
      const partialRollCount = Number(row?.c ?? 0);
      const totalRemainingM = Number(row?.t ?? 0);

      const bucketAgg = await prisma.$queryRaw<
        { bucket_id: string; roll_count: bigint; total_m: number }[]
      >`
        SELECT
          (
            CASE
              WHEN f."fabricLengthCurrent" <= 50 THEN '0-50'
              WHEN f."fabricLengthCurrent" <= 100 THEN '50-100'
              WHEN f."fabricLengthCurrent" <= 200 THEN '100-200'
              ELSE '200+'
            END
          ) AS bucket_id,
          COUNT(*)::bigint AS roll_count,
          COALESCE(SUM(f."fabricLengthCurrent"), 0)::float AS total_m
        FROM fabrics f
        WHERE ${partialWhere}
        GROUP BY 1
        ORDER BY MIN(
          CASE
            WHEN f."fabricLengthCurrent" <= 50 THEN 1
            WHEN f."fabricLengthCurrent" <= 100 THEN 2
            WHEN f."fabricLengthCurrent" <= 200 THEN 3
            ELSE 4
          END
        )
      `;

      const aggMap = new Map(
        bucketAgg.map((b) => [
          b.bucket_id,
          { rollCount: Number(b.roll_count), totalM: Number(b.total_m) },
        ])
      );

      const buckets: PartialRollRemnantBucket[] = BUCKET_META.map((def) => {
        const a = aggMap.get(def.id);
        return {
          id: def.id,
          label: def.label,
          rollCount: a?.rollCount ?? 0,
          totalRemainingM: a?.totalM ?? 0,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          partialRollCount,
          totalRemainingM,
          buckets,
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('GET /api/fabrics/analytics/partial-roll-remnant error:', err);
      const isDev = process.env.NODE_ENV === 'development';
      const message =
        isDev && err.message
          ? `Failed to load partial roll remnant analysis: ${err.message}`
          : 'Failed to load partial roll remnant analysis';
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  });
}
