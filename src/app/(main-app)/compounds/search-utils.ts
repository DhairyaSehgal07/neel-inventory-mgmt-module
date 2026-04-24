import type { CompoundRow } from './columns';

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function filterCompoundsBySearch(rows: CompoundRow[], query: string): CompoundRow[] {
  const q = normalize(query);
  if (!q) return rows;
  return rows.filter((row) => {
    const hay = [
      row.compoundCode,
      row.compoundName,
      String(row.batchCount),
      row.location,
      row.createdBy,
      row.assignTo ?? '',
      row.status ?? '',
      String(row.id),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}
