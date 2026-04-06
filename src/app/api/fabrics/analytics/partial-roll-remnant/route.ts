import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import type { PartialRollRemnantBucket } from '@/lib/fabricAnalytics';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';

const BUCKET_META: Array<Pick<PartialRollRemnantBucket, 'id' | 'label'>> = [
  { id: '0-50', label: '0–50 m' },
  { id: '50-100', label: '50–100 m' },
  { id: '100-200', label: '100–200 m' },
  { id: '200+', label: '200+ m' },
];

/**
 * Partial rolls: remaining length &gt; 0, still below original length (remnants).
 * Excludes REJECTED / TRADED so counts align with usable inventory.
 */
const PARTIAL_WHERE = Prisma.sql`
  f."fabricLengthCurrent" > 0
  AND f."fabricLengthCurrent" < f."fabricLengthInitial"
  AND (
    f.status IS NULL
    OR f.status NOT IN ('REJECTED'::"FabricStatus", 'TRADED'::"FabricStatus")
  )
`;

/**
 * GET /api/fabrics/analytics/partial-roll-remnant
 *
 * Rolls where current balance is positive but less than original length (partial /
 * remnants). Buckets by remaining meters on the roll.
 *
 * Requires FABRIC_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_VIEW, async () => {
    try {
      await dbConnect();

      const summary = await prisma.$queryRaw<[{ c: bigint; t: number }]>`
        SELECT
          COUNT(*)::bigint AS c,
          COALESCE(SUM(f."fabricLengthCurrent"), 0)::float AS t
        FROM fabrics f
        WHERE ${PARTIAL_WHERE}
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
        WHERE ${PARTIAL_WHERE}
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
