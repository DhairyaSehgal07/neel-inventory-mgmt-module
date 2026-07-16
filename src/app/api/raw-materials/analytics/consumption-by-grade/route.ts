import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import {
  aggregateConsumptionByMaterialGrade,
  buildConsumptionTimeline,
} from '@/lib/rawMaterialAnalytics';
import { loadRawMaterialAnalyticsData } from '@/lib/rawMaterialAnalyticsLoad';

/**
 * GET /api/raw-materials/analytics/consumption-by-grade
 * View 1: timeline + material/grade consumption table.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.RAW_MATERIAL_REPORTS, async () => {
    try {
      await dbConnect();
      const { query, batches, history } = await loadRawMaterialAnalyticsData(
        request.nextUrl.searchParams
      );

      const timeline = buildConsumptionTimeline(
        history,
        query.granularity,
        query.from,
        query.to
      );
      const { groups } = aggregateConsumptionByMaterialGrade(
        history,
        query.from,
        query.to,
        query.selectedPeriod,
        query.granularity
      );

      return NextResponse.json({
        success: true,
        data: {
          filters: {
            from: query.from.toISOString(),
            to: query.to.toISOString(),
            material: query.material || null,
            granularity: query.granularity,
            selectedPeriod: query.selectedPeriod,
          },
          timeline,
          groups,
          batchCount: batches.length,
        },
      });
    } catch (error) {
      console.error('GET /api/raw-materials/analytics/consumption-by-grade error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to load consumption analytics' },
        { status: 500 }
      );
    }
  });
}
