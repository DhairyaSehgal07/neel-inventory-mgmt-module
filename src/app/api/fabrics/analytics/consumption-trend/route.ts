import { NextRequest, NextResponse } from 'next/server';
import { endOfDay, format, parseISO, startOfDay, subMonths } from 'date-fns';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import {
  type ConsumptionTrendBucket,
  type ConsumptionTrendGranularity,
  type ConsumptionTrendSegment,
  type ConsumptionTrendSplit,
} from '@/lib/fabricAnalytics';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { Prisma } from '@/generated/prisma/client';

const TOP_SEGMENT_LIMIT = 14;

function grainTruncSql(g: ConsumptionTrendGranularity): Prisma.Sql {
  switch (g) {
    case 'day':
      return Prisma.sql`date_trunc('day', h."createdAt")`;
    case 'week':
      return Prisma.sql`date_trunc('week', h."createdAt")`;
    case 'month':
      return Prisma.sql`date_trunc('month', h."createdAt")`;
  }
}

function periodLabel(d: Date, g: ConsumptionTrendGranularity): string {
  if (g === 'month') return format(d, 'MMM yyyy');
  if (g === 'week') return `Week of ${format(d, 'MMM d, yyyy')}`;
  return format(d, 'MMM d, yyyy');
}

function parseGranularity(v: string | null): ConsumptionTrendGranularity {
  if (v === 'day' || v === 'week' || v === 'month') return v;
  return 'month';
}

function parseSplit(v: string | null): ConsumptionTrendSplit {
  if (v === 'width' || v === 'strength' || v === 'assign') return v;
  return 'none';
}

function parseDateRange(searchParams: URLSearchParams): { from: Date; to: Date } {
  const defaultTo = endOfDay(new Date());
  const defaultFrom = startOfDay(subMonths(defaultTo, 6));

  const fromStr = searchParams.get('from');
  const toStr = searchParams.get('to');

  let from = defaultFrom;
  let to = defaultTo;

  if (fromStr) {
    try {
      from = startOfDay(parseISO(fromStr));
    } catch {
      /* keep default */
    }
  }
  if (toStr) {
    try {
      to = endOfDay(parseISO(toStr));
    } catch {
      /* keep default */
    }
  }

  if (from > to) {
    return { from: defaultFrom, to: defaultTo };
  }

  return { from, to };
}

type TotalRow = { period_start: Date; consumption_m: number };

type SplitRow = {
  period_start: Date;
  segment_key: string;
  segment_label: string;
  consumption_m: number;
};

function mergeSplitRowsToBuckets(
  rows: SplitRow[],
  granularity: ConsumptionTrendGranularity
): ConsumptionTrendBucket[] {
  if (rows.length === 0) return [];

  const globalTotals = new Map<string, { label: string; total: number }>();
  for (const r of rows) {
    const prev = globalTotals.get(r.segment_key);
    const m = Number(r.consumption_m) || 0;
    if (prev) {
      prev.total += m;
    } else {
      globalTotals.set(r.segment_key, { label: r.segment_label, total: m });
    }
  }

  const ranked = [...globalTotals.entries()].sort((a, b) => b[1].total - a[1].total);
  const keep = new Set(
    ranked.slice(0, TOP_SEGMENT_LIMIT).map(([k]) => k)
  );

  const byPeriod = new Map<string, Map<string, number>>();
  const periodOrder: string[] = [];

  for (const r of rows) {
    const iso = new Date(r.period_start).toISOString();
    if (!byPeriod.has(iso)) {
      byPeriod.set(iso, new Map());
      periodOrder.push(iso);
    }
    const m = Number(r.consumption_m) || 0;
    const map = byPeriod.get(iso)!;
    map.set(r.segment_key, (map.get(r.segment_key) ?? 0) + m);
  }

  const buckets: ConsumptionTrendBucket[] = [];

  for (const iso of periodOrder) {
    const segMap = byPeriod.get(iso)!;
    const segments: ConsumptionTrendSegment[] = [];
    let otherSum = 0;
    const d = new Date(iso);

    for (const [key, labelMeta] of globalTotals) {
      const v = segMap.get(key) ?? 0;
      if (!keep.has(key)) {
        otherSum += v;
        continue;
      }
      if (v > 0) {
        segments.push({
          segmentKey: key,
          label: labelMeta.label,
          consumptionM: v,
        });
      }
    }

    if (otherSum > 0.0001) {
      segments.push({
        segmentKey: 'other',
        label: 'Other',
        consumptionM: otherSum,
      });
    }

    segments.sort((a, b) => b.consumptionM - a.consumptionM);

    const totalM = segments.reduce((s, x) => s + x.consumptionM, 0);

    buckets.push({
      periodStart: iso,
      periodLabel: periodLabel(d, granularity),
      totalM,
      segments,
    });
  }

  return buckets;
}

