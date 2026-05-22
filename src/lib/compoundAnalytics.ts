import {
  endOfDay,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import { analyticsChartHex } from '@/lib/analyticsChartColors';

/** Brief §6.2 — extend `FALLBACK_COMPOUND_COLORS` for names not in this map. */
export const COMPOUND_BRAND_COLORS: Record<string, string> = {
  'NK-7': '#378ADD',
  'NK-8': '#1D9E75',
  'SE-10': '#D85A30',
  'DVR-15': '#BA7517',
  'TOT-15': '#7F77DD',
};

export type CompoundAnalyticsGranularity = 'day' | 'week' | 'month';

export type CompoundBatchAnalyticsRow = {
  id: number;
  compoundCode: string;
  compoundName: string;
  batch: string;
  location: string;
  dateOfProduction: Date;
  totalWeightProducedKg: number;
  weightRemainingKg: number;
  weightConsumedKg: number;
  status: string | null;
};

export type CompoundBalanceHistoryRow = {
  createdAt: Date;
  compoundId: number;
  compoundName: string;
  weightRemainingBeforeKg: number | null;
  weightRemainingAfterKg: number | null;
};

export type CompoundByNameAnalytics = {
  compoundName: string;
  batchCount: number;
  producedKg: number;
  inStockKg: number;
  consumedKg: number;
  consumptionRatePct: number;
  /** Single location or "Multiple" when batches differ. */
  locationsDisplay: string;
  oldestProductionAt: string;
};

export type ProductionTimelinePoint = {
  periodKey: string;
  periodLabel: string;
  totalKg: number;
  byCompoundKg: Record<string, number>;
};

export type LocationProductionSlice = {
  location: string;
  producedKg: number;
  shareOfTotalPct: number;
};

export type CompoundBubblePoint = {
  compoundName: string;
  producedKg: number;
  consumptionRatePct: number;
  batchCount: number;
};

export type SlowMovingCompoundAlert = {
  compoundName: string;
  producedKg: number;
  consumptionRatePct: number;
  oldestProductionAt: string;
  daysSinceOldestBatch: number;
};

export type CompoundAnalyticsSummary = {
  filters: {
    location: string | null;
    compoundName: string | null;
    from: string | null;
    to: string | null;
    granularity: CompoundAnalyticsGranularity;
    slowDays: number;
  };
  availableLocations: string[];
  /** Matches brief: RIGHT = produced, LEFT = in-stock (numeric fields in DB). */
  totals: {
    totalProducedKg: number;
    totalInStockKg: number;
    totalConsumedKg: number;
    overallConsumptionRatePct: number;
    totalBatches: number;
  };
  /** Sum(produced) / sum(batch rows). */
  avgBatchSizeKg: number;
  topCompoundByProduction: { compoundName: string; producedKg: number } | null;
  fastestMovingCompound: {
    compoundName: string;
    consumptionRatePct: number;
    consumedKg: number;
  } | null;
  slowMovingAlerts: SlowMovingCompoundAlert[];
  byCompound: CompoundByNameAnalytics[];
  productionTimeline: ProductionTimelinePoint[];
  consumptionTimeline: ProductionTimelinePoint[];
  locationBreakdown: LocationProductionSlice[];
  batchEfficiency: { compoundName: string; avgKgPerBatch: number; batchCount: number }[];
  bubblePoints: CompoundBubblePoint[];
};

export function getCompoundChartColor(compoundName: string): string {
  const key = compoundName.trim();
  if (COMPOUND_BRAND_COLORS[key]) return COMPOUND_BRAND_COLORS[key];
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return analyticsChartHex(h);
}

/** e.g. 20400 → "20.4k" for axis labels. */
export function formatKgCompact(kg: number): string {
  const n = Math.abs(kg);
  if (n >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(kg / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return kg.toFixed(0);
}

export function consumptionRatePercent(producedKg: number, consumedKg: number): number {
  if (producedKg <= 0) return 0;
  return Math.min(100, (consumedKg / producedKg) * 100);
}

function periodKeyAndLabel(
  d: Date,
  granularity: CompoundAnalyticsGranularity
): { periodKey: string; periodLabel: string } {
  if (granularity === 'day') {
    const periodKey = format(d, 'yyyy-MM-dd');
    return { periodKey, periodLabel: format(d, 'MMM d, yyyy') };
  }
  if (granularity === 'week') {
    const w0 = startOfWeek(d, { weekStartsOn: 1 });
    const periodKey = format(w0, 'yyyy-MM-dd');
    return {
      periodKey,
      periodLabel: `Week of ${format(w0, 'MMM d, yyyy')}`,
    };
  }
  const m0 = startOfMonth(d);
  const periodKey = format(m0, 'yyyy-MM');
  return { periodKey, periodLabel: format(m0, 'MMM yyyy') };
}

function bucketDateForGranularity(
  d: Date,
  granularity: CompoundAnalyticsGranularity
): Date {
  if (granularity === 'day') return startOfDay(d);
  if (granularity === 'week') return startOfWeek(d, { weekStartsOn: 1 });
  return startOfMonth(d);
}

export function buildProductionTimeline(
  batches: CompoundBatchAnalyticsRow[],
  granularity: CompoundAnalyticsGranularity
): ProductionTimelinePoint[] {
  const map = new Map<
    string,
    { periodLabel: string; totalKg: number; byCompoundKg: Record<string, number> }
  >();

  for (const b of batches) {
    const bucket = bucketDateForGranularity(b.dateOfProduction, granularity);
    const { periodKey, periodLabel } = periodKeyAndLabel(bucket, granularity);
    let slot = map.get(periodKey);
    if (!slot) {
      slot = { periodLabel, totalKg: 0, byCompoundKg: {} };
      map.set(periodKey, slot);
    }
    const w = b.totalWeightProducedKg;
    slot.totalKg += w;
    slot.byCompoundKg[b.compoundName] = (slot.byCompoundKg[b.compoundName] ?? 0) + w;
  }

  const keys = [...map.keys()].sort((a, b) => a.localeCompare(b));
  return keys.map((periodKey) => {
    const s = map.get(periodKey)!;
    return {
      periodKey,
      periodLabel: s.periodLabel,
      totalKg: s.totalKg,
      byCompoundKg: { ...s.byCompoundKg },
    };
  });
}

export function balanceHistoryConsumptionKg(h: {
  weightRemainingBeforeKg: number | null;
  weightRemainingAfterKg: number | null;
}): number {
  const before = h.weightRemainingBeforeKg;
  const after = h.weightRemainingAfterKg;
  if (before == null || after == null) return 0;
  return Math.max(0, before - after);
}

export function buildConsumptionTimeline(
  rows: CompoundBalanceHistoryRow[],
  granularity: CompoundAnalyticsGranularity
): ProductionTimelinePoint[] {
  const map = new Map<
    string,
    { periodLabel: string; totalKg: number; byCompoundKg: Record<string, number> }
  >();

  for (const r of rows) {
    const delta = balanceHistoryConsumptionKg(r);
    if (delta <= 0) continue;
    const bucket = bucketDateForGranularity(r.createdAt, granularity);
    const { periodKey, periodLabel } = periodKeyAndLabel(bucket, granularity);
    let slot = map.get(periodKey);
    if (!slot) {
      slot = { periodLabel, totalKg: 0, byCompoundKg: {} };
      map.set(periodKey, slot);
    }
    slot.totalKg += delta;
    slot.byCompoundKg[r.compoundName] = (slot.byCompoundKg[r.compoundName] ?? 0) + delta;
  }

  const keys = [...map.keys()].sort((a, b) => a.localeCompare(b));
  return keys.map((periodKey) => {
    const s = map.get(periodKey)!;
    return {
      periodKey,
      periodLabel: s.periodLabel,
      totalKg: s.totalKg,
      byCompoundKg: { ...s.byCompoundKg },
    };
  });
}

export function aggregateByCompound(
  batches: CompoundBatchAnalyticsRow[]
): CompoundByNameAnalytics[] {
  const m = new Map<
    string,
    {
      batchCount: number;
      producedKg: number;
      inStockKg: number;
      consumedKg: number;
      locations: Set<string>;
      oldest: Date | null;
    }
  >();

  for (const b of batches) {
    const name = b.compoundName;
    let row = m.get(name);
    if (!row) {
      row = {
        batchCount: 0,
        producedKg: 0,
        inStockKg: 0,
        consumedKg: 0,
        locations: new Set(),
        oldest: null,
      };
      m.set(name, row);
    }
    row.batchCount += 1;
    row.producedKg += b.totalWeightProducedKg;
    row.inStockKg += b.weightRemainingKg;
    row.consumedKg += b.weightConsumedKg;
    row.locations.add(b.location.trim() || '—');
    const dp = b.dateOfProduction;
    if (!row.oldest || dp < row.oldest) row.oldest = dp;
  }

  return [...m.entries()]
    .map(([compoundName, v]) => {
      const locs = [...v.locations].sort((a, b) => a.localeCompare(b));
      const locationsDisplay = locs.length <= 1 ? (locs[0] ?? '—') : 'Multiple';
      const rate = consumptionRatePercent(v.producedKg, v.consumedKg);
      return {
        compoundName,
        batchCount: v.batchCount,
        producedKg: v.producedKg,
        inStockKg: v.inStockKg,
        consumedKg: v.consumedKg,
        consumptionRatePct: rate,
        locationsDisplay,
        oldestProductionAt: v.oldest ? v.oldest.toISOString() : '',
      };
    })
    .sort((a, b) => b.producedKg - a.producedKg);
}

export function buildLocationBreakdown(
  batches: CompoundBatchAnalyticsRow[]
): LocationProductionSlice[] {
  const m = new Map<string, number>();
  let total = 0;
  for (const b of batches) {
    const loc = b.location.trim() || '—';
    const w = b.totalWeightProducedKg;
    m.set(loc, (m.get(loc) ?? 0) + w);
    total += w;
  }
  const rows = [...m.entries()]
    .map(([location, producedKg]) => ({
      location,
      producedKg,
      shareOfTotalPct: total > 0 ? (producedKg / total) * 100 : 0,
    }))
    .sort((a, b) => b.producedKg - a.producedKg);
  return rows;
}

export function buildBatchEfficiency(byCompound: CompoundByNameAnalytics[]) {
  return byCompound.map((c) => ({
    compoundName: c.compoundName,
    avgKgPerBatch: c.batchCount > 0 ? c.producedKg / c.batchCount : 0,
    batchCount: c.batchCount,
  }));
}

export function buildBubblePoints(byCompound: CompoundByNameAnalytics[]): CompoundBubblePoint[] {
  return byCompound.map((c) => ({
    compoundName: c.compoundName,
    producedKg: c.producedKg,
    consumptionRatePct: c.consumptionRatePct,
    batchCount: c.batchCount,
  }));
}

export function computeCompoundAnalyticsSummary(
  batches: CompoundBatchAnalyticsRow[],
  balanceHistory: CompoundBalanceHistoryRow[],
  granularity: CompoundAnalyticsGranularity,
  slowDays: number,
  filters: CompoundAnalyticsSummary['filters'],
  availableLocations: string[],
  now: Date = new Date()
): CompoundAnalyticsSummary {
  const byCompound = aggregateByCompound(batches);
  const totalProducedKg = batches.reduce((s, b) => s + b.totalWeightProducedKg, 0);
  const totalInStockKg = batches.reduce((s, b) => s + b.weightRemainingKg, 0);
  const totalConsumedKg = batches.reduce((s, b) => s + b.weightConsumedKg, 0);
  const totalBatches = batches.length;
  const overallConsumptionRatePct = consumptionRatePercent(totalProducedKg, totalConsumedKg);
  const avgBatchSizeKg = totalBatches > 0 ? totalProducedKg / totalBatches : 0;

  let topCompoundByProduction: CompoundAnalyticsSummary['topCompoundByProduction'] = null;
  if (byCompound.length > 0) {
    const t = byCompound[0];
    topCompoundByProduction = { compoundName: t.compoundName, producedKg: t.producedKg };
  }

  let fastestMovingCompound: CompoundAnalyticsSummary['fastestMovingCompound'] = null;
  for (const c of byCompound) {
    if (c.producedKg <= 0) continue;
    if (
      !fastestMovingCompound ||
      c.consumptionRatePct > fastestMovingCompound.consumptionRatePct ||
      (c.consumptionRatePct === fastestMovingCompound.consumptionRatePct &&
        c.consumedKg > fastestMovingCompound.consumedKg)
    ) {
      fastestMovingCompound = {
        compoundName: c.compoundName,
        consumptionRatePct: c.consumptionRatePct,
        consumedKg: c.consumedKg,
      };
    }
  }

  const msPerDay = 86400000;
  const slowMovingAlerts: SlowMovingCompoundAlert[] = [];
  for (const c of byCompound) {
    if (c.consumptionRatePct >= 0.01 || !c.oldestProductionAt) continue;
    const oldest = new Date(c.oldestProductionAt);
    const daysSince = Math.floor((now.getTime() - oldest.getTime()) / msPerDay);
    if (daysSince >= slowDays) {
      slowMovingAlerts.push({
        compoundName: c.compoundName,
        producedKg: c.producedKg,
        consumptionRatePct: c.consumptionRatePct,
        oldestProductionAt: c.oldestProductionAt,
        daysSinceOldestBatch: daysSince,
      });
    }
  }
  slowMovingAlerts.sort((a, b) => b.daysSinceOldestBatch - a.daysSinceOldestBatch);

  return {
    filters,
    availableLocations,
    totals: {
      totalProducedKg,
      totalInStockKg,
      totalConsumedKg,
      overallConsumptionRatePct,
      totalBatches,
    },
    avgBatchSizeKg,
    topCompoundByProduction,
    fastestMovingCompound,
    slowMovingAlerts,
    byCompound,
    productionTimeline: buildProductionTimeline(batches, granularity),
    consumptionTimeline: buildConsumptionTimeline(balanceHistory, granularity),
    locationBreakdown: buildLocationBreakdown(batches),
    batchEfficiency: buildBatchEfficiency(byCompound),
    bubblePoints: buildBubblePoints(byCompound),
  };
}

export function parseOptionalDateBoundary(
  value: string | null | undefined,
  end: boolean
): Date | null {
  if (value == null || value.trim() === '') return null;
  const v = value.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  const d = m
    ? new Date(
        Number(m[1]),
        Number(m[2]) - 1,
        Number(m[3]),
        end ? 23 : 0,
        end ? 59 : 0,
        end ? 59 : 0,
        end ? 999 : 0
      )
    : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  if (m) return d;
  return end ? endOfDay(d) : startOfDay(d);
}
