import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { balanceHistoryConsumptionBags, balanceHistoryConsumptionKg } from '@/lib/rawMaterialBalance';
import {
  gradeDisplay,
  materialGradeKey,
  type RawMaterialAnalyticsGranularity,
  type RawMaterialAnalyticsQueryParams,
} from '@/lib/rawMaterialAnalyticsQuery';

export const RAW_MATERIAL_CHART_COLORS = [
  '#378ADD',
  '#1D9E75',
  '#D85A30',
  '#BA7517',
  '#7F77DD',
  '#6366f1',
  '#db2777',
  '#0891b2',
] as const;

export function getRawMaterialChartColor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return RAW_MATERIAL_CHART_COLORS[h % RAW_MATERIAL_CHART_COLORS.length];
}

export function formatKgCompact(kg: number): string {
  const n = Math.abs(kg);
  if (n >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(kg / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return kg.toFixed(0);
}

export type RawMaterialBatchRow = {
  id: number;
  materialCode: string;
  rawMaterial: string;
  grade: string | null;
  location: string | null;
  date: Date;
  purchasedBags: number;
  availableBags: number;
  purchasedWeightKg: number;
  availableWeightKg: number;
  weightPerUnit: number;
  status: string;
  packedAt: Date | null;
};

export type RawMaterialBalanceHistoryRow = {
  createdAt: Date;
  rawMaterialId: number;
  rawMaterial: string;
  grade: string | null;
  availableBagsBefore: number | null;
  availableBagsAfter: number | null;
  availableWeightKgBefore: number | null;
  availableWeightKgAfter: number | null;
};

export type ConsumptionTimelineSegment = {
  segmentKey: string;
  segmentLabel: string;
  consumptionKg: number;
};

export type ConsumptionTimelineBucket = {
  periodKey: string;
  periodLabel: string;
  totalKg: number;
  segments: ConsumptionTimelineSegment[];
};

export type MaterialGradeConsumptionRow = {
  material: string;
  grade: string;
  gradeKey: string;
  bagsConsumed: number;
  weightConsumedKg: number;
  pctOfTotal: number;
  avgPerMonthKg: number;
};

export type MaterialConsumptionGroup = {
  material: string;
  totalWeightConsumedKg: number;
  grades: MaterialGradeConsumptionRow[];
};

export type MasterComparisonRow = {
  material: string;
  grade: string;
  procuredKg: number;
  inStockKg: number;
  consumedKg: number;
  avgDailyConsumptionKg: number | null;
  daysOfStockRemaining: number | null;
};

export type PackedAgingBucket = 'fresh' | 'aging' | 'overdue';

export type PackedAgingItem = {
  batchCode: string;
  material: string;
  grade: string;
  location: string;
  packedAt: string;
  ageDays: number;
  bucket: PackedAgingBucket;
  availableWeightKg: number;
  rawMaterialId: number;
};

export type PackedAgingSummary = {
  bucket: PackedAgingBucket;
  label: string;
  count: number;
  totalKg: number;
};

export type LowStockAlert = {
  material: string;
  grade: string;
  daysRemaining: number | null;
  inStockKg: number;
  avgDailyKg: number | null;
  alertKey: string;
};

export type LocationUtilRow = {
  location: string;
  totalBags: number;
  totalKg: number;
  distinctMaterials: number;
  shareOfTotalPct: number;
};

export type ForecastPoint = {
  date: string;
  label: string;
  actualKg: number | null;
  forecastKg: number | null;
};

export type ConsumptionForecastSeries = {
  material: string;
  grade: string;
  seriesKey: string;
  avgDailyKg: number;
  inStockKg: number;
  projectedStockoutDate: string | null;
  points: ForecastPoint[];
  hasEnoughHistory: boolean;
};

function periodKeyAndLabel(
  d: Date,
  granularity: RawMaterialAnalyticsGranularity
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
  granularity: RawMaterialAnalyticsGranularity
): Date {
  if (granularity === 'day') return startOfDay(d);
  if (granularity === 'week') return startOfWeek(d, { weekStartsOn: 1 });
  return startOfMonth(d);
}

export function packedAgingBucket(ageDays: number): PackedAgingBucket {
  if (ageDays >= 120) return 'overdue';
  if (ageDays >= 60) return 'aging';
  return 'fresh';
}

export function packedAgingBucketLabel(bucket: PackedAgingBucket): string {
  switch (bucket) {
    case 'fresh':
      return 'Fresh (0–60 d)';
    case 'aging':
      return 'Aging (60–120 d)';
    case 'overdue':
      return 'Overdue (120+ d)';
  }
}

export function buildConsumptionTimeline(
  rows: RawMaterialBalanceHistoryRow[],
  granularity: RawMaterialAnalyticsGranularity,
  from: Date,
  to: Date
): ConsumptionTimelineBucket[] {
  const map = new Map<
    string,
    { periodLabel: string; segments: Map<string, { label: string; kg: number }>; totalKg: number }
  >();

  for (const r of rows) {
    if (r.createdAt < from || r.createdAt > to) continue;
    const delta = balanceHistoryConsumptionKg(r);
    if (delta <= 0) continue;
    const bucket = bucketDateForGranularity(r.createdAt, granularity);
    const { periodKey, periodLabel } = periodKeyAndLabel(bucket, granularity);
    const segKey = materialGradeKey(r.rawMaterial, r.grade);
    const segLabel = `${r.rawMaterial} · ${gradeDisplay(r.grade)}`;

    let slot = map.get(periodKey);
    if (!slot) {
      slot = { periodLabel, segments: new Map(), totalKg: 0 };
      map.set(periodKey, slot);
    }
    slot.totalKg += delta;
    const prev = slot.segments.get(segKey);
    if (prev) {
      prev.kg += delta;
    } else {
      slot.segments.set(segKey, { label: segLabel, kg: delta });
    }
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodKey, s]) => ({
      periodKey,
      periodLabel: s.periodLabel,
      totalKg: s.totalKg,
      segments: [...s.segments.entries()].map(([segmentKey, v]) => ({
        segmentKey,
        segmentLabel: v.label,
        consumptionKg: v.kg,
      })),
    }));
}

