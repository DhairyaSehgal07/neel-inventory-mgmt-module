import { format } from 'date-fns';

import type { CompoundRow } from './columns';

export const COMPOUND_REPORT_COLUMNS = [
  { key: 'compoundCode', header: 'Code' },
  { key: 'compoundName', header: 'Name' },
  { key: 'batch', header: 'Batch' },
  { key: 'dateOfProduction', header: 'Produced' },
  { key: 'weightRemaining', header: 'Rem. (kg)' },
  { key: 'weightTotal', header: 'Total (kg)' },
  { key: 'location', header: 'Location' },
  { key: 'assignTo', header: 'Assigned To' },
  { key: 'status', header: 'Status' },
] as const;

export type CompoundReportColumnKey = (typeof COMPOUND_REPORT_COLUMNS)[number]['key'];

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/** Cell strings aligned with the compounds table / PDF report. */
export function buildCompoundReportCellValues(
  c: CompoundRow
): Record<CompoundReportColumnKey, string> {
  let produced = '—';
  try {
    produced = format(new Date(c.dateOfProduction), 'MMM d, yyyy');
  } catch {
    produced = truncate(String(c.dateOfProduction ?? '—'), 14);
  }

  const rem = c.weightRemainingKg;
  const tot = c.totalWeightProducedKg;

  return {
    compoundCode: c.compoundCode || '—',
    compoundName: truncate(c.compoundName ?? '—', 28),
    batch: String(c.batchCount ?? c.batch ?? '—'),
    dateOfProduction: produced,
    weightRemaining: Number.isFinite(rem)
      ? rem.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : '—',
    weightTotal: Number.isFinite(tot)
      ? tot.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : '—',
    location: truncate((c.location || '—').trim() || '—', 24),
    assignTo: truncate(c.assignTo ?? '—', 16),
    status: truncate(c.status ?? '—', 12),
  };
}

export type CompoundReportCategoryId =
  | 'all'
  | 'OPEN'
  | 'IN_USE'
  | 'PACKED'
  | 'CONSUMED'
  | 'TRADED'
  | 'REJECTED';

export function prepareCompoundsForCategoryReport(
  compounds: CompoundRow[],
  categoryId: CompoundReportCategoryId,
  statusFilter?: readonly string[] | null
): CompoundRow[] {
  let result = compounds;
  if (categoryId !== 'all') {
    result = result.filter((row) => (row.status ?? '') === categoryId);
  } else if (statusFilter && statusFilter.length > 0) {
    const allowed = new Set(statusFilter);
    result = result.filter((row) => allowed.has(row.status ?? ''));
  }
  return [...result].sort((a, b) => {
    const ta = Date.parse(a.dateOfProduction);
    const tb = Date.parse(b.dateOfProduction);
    if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return tb - ta;
    return b.id - a.id;
  });
}
