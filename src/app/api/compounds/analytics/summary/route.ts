import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@/generated/prisma/client';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import {
  computeCompoundAnalyticsSummary,
  type CompoundAnalyticsGranularity,
  type CompoundBalanceHistoryRow,
  type CompoundBatchAnalyticsRow,
  parseOptionalDateBoundary,
} from '@/lib/compoundAnalytics';

const querySchema = z.object({
  location: z.string().optional(),
  compound: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  granularity: z.enum(['day', 'week', 'month']).optional().default('month'),
  slowDays: z.coerce.number().int().min(1).max(3650).optional().default(30),
});

/**
 * GET /api/compounds/analytics/summary
 *
 * Aggregated compound inventory analytics (production, consumption, timelines, comparison
 * inputs). Uses numeric fields: produced = totalWeightProducedKg, in-stock = weightRemainingKg,
 * consumed = weightConsumedKg (equivalent to RIGHT − LEFT in the analytics brief).
 *
 * Query: location (contains, case-insensitive; omit or "all" for all sites), compound (name
 * contains), from / to (ISO dates on batch dateOfProduction), granularity (day|week|month),
 * slowDays (threshold for slow-stock alerts, default 30).
 *
 * Requires COMPOUND_BATCH_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.COMPOUND_BATCH_VIEW, async () => {
    try {
      const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
      const parsed = querySchema.safeParse(raw);
      if (!parsed.success) {
        const msg = parsed.error.flatten().fieldErrors
          ? Object.values(parsed.error.flatten().fieldErrors).flat().join(', ')
          : 'Invalid query';
        return NextResponse.json({ success: false, message: msg }, { status: 400 });
      }

      const q = parsed.data;
      const fromD = parseOptionalDateBoundary(q.from ?? null, false);
      const toD = parseOptionalDateBoundary(q.to ?? null, true);
      const granularity = q.granularity as CompoundAnalyticsGranularity;
      const slowDays = q.slowDays ?? 30;

      const compoundWhere: Prisma.CompoundWhereInput = {};
      const loc = q.location?.trim();
      if (loc && loc.toLowerCase() !== 'all') {
        compoundWhere.location = { contains: loc, mode: 'insensitive' };
      }
      const nameQ = q.compound?.trim();
      if (nameQ) {
        compoundWhere.compoundName = { contains: nameQ, mode: 'insensitive' };
      }
      const productionDateFilter: Prisma.DateTimeFilter = {};
      if (fromD) productionDateFilter.gte = fromD;
      if (toD) productionDateFilter.lte = toD;
      if (Object.keys(productionDateFilter).length > 0) {
        compoundWhere.dateOfProduction = productionDateFilter;
      }

      await dbConnect();

      const [batchesRaw, locDistinct] = await Promise.all([
        prisma.compound.findMany({
          where: compoundWhere,
          select: {
            id: true,
            compoundCode: true,
            compoundName: true,
            batch: true,
            location: true,
            dateOfProduction: true,
            totalWeightProducedKg: true,
            weightRemainingKg: true,
            weightConsumedKg: true,
            status: true,
          },
          orderBy: { dateOfProduction: 'desc' },
        }),
        prisma.compound.findMany({
          select: { location: true },
          distinct: ['location'],
          orderBy: { location: 'asc' },
        }),
      ]);

      const availableLocations = [
        ...new Set(
          locDistinct
            .map((r) => r.location.trim())
            .filter((s) => s.length > 0)
        ),
      ].sort((a, b) => a.localeCompare(b));

      const batches: CompoundBatchAnalyticsRow[] = batchesRaw.map((b) => ({
        id: b.id,
        compoundCode: b.compoundCode,
        compoundName: b.compoundName,
        batch: b.batch,
        location: b.location,
        dateOfProduction: b.dateOfProduction,
        totalWeightProducedKg: b.totalWeightProducedKg,
        weightRemainingKg: b.weightRemainingKg,
        weightConsumedKg: b.weightConsumedKg,
        status: b.status,
      }));

      const ids = batches.map((b) => b.id);
      const historyDateFilter: Prisma.DateTimeFilter = {};
      if (fromD) historyDateFilter.gte = fromD;
      if (toD) historyDateFilter.lte = toD;

      const historiesRaw =
        ids.length === 0
          ? []
          : await prisma.compoundHistory.findMany({
              where: {
                actionType: 'BALANCE_UPDATE',
                compoundId: { in: ids },
                ...(Object.keys(historyDateFilter).length > 0
                  ? { createdAt: historyDateFilter }
                  : {}),
              },
              select: {
                createdAt: true,
                compoundId: true,
                weightRemainingBeforeKg: true,
                weightRemainingAfterKg: true,
                compound: { select: { compoundName: true } },
              },
              orderBy: { createdAt: 'asc' },
            });

      const balanceHistory: CompoundBalanceHistoryRow[] = historiesRaw.map((h) => ({
        createdAt: h.createdAt,
        compoundId: h.compoundId,
        compoundName: h.compound.compoundName,
        weightRemainingBeforeKg: h.weightRemainingBeforeKg,
        weightRemainingAfterKg: h.weightRemainingAfterKg,
      }));

      const filters = {
        location: loc && loc.toLowerCase() !== 'all' ? loc : null,
        compoundName: nameQ ?? null,
        from: fromD ? fromD.toISOString() : null,
        to: toD ? toD.toISOString() : null,
        granularity,
        slowDays,
      };

      const data = computeCompoundAnalyticsSummary(
        batches,
        balanceHistory,
        granularity,
        slowDays,
        filters,
        availableLocations
      );

      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/compounds/analytics/summary error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to load compound analytics' },
        { status: 500 }
      );
    }
  });
}
