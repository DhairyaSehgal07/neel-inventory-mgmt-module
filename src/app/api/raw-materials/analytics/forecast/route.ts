import { NextRequest, NextResponse } from 'next/server';
import { addDays, startOfDay } from 'date-fns';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { buildConsumptionForecast } from '@/lib/rawMaterialAnalytics';
import {
  loadRawMaterialAnalyticsData,
  loadRawMaterialHistoryForForecast,
} from '@/lib/rawMaterialAnalyticsLoad';

/**
 * GET /api/raw-materials/analytics/forecast
 * View 6: consumption trend and linear stockout projection.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.RAW_MATERIAL_REPORTS, async () => {
    try {
      await dbConnect();
      const { query, batches } = await loadRawMaterialAnalyticsData(
        request.nextUrl.searchParams
      );

      const forecastFrom = startOfDay(
        addDays(new Date(), -query.forecastWindowDays)
      );
      const history = await loadRawMaterialHistoryForForecast(
        batches.map((b) => b.id),
        forecastFrom
      );

      const series = buildConsumptionForecast(
        batches,
        history,
        query.forecastWindowDays
      );

      return NextResponse.json({
        success: true,
        data: {
          forecastWindowDays: query.forecastWindowDays,
          series,
        },
      });
    } catch (error) {
      console.error('GET /api/raw-materials/analytics/forecast error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to load consumption forecast' },
        { status: 500 }
      );
    }
  });
}
