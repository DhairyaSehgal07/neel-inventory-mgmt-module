import { endOfDay, parseISO, startOfDay, subMonths } from 'date-fns';
import type { Prisma } from '@/generated/prisma/client';

export type RawMaterialAnalyticsGranularity = 'day' | 'week' | 'month';

export type RawMaterialAnalyticsFilterParams = {
  material: string;
  grade: string;
  location: string;
  bucket: string;
};

export type RawMaterialAnalyticsDateRange = {
  from: Date;
  to: Date;
};

export type RawMaterialAnalyticsQueryParams = RawMaterialAnalyticsFilterParams &
  RawMaterialAnalyticsDateRange & {
    granularity: RawMaterialAnalyticsGranularity;
    lowStockDays: number;
    forecastWindowDays: 30 | 60 | 90;
    selectedPeriod: string | null;
  };

export function parseRawMaterialAnalyticsFilters(
  sp: URLSearchParams
): RawMaterialAnalyticsFilterParams {
  return {
    material: sp.get('material')?.trim() ?? '',
    grade: sp.get('grade')?.trim() ?? '',
    location: sp.get('location')?.trim() ?? '',
    bucket: sp.get('bucket')?.trim() ?? '',
  };
}

export function parseRawMaterialAnalyticsDateRange(sp: URLSearchParams): RawMaterialAnalyticsDateRange {
  const defaultTo = endOfDay(new Date());
  const defaultFrom = startOfDay(subMonths(defaultTo, 6));

  const fromStr = sp.get('from');
  const toStr = sp.get('to');

  let from = defaultFrom;
  let to = defaultTo;

  if (fromStr) {
    try {
      from = startOfDay(parseISO(fromStr));
    } catch {
      /* keep default */
    }
  }
  if (toStr) {
    try {
      to = endOfDay(parseISO(toStr));
    } catch {
      /* keep default */
    }
  }

  if (from > to) {
    return { from: defaultFrom, to: defaultTo };
  }

  return { from, to };
}

export function parseGranularity(v: string | null): RawMaterialAnalyticsGranularity {
  if (v === 'day' || v === 'week' || v === 'month') return v;
  return 'month';
}

export function parseForecastWindow(v: string | null): 30 | 60 | 90 {
  const n = parseInt(v ?? '30', 10);
  if (n === 60 || n === 90) return n;
  return 30;
}

export function parseLowStockDays(v: string | null): number {
  const n = parseInt(v ?? '14', 10);
  if (Number.isNaN(n) || n < 1) return 14;
  return Math.min(n, 365);
}

export function parseRawMaterialAnalyticsQuery(sp: URLSearchParams): RawMaterialAnalyticsQueryParams {
  const filters = parseRawMaterialAnalyticsFilters(sp);
  const range = parseRawMaterialAnalyticsDateRange(sp);
  return {
    ...filters,
    ...range,
    granularity: parseGranularity(sp.get('granularity')),
    lowStockDays: parseLowStockDays(sp.get('lowStockDays')),
    forecastWindowDays: parseForecastWindow(sp.get('forecastWindow')),
    selectedPeriod: sp.get('selectedPeriod')?.trim() || null,
  };
}

export function gradeDisplay(grade: string | null | undefined): string {
  const g = grade?.trim();
  return g && g.length > 0 ? g : '—';
}

export function materialGradeKey(rawMaterial: string, grade: string | null | undefined): string {
  return `${rawMaterial}|${gradeDisplay(grade)}`;
}

/** Prisma where for batch list / analytics. */
export function buildRawMaterialPrismaWhere(
  filters: RawMaterialAnalyticsFilterParams
): Prisma.RawMaterialWhereInput {
  const clauses: Prisma.RawMaterialWhereInput[] = [];
  const mat = filters.material.trim();
  if (mat && mat.toLowerCase() !== 'all') {
    clauses.push({ rawMaterial: { equals: mat, mode: 'insensitive' } });
  }
  const gr = filters.grade.trim();
  if (gr && gr.toLowerCase() !== 'all') {
    if (gr === '—' || gr === '-') {
      clauses.push({ OR: [{ grade: null }, { grade: '' }] });
    } else {
      clauses.push({ grade: { equals: gr, mode: 'insensitive' } });
    }
  }
  const loc = filters.location.trim();
  if (loc && loc.toLowerCase() !== 'all') {
    clauses.push({ location: { equals: loc, mode: 'insensitive' } });
  }
  if (clauses.length === 0) return {};
  return { AND: clauses };
}

export function parseOptionalDateBoundary(
  iso: string | null,
  endOfDayBound: boolean
): Date | null {
  if (!iso?.trim()) return null;
  try {
    const d = parseISO(iso);
    return endOfDayBound ? endOfDay(d) : startOfDay(d);
  } catch {
    return null;
  }
}
