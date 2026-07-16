import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { buildPackedAging } from '@/lib/rawMaterialAnalytics';
import { loadRawMaterialAnalyticsData } from '@/lib/rawMaterialAnalyticsLoad';

/**
 * GET /api/raw-materials/analytics/packed-aging
 * View 3: packed batch aging buckets and detail list.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.RAW_MATERIAL_REPORTS, async () => {
    try {
      await dbConnect();
      const { query, batches } = await loadRawMaterialAnalyticsData(
        request.nextUrl.searchParams
      );

      const asOf = new Date();
      const { summaries, items } = buildPackedAging(batches, query.bucket, asOf);

      return NextResponse.json({
        success: true,
        data: {
          asOf: asOf.toISOString(),
          summaries,
          items,
        },
      });
    } catch (error) {
      console.error('GET /api/raw-materials/analytics/packed-aging error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to load packed aging' },
        { status: 500 }
      );
    }
  });
}
