import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { buildMasterComparisonRows } from '@/lib/rawMaterialAnalytics';
import { loadRawMaterialAnalyticsData } from '@/lib/rawMaterialAnalyticsLoad';

/**
 * GET /api/raw-materials/analytics/master-comparison
 * View 2: procurement vs stock vs consumption by material and grade.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.RAW_MATERIAL_BATCH_VIEW, async () => {
    try {
      await dbConnect();
      const { query, batches, history } = await loadRawMaterialAnalyticsData(
        request.nextUrl.searchParams
      );

      const rows = buildMasterComparisonRows(batches, history, query.from, query.to);

      return NextResponse.json({
        success: true,
        data: {
          filters: {
            from: query.from.toISOString(),
            to: query.to.toISOString(),
          },
          rows,
        },
      });
    } catch (error) {
      console.error('GET /api/raw-materials/analytics/master-comparison error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to load master comparison' },
        { status: 500 }
      );
    }
  });
}
