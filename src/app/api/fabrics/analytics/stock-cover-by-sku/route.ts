import { NextRequest, NextResponse } from 'next/server';
import { subMonths } from 'date-fns';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { liveFabricStockWhere, type StockCoverBySkuItem } from '@/lib/fabricAnalytics';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { Prisma } from '@/generated/prisma/client';

const MIN_MONTHS = 1;
const MAX_MONTHS = 36;
const DEFAULT_MONTHS = 6;

/**
 * GET /api/fabrics/analytics/stock-cover-by-sku?months=6
 *
 * Per fabric code (SKU): current live balance ÷ average monthly consumption from
 * `BALANCE_UPDATE` history (sum of max(0, lengthBefore − lengthAfter)) over the window.
 * Sorted ascending by months of cover (lowest first — stockout risk at the top).
 *
 * Requires FABRIC_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_VIEW, async () => {
    try {
      await dbConnect();

      const monthsParam = request.nextUrl.searchParams.get('months');
      const parsed = monthsParam ? Number.parseInt(monthsParam, 10) : DEFAULT_MONTHS;
      const monthsWindow = Number.isFinite(parsed)
        ? Math.min(MAX_MONTHS, Math.max(MIN_MONTHS, parsed))
        : DEFAULT_MONTHS;

      const since = subMonths(new Date(), monthsWindow);

      const fabrics = await prisma.fabric.findMany({
        where: liveFabricStockWhere(),
        select: { id: true, fabricCode: true, fabricLengthCurrent: true },
      });

      if (fabrics.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            monthsWindow,
            consumptionSince: since.toISOString(),
            items: [] as StockCoverBySkuItem[],
          },
        });
      }

      const ids = fabrics.map((f) => f.id);

      const consumptionRows = await prisma.$queryRaw<
        { fabricId: number; consumed: number }[]
      >`
        SELECT "fabricId",
          SUM(GREATEST(0, COALESCE("lengthBefore", 0) - COALESCE("lengthAfter", 0)))::float AS consumed
        FROM fabric_histories
        WHERE "actionType" = 'BALANCE_UPDATE'::"FabricHistoryAction"
          AND "createdAt" >= ${since}
          AND "fabricId" IN (${Prisma.join(ids)})
        GROUP BY "fabricId"
      `;

      const consumedById = new Map<number, number>(
        consumptionRows.map((r) => [r.fabricId, r.consumed])
      );

      const items: StockCoverBySkuItem[] = fabrics.map((f) => {
        const currentBalanceM = f.fabricLengthCurrent;
        const totalConsumptionM = consumedById.get(f.id) ?? 0;
        const averageMonthlyConsumptionM = totalConsumptionM / monthsWindow;

        let stockCoverMonths: number | null;
        if (currentBalanceM <= 0) {
          stockCoverMonths = 0;
        } else if (averageMonthlyConsumptionM <= 0) {
          stockCoverMonths = null;
        } else {
          stockCoverMonths = currentBalanceM / averageMonthlyConsumptionM;
        }

        return {
          fabricId: f.id,
          fabricCode: f.fabricCode,
          currentBalanceM,
          totalConsumptionM,
          averageMonthlyConsumptionM,
          stockCoverMonths,
        };
      });

      items.sort((a, b) => {
        const rank = (x: StockCoverBySkuItem) =>
          x.stockCoverMonths ?? Number.POSITIVE_INFINITY;
        const d = rank(a) - rank(b);
        if (d !== 0) return d;
        return a.fabricCode.localeCompare(b.fabricCode);
      });

      return NextResponse.json({
        success: true,
        data: {
          monthsWindow,
          consumptionSince: since.toISOString(),
          items,
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('GET /api/fabrics/analytics/stock-cover-by-sku error:', err);
      const isDev = process.env.NODE_ENV === 'development';
      const message =
        isDev && err.message
          ? `Failed to load stock cover by SKU: ${err.message}`
          : 'Failed to load stock cover by SKU';
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  });
}