export function aggregateConsumptionByMaterialGrade(
  history: RawMaterialBalanceHistoryRow[],
  from: Date,
  to: Date,
  selectedPeriod: string | null,
  granularity: RawMaterialAnalyticsGranularity
): { groups: MaterialConsumptionGroup[]; monthCount: number } {
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const monthCount = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / monthMs));

  const byKey = new Map<
    string,
    { material: string; grade: string; bags: number; kg: number }
  >();

  for (const r of history) {
    if (r.createdAt < from || r.createdAt > to) continue;
    if (selectedPeriod) {
      const { periodKey } = periodKeyAndLabel(
        bucketDateForGranularity(r.createdAt, granularity),
        granularity
      );
      if (periodKey !== selectedPeriod) continue;
    }
    const kg = balanceHistoryConsumptionKg(r);
    const bags = balanceHistoryConsumptionBags(r);
    if (kg <= 0 && bags <= 0) continue;
    const key = materialGradeKey(r.rawMaterial, r.grade);
    let row = byKey.get(key);
    if (!row) {
      row = {
        material: r.rawMaterial,
        grade: gradeDisplay(r.grade),
        bags: 0,
        kg: 0,
      };
      byKey.set(key, row);
    }
    row.bags += bags;
    row.kg += kg;
  }

  const totalKg = [...byKey.values()].reduce((s, r) => s + r.kg, 0);
  const byMaterial = new Map<string, MaterialGradeConsumptionRow[]>();

  for (const [gradeKey, v] of byKey) {
    const pct = totalKg > 0 ? (v.kg / totalKg) * 100 : 0;
    const row: MaterialGradeConsumptionRow = {
      material: v.material,
      grade: v.grade,
      gradeKey,
      bagsConsumed: v.bags,
      weightConsumedKg: v.kg,
      pctOfTotal: pct,
      avgPerMonthKg: v.kg / monthCount,
    };
    const list = byMaterial.get(v.material) ?? [];
    list.push(row);
    byMaterial.set(v.material, list);
  }

  const groups: MaterialConsumptionGroup[] = [...byMaterial.entries()]
    .map(([material, grades]) => {
      grades.sort((a, b) => b.weightConsumedKg - a.weightConsumedKg);
      const totalWeightConsumedKg = grades.reduce((s, g) => s + g.weightConsumedKg, 0);
      return { material, totalWeightConsumedKg, grades };
    })
    .sort((a, b) => b.totalWeightConsumedKg - a.totalWeightConsumedKg);

  return { groups, monthCount };
}

