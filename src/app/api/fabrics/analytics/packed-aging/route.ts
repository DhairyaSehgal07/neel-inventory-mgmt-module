import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import type { PackedAgingItem } from '@/lib/fabricAnalytics';
import { getFabricAgingByStatus } from '@/lib/fabricAging';
import {
  buildFabricAnalyticsPrismaWhere,
  parseFabricAnalyticsFilters,
} from '@/lib/fabricAnalyticsQuery';
import { FabricStatus } from '@/generated/prisma/client';

/**
 * GET /api/fabrics/analytics/packed-aging
 *
 * Rolls with status PACKED only. Same aging rules as open-in-use-aging.
 *
 * Requires FABRIC_REPORTS.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_REPORTS, async () => {
    try {
      await dbConnect();

      const filters = parseFabricAnalyticsFilters(request.nextUrl.searchParams);
      const analyticsWhere = buildFabricAnalyticsPrismaWhere(filters);

      const { asOf, items } = await getFabricAgingByStatus(prisma, [FabricStatus.PACKED], analyticsWhere);

      return NextResponse.json({
        success: true,
        data: {
          asOf: asOf.toISOString(),
          items: items as PackedAgingItem[],
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('GET /api/fabrics/analytics/packed-aging error:', err);
      const isDev = process.env.NODE_ENV === 'development';
      const message =
        isDev && err.message
          ? `Failed to load packed aging: ${err.message}`
          : 'Failed to load packed aging';
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  });
}
