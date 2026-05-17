import { differenceInCalendarDays } from 'date-fns';
import type { FabricStatus, Prisma, PrismaClient } from '@/generated/prisma/client';
import type { FabricAgingItem } from '@/lib/fabricAnalytics';

/**
 * Rolls matching `statuses` and optional analytics filters. Aging (calendar days) =
 * today − last activity. Last activity = latest `fabric_histories.createdAt`; if none,
 * `fabric.updatedAt`. Sorted descending by aging days (most stale first).
 */
export async function getFabricAgingByStatus(
  prisma: PrismaClient,
  statuses: FabricStatus[],
  analyticsWhere: Prisma.FabricWhereInput
): Promise<{ asOf: Date; items: FabricAgingItem[] }> {
  const statusWhere = { status: { in: statuses } };
  const where =
    Object.keys(analyticsWhere).length === 0
      ? statusWhere
      : { AND: [statusWhere, analyticsWhere] };

  const fabrics = await prisma.fabric.findMany({
    where,
    select: {
      id: true,
      fabricCode: true,
      status: true,
      updatedAt: true,
    },
    orderBy: { fabricCode: 'asc' },
  });

  const now = new Date();

  if (fabrics.length === 0) {
    return { asOf: now, items: [] };
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

  const items: FabricAgingItem[] = fabrics.map((f) => {
    const fromHistory = lastHistoryAt.get(f.id);
    const lastActivityAt = fromHistory ?? f.updatedAt;
    const agingDays = Math.max(0, differenceInCalendarDays(now, lastActivityAt));
    return {
      fabricId: f.id,
      fabricCode: f.fabricCode,
      status: f.status ?? 'UNKNOWN',
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

  return { asOf: now, items };
}