/**
 * GET /api/fabrics/analytics/consumption-trend?granularity=month&split=width&from=&to=
 *
 * Consumption from balance-decreasing `BALANCE_UPDATE` events:
 * `lengthBefore - lengthAfter` (meters) per event. Aggregated by calendar day / week / month.
 * Optional split by fabric width, strength, or current `assignTo` (machine / section).
 *
 * When split is set, only the top segment values by total volume are shown per period;
 * the rest are rolled into "Other".
 *
 * Requires FABRIC_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_VIEW, async () => {
    try {
      await dbConnect();

      const { searchParams } = request.nextUrl;
      const granularity = parseGranularity(searchParams.get('granularity'));
      const split = parseSplit(searchParams.get('split'));
      const { from, to } = parseDateRange(searchParams);

      const trunc = grainTruncSql(granularity);

      if (split === 'none') {
        const totals = await prisma.$queryRaw<TotalRow[]>`
          SELECT (${trunc})::timestamptz AS period_start,
            SUM(GREATEST(0, COALESCE(h."lengthBefore", 0) - COALESCE(h."lengthAfter", 0)))::float AS consumption_m
          FROM fabric_histories h
          WHERE h."actionType" = 'BALANCE_UPDATE'::"FabricHistoryAction"
            AND h."lengthBefore" IS NOT NULL
            AND h."lengthAfter" IS NOT NULL
            AND h."lengthBefore" > h."lengthAfter"
            AND h."createdAt" >= ${from}
            AND h."createdAt" <= ${to}
          GROUP BY 1
          ORDER BY 1 ASC
        `;

        const buckets: ConsumptionTrendBucket[] = totals.map((row) => {
          const d = new Date(row.period_start);
          return {
            periodStart: d.toISOString(),
            periodLabel: periodLabel(d, granularity),
            totalM: Number(row.consumption_m) || 0,
          };
        });

        return NextResponse.json({
          success: true,
          data: {
            granularity,
            split,
            from: from.toISOString(),
            to: to.toISOString(),
            buckets,
          },
        });
      }

      let splitRows: SplitRow[];

      if (split === 'width') {
        splitRows = await prisma.$queryRaw<SplitRow[]>`
          SELECT (${trunc})::timestamptz AS period_start,
            ('w:' || f."fabricWidthId"::text) AS segment_key,
            (w.value::text || ' cm') AS segment_label,
            SUM(GREATEST(0, COALESCE(h."lengthBefore", 0) - COALESCE(h."lengthAfter", 0)))::float AS consumption_m
          FROM fabric_histories h
          INNER JOIN fabrics f ON f.id = h."fabricId"
          INNER JOIN fabric_widths w ON w.id = f."fabricWidthId"
          WHERE h."actionType" = 'BALANCE_UPDATE'::"FabricHistoryAction"
            AND h."lengthBefore" IS NOT NULL
            AND h."lengthAfter" IS NOT NULL
            AND h."lengthBefore" > h."lengthAfter"
            AND h."createdAt" >= ${from}
            AND h."createdAt" <= ${to}
          GROUP BY 1, f."fabricWidthId", w.value
          ORDER BY 1 ASC, 2 ASC
        `;
      } else if (split === 'strength') {
        splitRows = await prisma.$queryRaw<SplitRow[]>`
          SELECT (${trunc})::timestamptz AS period_start,
            ('s:' || f."fabricStrengthId"::text) AS segment_key,
            s.name AS segment_label,
            SUM(GREATEST(0, COALESCE(h."lengthBefore", 0) - COALESCE(h."lengthAfter", 0)))::float AS consumption_m
          FROM fabric_histories h
          INNER JOIN fabrics f ON f.id = h."fabricId"
          INNER JOIN fabric_strengths s ON s.id = f."fabricStrengthId"
          WHERE h."actionType" = 'BALANCE_UPDATE'::"FabricHistoryAction"
            AND h."lengthBefore" IS NOT NULL
            AND h."lengthAfter" IS NOT NULL
            AND h."lengthBefore" > h."lengthAfter"
            AND h."createdAt" >= ${from}
            AND h."createdAt" <= ${to}
          GROUP BY 1, f."fabricStrengthId", s.name
          ORDER BY 1 ASC, 2 ASC
        `;
      } else {
        splitRows = await prisma.$queryRaw<SplitRow[]>`
          SELECT (${trunc})::timestamptz AS period_start,
            ('a:' || COALESCE(NULLIF(TRIM(f."assignTo"), ''), '(Unassigned)')) AS segment_key,
            COALESCE(NULLIF(TRIM(f."assignTo"), ''), '(Unassigned)') AS segment_label,
            SUM(GREATEST(0, COALESCE(h."lengthBefore", 0) - COALESCE(h."lengthAfter", 0)))::float AS consumption_m
          FROM fabric_histories h
          INNER JOIN fabrics f ON f.id = h."fabricId"
          WHERE h."actionType" = 'BALANCE_UPDATE'::"FabricHistoryAction"
            AND h."lengthBefore" IS NOT NULL
            AND h."lengthAfter" IS NOT NULL
            AND h."lengthBefore" > h."lengthAfter"
            AND h."createdAt" >= ${from}
            AND h."createdAt" <= ${to}
          GROUP BY 1, COALESCE(NULLIF(TRIM(f."assignTo"), ''), '(Unassigned)')
          ORDER BY 1 ASC, 2 ASC
        `;
      }

      const buckets = mergeSplitRowsToBuckets(splitRows, granularity);

      return NextResponse.json({
        success: true,
        data: {
          granularity,
          split,
          from: from.toISOString(),
          to: to.toISOString(),
          buckets,
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('GET /api/fabrics/analytics/consumption-trend error:', err);
      const isDev = process.env.NODE_ENV === 'development';
      const message =
        isDev && err.message
          ? `Failed to load consumption trend: ${err.message}`
          : 'Failed to load consumption trend';
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  });
}
