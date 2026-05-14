import { endOfDay, parseISO, startOfDay, subMonths } from 'date-fns';
import { Prisma } from '@/generated/prisma/client';

export type FabricAnalyticsFilterParams = {
  locationKey: string;
  fabricCodeContains: string;
};

/** Parse shared fabric analytics query params from a URLSearchParams-like object. */
export function parseFabricAnalyticsFilters(sp: URLSearchParams): FabricAnalyticsFilterParams {
  const loc = sp.get('location')?.trim() ?? 'all';
  return {
    locationKey: loc === '' ? 'all' : loc,
    fabricCodeContains: sp.get('fabricCode')?.trim() ?? '',
  };
}

export function parseFabricAnalyticsDateRange(sp: URLSearchParams): { from: Date; to: Date } {
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

function splitLocationKey(locationKey: string): { area: string; floor: string } | null {
  if (locationKey === 'all') return null;
  const pipe = locationKey.indexOf('|');
  if (pipe < 0) return { area: locationKey, floor: '' };
  return {
    area: locationKey.slice(0, pipe),
    floor: locationKey.slice(pipe + 1),
  };
}

/** Prisma `where` fragment for fabrics list / groupBy (AND with your base where). */
export function buildFabricAnalyticsPrismaWhere(
  filters: FabricAnalyticsFilterParams
): Prisma.FabricWhereInput {
  const clauses: Prisma.FabricWhereInput[] = [];
  const code = filters.fabricCodeContains.trim();
  if (code) {
    clauses.push({ fabricCode: { contains: code, mode: 'insensitive' } });
  }
  const loc = splitLocationKey(filters.locationKey);
  if (loc) {
    clauses.push({
      locations: {
        some: { area: loc.area, floor: loc.floor },
      },
    });
  }
  if (clauses.length === 0) return {};
  return { AND: clauses };
}

/** SQL boolean fragment for `fabrics f` — use inside WHERE (...). */
export function fabricAnalyticsFabricFiltersSql(filters: FabricAnalyticsFilterParams): Prisma.Sql {
  const parts: Prisma.Sql[] = [];

  const code = filters.fabricCodeContains.trim();
  if (code) {
    const escaped = code.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const pattern = `%${escaped}%`;
    parts.push(Prisma.sql`f."fabricCode" ILIKE ${pattern}`);
  }

  const loc = splitLocationKey(filters.locationKey);
  if (loc) {
    parts.push(
      Prisma.sql`EXISTS (
        SELECT 1 FROM locations l
        WHERE l."fabricId" = f.id
          AND l.area = ${loc.area}
          AND l.floor = ${loc.floor}
      )`
    );
  }

  if (parts.length === 0) return Prisma.sql`true`;
  if (parts.length === 1) return parts[0]!;
  return Prisma.join(parts, ' AND ');
}
