import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import {
  buildLowStockAlerts,
  buildLocationUtilisation,
  buildMasterComparisonRows,
} from '@/lib/rawMaterialAnalytics';
import { loadRawMaterialAnalyticsData } from '@/lib/rawMaterialAnalyticsLoad';

/**
 * GET /api/raw-materials/analytics/summary
 * Views 4–5: low-stock alerts and location utilisation.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.RAW_MATERIAL_REPORTS, async () => {
    try {
      await dbConnect();
      const { query, batches, history } = await loadRawMaterialAnalyticsData(
        request.nextUrl.searchParams
      );

      const comparison = buildMasterComparisonRows(batches, history, query.from, query.to);
      const lowStockAlerts = buildLowStockAlerts(comparison, query.lowStockDays);
      const locationUtilisation = buildLocationUtilisation(batches, query.material);

      const totalInStockKg = batches.reduce((s, b) => s + b.availableWeightKg, 0);
      const totalProcuredKg = batches.reduce((s, b) => s + b.purchasedWeightKg, 0);

      return NextResponse.json({
        success: true,
        data: {
          filters: {
            from: query.from.toISOString(),
            to: query.to.toISOString(),
            lowStockDays: query.lowStockDays,
            material: query.material || null,
          },
          totals: {
            totalInStockKg,
            totalProcuredKg,
            batchCount: batches.length,
          },
          lowStockAlerts,
          locationUtilisation,
        },
      });
    } catch (error) {
      console.error('GET /api/raw-materials/analytics/summary error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to load analytics summary' },
        { status: 500 }
      );
    }
  });
}