export function buildMasterComparisonRows(
  batches: RawMaterialBatchRow[],
  history: RawMaterialBalanceHistoryRow[],
  from: Date,
  to: Date
): MasterComparisonRow[] {
  const windowDays = Math.max(1, differenceInCalendarDays(to, from) + 1);
  const now = new Date();

  const byKey = new Map<
    string,
    {
      material: string;
      grade: string;
      procuredKg: number;
      inStockKg: number;
      consumedLifetimeKg: number;
      consumedWindowKg: number;
      firstActivity: Date | null;
    }
  >();

  for (const b of batches) {
    const key = materialGradeKey(b.rawMaterial, b.grade);
    let row = byKey.get(key);
    if (!row) {
      row = {
        material: b.rawMaterial,
        grade: gradeDisplay(b.grade),
        procuredKg: 0,
        inStockKg: 0,
        consumedLifetimeKg: 0,
        consumedWindowKg: 0,
        firstActivity: b.date,
      };
      byKey.set(key, row);
    }
    row.procuredKg += b.purchasedWeightKg;
    row.inStockKg += b.availableWeightKg;
    row.consumedLifetimeKg += Math.max(0, b.purchasedWeightKg - b.availableWeightKg);
    if (!row.firstActivity || b.date < row.firstActivity) row.firstActivity = b.date;
  }

  for (const h of history) {
    if (h.createdAt < from || h.createdAt > to) continue;
    const key = materialGradeKey(h.rawMaterial, h.grade);
    let row = byKey.get(key);
    if (!row) {
      row = {
        material: h.rawMaterial,
        grade: gradeDisplay(h.grade),
        procuredKg: 0,
        inStockKg: 0,
        consumedLifetimeKg: 0,
        consumedWindowKg: 0,
        firstActivity: h.createdAt,
      };
      byKey.set(key, row);
    }
    row.consumedWindowKg += balanceHistoryConsumptionKg(h);
    if (!row.firstActivity || h.createdAt < row.firstActivity) row.firstActivity = h.createdAt;
  }

  return [...byKey.values()]
    .map((r) => {
      let avgDaily: number | null = null;
      if (r.consumedWindowKg > 0) {
        avgDaily = r.consumedWindowKg / windowDays;
      } else if (r.consumedLifetimeKg > 0 && r.firstActivity) {
        const days = Math.max(
          1,
          differenceInCalendarDays(now, startOfDay(r.firstActivity)) + 1
        );
        avgDaily = r.consumedLifetimeKg / days;
      }
      const daysRemaining =
        avgDaily != null && avgDaily > 1e-9 ? r.inStockKg / avgDaily : null;
      return {
        material: r.material,
        grade: r.grade,
        procuredKg: r.procuredKg,
        inStockKg: r.inStockKg,
        consumedKg: r.consumedLifetimeKg,
        avgDailyConsumptionKg: avgDaily,
        daysOfStockRemaining: daysRemaining,
      };
    })
    .sort((a, b) => a.material.localeCompare(b.material) || a.grade.localeCompare(b.grade));
}

