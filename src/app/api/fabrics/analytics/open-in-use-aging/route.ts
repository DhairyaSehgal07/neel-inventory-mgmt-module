import { NextRequest, NextResponse } from 'next/server';
import { differenceInCalendarDays } from 'date-fns';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import type { OpenInUseAgingItem } from '@/lib/fabricAnalytics';
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
 * Requires FABRIC_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_VIEW, async () => {
    try {
      await dbConnect();

      const fabrics = await prisma.fabric.findMany({
        where: {
          status: { in: [FabricStatus.OPEN, FabricStatus.IN_USE] },
        },
        select: {
          id: true,
          fabricCode: true,
          status: true,
          updatedAt: true,
        },
        orderBy: { fabricCode: 'asc' },
      });

      if (fabrics.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            asOf: new Date().toISOString(),
            items: [] as OpenInUseAgingItem[],
          },
        });
      }

      const ids = fabrics.map((f) => f.id);

      const historyMax = await prisma.fabricHistory.groupBy({
        by: ['fabricId'],
        where: { fabricId: { in: ids } },
        _max: { createdAt: true },
      });

      const lastHistoryAt = new Map<number, Date>(
        historyMax
          .filter((h) => h._max.createdAt != null)
          .map((h) => [h.fabricId, h._max.createdAt!])
      );

      const now = new Date();

      const items: OpenInUseAgingItem[] = fabrics.map((f) => {
        const fromHistory = lastHistoryAt.get(f.id);
        const lastActivityAt = fromHistory ?? f.updatedAt;
        const agingDays = Math.max(
          0,
          differenceInCalendarDays(now, lastActivityAt)
        );
        return {
          fabricId: f.id,
          fabricCode: f.fabricCode,
          status: f.status as 'OPEN' | 'IN_USE',
          lastActivityAt: lastActivityAt.toISOString(),
          agingDays,
          usedHistory: fromHistory != null,
        };
      });

      items.sort((a, b) => {
        const d = b.agingDays - a.agingDays;
        if (d !== 0) return d;
        return a.fabricCode.localeCompare(b.fabricCode);
      });

      return NextResponse.json({
        success: true,
        data: {
          asOf: now.toISOString(),
          items,
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
