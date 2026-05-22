import type { Prisma } from '@/generated/prisma/client';
import prisma from '@/lib/prisma';
import { deriveRawMaterialDisplayStatus } from '@/lib/rawMaterialDisplay';
import {
  mapBatchRow,
  type RawMaterialBalanceHistoryRow,
  type RawMaterialBatchRow,
} from '@/lib/rawMaterialAnalytics';
import {
  buildRawMaterialPrismaWhere,
  parseRawMaterialAnalyticsQuery,
  type RawMaterialAnalyticsQueryParams,
} from '@/lib/rawMaterialAnalyticsQuery';

export async function loadRawMaterialAnalyticsData(
  sp: URLSearchParams
): Promise<{
  query: RawMaterialAnalyticsQueryParams;
  batches: RawMaterialBatchRow[];
  history: RawMaterialBalanceHistoryRow[];
  materials: string[];
  grades: string[];
  locations: string[];
}> {
  const query = parseRawMaterialAnalyticsQuery(sp);
  const where = buildRawMaterialPrismaWhere(query);

  const batchesRaw = await prisma.rawMaterial.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  const batchIds = batchesRaw.map((b) => b.id);

  const historyDateFilter: Prisma.DateTimeFilter = {};
  if (query.from) historyDateFilter.gte = query.from;
  if (query.to) historyDateFilter.lte = query.to;

  const [historyRaw, matDistinct, gradeDistinct, locDistinct] = await Promise.all([
    batchIds.length === 0
      ? Promise.resolve([])
      : prisma.rawMaterialHistory.findMany({
          where: {
            actionType: 'BALANCE_UPDATE',
            rawMaterialId: { in: batchIds },
            ...(Object.keys(historyDateFilter).length > 0
              ? { createdAt: historyDateFilter }
              : {}),
          },
          select: {
            createdAt: true,
            rawMaterialId: true,
            availableBagsBefore: true,
            availableBagsAfter: true,
            availableWeightKgBefore: true,
            availableWeightKgAfter: true,
            rawMaterial: {
              select: { rawMaterial: true, grade: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        }),
    prisma.rawMaterial.findMany({
      select: { rawMaterial: true },
      distinct: ['rawMaterial'],
      orderBy: { rawMaterial: 'asc' },
    }),
    prisma.rawMaterial.findMany({
      select: { grade: true },
      distinct: ['grade'],
    }),
    prisma.rawMaterial.findMany({
      select: { location: true },
      distinct: ['location'],
    }),
  ]);

  const batches: RawMaterialBatchRow[] = batchesRaw.map((b) =>
    mapBatchRow({
      ...b,
      status: deriveRawMaterialDisplayStatus(b),
    })
  );

  const history: RawMaterialBalanceHistoryRow[] = historyRaw.map((h) => ({
      createdAt: h.createdAt,
      rawMaterialId: h.rawMaterialId,
      rawMaterial: h.rawMaterial.rawMaterial,
      grade: h.rawMaterial.grade,
      availableBagsBefore: h.availableBagsBefore,
      availableBagsAfter: h.availableBagsAfter,
      availableWeightKgBefore: h.availableWeightKgBefore,
      availableWeightKgAfter: h.availableWeightKgAfter,
    }));

  const materials = matDistinct.map((r) => r.rawMaterial.trim()).filter(Boolean);
  const grades = [
    ...new Set(
      gradeDistinct.map((r) => {
        const g = r.grade?.trim();
        return g && g.length > 0 ? g : '—';
      })
    ),
  ].sort((a, b) => a.localeCompare(b));
  const locations = [
    ...new Set(
      locDistinct
        .map((r) => r.location?.trim())
        .filter((s): s is string => !!s && s.length > 0)
    ),
  ].sort((a, b) => a.localeCompare(b));

  return { query, batches, history, materials, grades, locations };
}

/** History for forecast uses a wider window — load separately when needed. */
export async function loadRawMaterialHistoryForForecast(
  batchIds: number[],
  from: Date
): Promise<RawMaterialBalanceHistoryRow[]> {
  if (batchIds.length === 0) return [];

  const historyRaw = await prisma.rawMaterialHistory.findMany({
    where: {
      actionType: 'BALANCE_UPDATE',
      rawMaterialId: { in: batchIds },
      createdAt: { gte: from },
    },
    select: {
      createdAt: true,
      rawMaterialId: true,
      availableBagsBefore: true,
      availableBagsAfter: true,
      availableWeightKgBefore: true,
      availableWeightKgAfter: true,
      rawMaterial: {
        select: { rawMaterial: true, grade: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return historyRaw.map((h) => ({
    createdAt: h.createdAt,
    rawMaterialId: h.rawMaterialId,
    rawMaterial: h.rawMaterial.rawMaterial,
    grade: h.rawMaterial.grade,
    availableBagsBefore: h.availableBagsBefore,
    availableBagsAfter: h.availableBagsAfter,
    availableWeightKgBefore: h.availableWeightKgBefore,
    availableWeightKgAfter: h.availableWeightKgAfter,
  }));
}
