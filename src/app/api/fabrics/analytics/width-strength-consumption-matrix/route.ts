import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import {
  fabricAnalyticsFabricFiltersSql,
  parseFabricAnalyticsDateRange,
  parseFabricAnalyticsFilters,
} from '@/lib/fabricAnalyticsQuery';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';

type AggRow = {
  fabricWidthId: number;
  fabricStrengthId: number;
  consumption_m: number;
  event_count: bigint;
};

/**
 * GET /api/fabrics/analytics/width-strength-consumption-matrix?from=&to=&location=&fabricCode=
 *
 * Sum of meters consumed (balance decreases) per width × strength in the date window.
 * Same master width/strength axes as the stock matrix (full Cartesian product).
 *
 * Requires FABRIC_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_VIEW, async () => {
    try {
      await dbConnect();

      const sp = request.nextUrl.searchParams;
      const { from, to } = parseFabricAnalyticsDateRange(sp);
      const fabricFilterSql = fabricAnalyticsFabricFiltersSql(parseFabricAnalyticsFilters(sp));

      const [widths, strengths, grouped] = await Promise.all([
        prisma.fabricWidth.findMany({
          select: { id: true, value: true },
          orderBy: { value: 'asc' },
        }),
        prisma.fabricStrength.findMany({
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
        prisma.$queryRaw<AggRow[]>`
          SELECT
            f."fabricWidthId" AS "fabricWidthId",
            f."fabricStrengthId" AS "fabricStrengthId",
            SUM(GREATEST(0, COALESCE(h."lengthBefore", 0) - COALESCE(h."lengthAfter", 0)))::float AS consumption_m,
            COUNT(*)::bigint AS event_count
          FROM fabric_histories h
          INNER JOIN fabrics f ON f.id = h."fabricId"
          WHERE h."actionType" = 'BALANCE_UPDATE'::"FabricHistoryAction"
            AND h."lengthBefore" IS NOT NULL
            AND h."lengthAfter" IS NOT NULL
            AND h."lengthBefore" > h."lengthAfter"
            AND h."createdAt" >= ${from}
            AND h."createdAt" <= ${to}
            AND (${fabricFilterSql})
          GROUP BY f."fabricWidthId", f."fabricStrengthId"
        `,
      ]);

      const agg = new Map<
        string,
        { totalConsumptionM: number; eventCount: number }
      >();
      for (const row of grouped) {
        const key = `${row.fabricWidthId}:${row.fabricStrengthId}`;
        agg.set(key, {
          totalConsumptionM: Number(row.consumption_m) || 0,
          eventCount: Number(row.event_count) || 0,
        });
      }

      const totalConsumptionMByWidthRow: number[][] = [];
      const fabricCountByWidthRow: number[][] = [];
      const cells: {
        widthId: number;
        widthValue: number;
        strengthId: number;
        strengthName: string;
        totalConsumptionM: number;
        eventCount: number;
      }[] = [];

      let minVal = Number.POSITIVE_INFINITY;
      let maxVal = 0;
      let grandTotal = 0;

      for (const w of widths) {
        const mRow: number[] = [];
        const cRow: number[] = [];
        for (const s of strengths) {
          const cell = agg.get(`${w.id}:${s.id}`) ?? {
            totalConsumptionM: 0,
            eventCount: 0,
          };
          mRow.push(cell.totalConsumptionM);
          cRow.push(cell.eventCount);
          grandTotal += cell.totalConsumptionM;
          if (cell.totalConsumptionM > 0) {
            minVal = Math.min(minVal, cell.totalConsumptionM);
            maxVal = Math.max(maxVal, cell.totalConsumptionM);
          }
          cells.push({
            widthId: w.id,
            widthValue: w.value,
            strengthId: s.id,
            strengthName: s.name,
            totalConsumptionM: cell.totalConsumptionM,
            eventCount: cell.eventCount,
          });
        }
        totalConsumptionMByWidthRow.push(mRow);
        fabricCountByWidthRow.push(cRow);
      }

      if (minVal === Number.POSITIVE_INFINITY) {
        minVal = 0;
      }

      return NextResponse.json({
        success: true,
        data: {
          from: from.toISOString(),
          to: to.toISOString(),
          widths,
          strengths,
          totalConsumptionMByWidthRow,
          fabricCountByWidthRow,
          cells,
          stats: {
            minTotalConsumptionM: minVal,
            maxTotalConsumptionM: maxVal,
            grandTotalConsumptionM: grandTotal,
          },
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(
        'GET /api/fabrics/analytics/width-strength-consumption-matrix error:',
        err
      );
      const isDev = process.env.NODE_ENV === 'development';
      const message =
        isDev && err.message
          ? `Failed to load width × strength consumption matrix: ${err.message}`
          : 'Failed to load width × strength consumption matrix';
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  });
}
