import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import type { OpenInUseAgingItem } from '@/lib/fabricAnalytics';
import { getFabricAgingByStatus } from '@/lib/fabricAging';
import {
  buildFabricAnalyticsPrismaWhere,
  parseFabricAnalyticsFilters,
} from '@/lib/fabricAnalyticsQuery';
import { FabricStatus } from '@/generated/prisma/client';

/**
 * GET /api/fabrics/analytics/open-in-use-aging
 *
 * Rolls with status OPEN or IN_USE only. Aging (calendar days) = today − last activity.
 * Last activity = latest `fabric_histories.createdAt` for that roll (covers ASSIGN,
 * BALANCE_UPDATE, and any status/assignment fields on those events). If a roll has no
 * history rows, `fabric.updatedAt` is used as a fallback.
 *
 * Sorted descending by aging days (oldest / most stale first).
 *
 * Requires FABRIC_REPORTS.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_REPORTS, async () => {
    try {
      await dbConnect();

      const filters = parseFabricAnalyticsFilters(request.nextUrl.searchParams);
      const analyticsWhere = buildFabricAnalyticsPrismaWhere(filters);

      const { asOf, items } = await getFabricAgingByStatus(
        prisma,
        [FabricStatus.OPEN, FabricStatus.IN_USE],
        analyticsWhere
      );

      return NextResponse.json({
        success: true,
        data: {
          asOf: asOf.toISOString(),
          items: items as OpenInUseAgingItem[],
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('GET /api/fabrics/analytics/open-in-use-aging error:', err);
      const isDev = process.env.NODE_ENV === 'development';
      const message =
        isDev && err.message
          ? `Failed to load open / in-use aging: ${err.message}`
          : 'Failed to load open / in-use aging';
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  });
}
