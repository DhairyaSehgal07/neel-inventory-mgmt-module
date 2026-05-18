import { format } from 'date-fns';

import type { RawMaterialRow } from './columns';

export const RAW_MATERIAL_REPORT_COLUMNS = [
  { key: 'materialCode', header: 'Code' },
  { key: 'rawMaterial', header: 'Material' },
  { key: 'vendor', header: 'Vendor' },
  { key: 'date', header: 'Date' },
  { key: 'availableBags', header: 'Avail. bags' },
  { key: 'purchasedBags', header: 'Purch. bags' },
  { key: 'availableKg', header: 'Avail. (kg)' },
  { key: 'purchasedKg', header: 'Purch. (kg)' },
  { key: 'location', header: 'Location' },
  { key: 'status', header: 'Status' },
] as const;

export type RawMaterialReportColumnKey = (typeof RAW_MATERIAL_REPORT_COLUMNS)[number]['key'];

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

export function buildRawMaterialReportCellValues(
  r: RawMaterialRow
): Record<RawMaterialReportColumnKey, string> {
  let dateStr = '—';
  try {
    dateStr = format(new Date(r.date), 'MMM d, yyyy');
  } catch {
    dateStr = truncate(String(r.date ?? '—'), 14);
  }

  const fmt = (n: number) =>
    Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—';

  return {
    materialCode: r.materialCode || '—',
    rawMaterial: truncate(r.rawMaterial ?? '—', 28),
    vendor: truncate((r.vendor || '—').trim() || '—', 20),
    date: dateStr,
    availableBags: fmt(r.availableBags),
    purchasedBags: fmt(r.purchasedBags),
    availableKg: fmt(r.availableWeightKg),
    purchasedKg: fmt(r.purchasedWeightKg),
    location: truncate((r.location || '—').trim() || '—', 20),
    status: truncate(r.status ?? '—', 12),
  };
}

export type RawMaterialReportCategoryId =
  | 'all'
  | 'OPEN'
  | 'IN_USE'
  | 'PACKED'
  | 'CONSUMED'
  | 'TRADED'
  | 'REJECTED'
  | 'ASSIGNED';

export function prepareRawMaterialsForCategoryReport(
  rows: RawMaterialRow[],
  categoryId: RawMaterialReportCategoryId
): RawMaterialRow[] {
  let result = rows;
  if (categoryId !== 'all') {
    result = result.filter((row) => (row.status ?? '') === categoryId);
  }
  return [...result].sort((a, b) => {
    const ta = Date.parse(a.date);
    const tb = Date.parse(b.date);
    if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return tb - ta;
    return b.id - a.id;
  });
}