export function buildPackedAging(
  batches: RawMaterialBatchRow[],
  bucketFilter: string,
  asOf: Date = new Date()
): { summaries: PackedAgingSummary[]; items: PackedAgingItem[] } {
  const packed = batches.filter((b) => b.status === 'PACKED' && b.packedAt != null);

  const items: PackedAgingItem[] = packed
    .map((b) => {
      const packedAt = b.packedAt!;
      const ageDays = Math.max(0, differenceInCalendarDays(asOf, packedAt));
      const bucket = packedAgingBucket(ageDays);
      return {
        batchCode: b.materialCode,
        material: b.rawMaterial,
        grade: gradeDisplay(b.grade),
        location: b.location?.trim() || '—',
        packedAt: packedAt.toISOString(),
        ageDays,
        bucket,
        availableWeightKg: b.availableWeightKg,
        rawMaterialId: b.id,
      };
    })
    .filter((item) => {
      if (!bucketFilter || bucketFilter === 'all') return true;
      return item.bucket === bucketFilter;
    })
    .sort((a, b) => b.ageDays - a.ageDays);

  const buckets: PackedAgingBucket[] = ['fresh', 'aging', 'overdue'];
  const summaries: PackedAgingSummary[] = buckets.map((bucket) => {
    const inBucket = packed
      .map((b) => {
        const ageDays = Math.max(0, differenceInCalendarDays(asOf, b.packedAt!));
        return { bucket: packedAgingBucket(ageDays), kg: b.availableWeightKg };
      })
      .filter((x) => x.bucket === bucket);
    return {
      bucket,
      label: packedAgingBucketLabel(bucket),
      count: inBucket.length,
      totalKg: inBucket.reduce((s, x) => s + x.kg, 0),
    };
  });

  return { summaries, items };
}

export function buildLowStockAlerts(
  comparison: MasterComparisonRow[],
  thresholdDays: number
): LowStockAlert[] {
  return comparison
    .filter(
      (r) =>
        r.inStockKg > 1e-6 &&
        r.daysOfStockRemaining != null &&
        r.daysOfStockRemaining < thresholdDays
    )
    .map((r) => ({
      material: r.material,
      grade: r.grade,
      daysRemaining: r.daysOfStockRemaining,
      inStockKg: r.inStockKg,
      avgDailyKg: r.avgDailyConsumptionKg,
      alertKey: `${r.material}|${r.grade}`,
    }))
    .sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0));
}

export function buildLocationUtilisation(
  batches: RawMaterialBatchRow[],
  materialFilter: string
): LocationUtilRow[] {
  let rows = batches;
  const mat = materialFilter.trim();
  if (mat && mat.toLowerCase() !== 'all') {
    rows = rows.filter((b) => b.rawMaterial.toLowerCase() === mat.toLowerCase());
  }

  const m = new Map<
    string,
    { bags: number; kg: number; materials: Set<string> }
  >();
  let totalKg = 0;

  for (const b of rows) {
    const loc = b.location?.trim() || '—';
    let slot = m.get(loc);
    if (!slot) {
      slot = { bags: 0, kg: 0, materials: new Set() };
      m.set(loc, slot);
    }
    slot.bags += b.availableBags;
    slot.kg += b.availableWeightKg;
    slot.materials.add(b.rawMaterial);
    totalKg += b.availableWeightKg;
  }

  return [...m.entries()]
    .map(([location, v]) => ({
      location,
      totalBags: v.bags,
      totalKg: v.kg,
      distinctMaterials: v.materials.size,
      shareOfTotalPct: totalKg > 0 ? (v.kg / totalKg) * 100 : 0,
    }))
    .sort((a, b) => b.totalKg - a.totalKg);
}

