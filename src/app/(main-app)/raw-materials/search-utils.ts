import type { RawMaterialRow } from './columns';

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function filterRawMaterialsBySearch(rows: RawMaterialRow[], query: string): RawMaterialRow[] {
  const q = normalize(query);
  if (!q) return rows;
  return rows.filter((row) => {
    const hay = [
      row.materialCode,
      row.rawMaterial,
      row.units,
      row.location ?? '',
      row.createdBy,
      row.vendor ?? '',
      row.grade ?? '',
      row.status ?? '',
      String(row.id),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}