export function buildConsumptionForecast(
  batches: RawMaterialBatchRow[],
  history: RawMaterialBalanceHistoryRow[],
  forecastWindowDays: 30 | 60 | 90,
  asOf: Date = new Date()
): ConsumptionForecastSeries[] {
  const windowStart = startOfDay(addDays(asOf, -forecastWindowDays));
  const windowEnd = endOfDay(asOf);

  const bySeries = new Map<
    string,
    {
      material: string;
      grade: string;
      inStockKg: number;
      daily: Map<string, number>;
    }
  >();

  for (const b of batches) {
    const key = materialGradeKey(b.rawMaterial, b.grade);
    let s = bySeries.get(key);
    if (!s) {
      s = {
        material: b.rawMaterial,
        grade: gradeDisplay(b.grade),
        inStockKg: 0,
        daily: new Map(),
      };
      bySeries.set(key, s);
    }
    s.inStockKg += b.availableWeightKg;
  }

  for (const h of history) {
    if (h.createdAt < windowStart || h.createdAt > windowEnd) continue;
    const key = materialGradeKey(h.rawMaterial, h.grade);
    let s = bySeries.get(key);
    if (!s) {
      s = {
        material: h.rawMaterial,
        grade: gradeDisplay(h.grade),
        inStockKg: 0,
        daily: new Map(),
      };
      bySeries.set(key, s);
    }
    const dayKey = format(startOfDay(h.createdAt), 'yyyy-MM-dd');
    const delta = balanceHistoryConsumptionKg(h);
    if (delta > 0) {
      s.daily.set(dayKey, (s.daily.get(dayKey) ?? 0) + delta);
    }
  }

  const series: ConsumptionForecastSeries[] = [];

  for (const [seriesKey, s] of bySeries) {
    const totalConsumed = [...s.daily.values()].reduce((a, b) => a + b, 0);
    const daysWithData = s.daily.size;
    const avgDailyKg =
      daysWithData > 0 ? totalConsumed / forecastWindowDays : 0;
    const hasEnoughHistory = daysWithData >= 3 && totalConsumed > 0;

    const actualPoints: ForecastPoint[] = [...s.daily.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, kg]) => ({
        date,
        label: format(parseDate(date), 'MMM d'),
        actualKg: kg,
        forecastKg: null,
      }));

    const forecastPoints: ForecastPoint[] = [];
    let projectedStockoutDate: string | null = null;

    if (hasEnoughHistory && avgDailyKg > 1e-9) {
      let stock = s.inStockKg;
      for (let i = 1; i <= forecastWindowDays; i += 1) {
        const d = addDays(asOf, i);
        stock -= avgDailyKg;
        const date = format(startOfDay(d), 'yyyy-MM-dd');
        forecastPoints.push({
          date,
          label: format(d, 'MMM d'),
          actualKg: null,
          forecastKg: Math.max(0, stock + avgDailyKg),
        });
        if (projectedStockoutDate == null && stock <= 0) {
          projectedStockoutDate = d.toISOString();
        }
      }
    }

    series.push({
      material: s.material,
      grade: s.grade,
      seriesKey,
      avgDailyKg,
      inStockKg: s.inStockKg,
      projectedStockoutDate,
      points: [...actualPoints, ...forecastPoints],
      hasEnoughHistory,
    });
  }

  return series.sort((a, b) => a.material.localeCompare(b.material));
}

function parseDate(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export type RawMaterialAnalyticsLoadResult = {
  batches: RawMaterialBatchRow[];
  history: RawMaterialBalanceHistoryRow[];
  filters: RawMaterialAnalyticsQueryParams;
  materials: string[];
  grades: string[];
  locations: string[];
};

export function mapBatchRow(b: {
  id: number;
  materialCode: string;
  rawMaterial: string;
  grade: string | null;
  location: string | null;
  date: Date;
  purchasedBags: number;
  availableBags: number;
  purchasedWeightKg: number;
  availableWeightKg: number;
  weightPerUnit: number;
  status: string;
  packedAt: Date | null;
}): RawMaterialBatchRow {
  return {
    id: b.id,
    materialCode: b.materialCode,
    rawMaterial: b.rawMaterial,
    grade: b.grade,
    location: b.location,
    date: b.date,
    purchasedBags: b.purchasedBags,
    availableBags: b.availableBags,
    purchasedWeightKg: b.purchasedWeightKg,
    availableWeightKg: b.availableWeightKg,
    weightPerUnit: b.weightPerUnit,
    status: b.status,
    packedAt: b.packedAt,
  };
}
