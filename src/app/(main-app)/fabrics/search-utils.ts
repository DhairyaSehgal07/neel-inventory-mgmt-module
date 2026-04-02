import type { FabricRow } from "./columns"

export function fabricSearchableString(row: FabricRow): string {
  const parts = [
    row.id,
    row.fabricDate,
    row.fabricCode,
    row.nameOfVendor,
    row.fabricLengthInitial,
    row.fabricLengthCurrent,
    row.fabricWidthInitial,
    row.fabricWidthCurrent,
    row.gsmObserved,
    row.gsmCalculated,
    row.netWeight,
    row.fabricType?.name,
    row.fabricStrength?.name,
    row.fabricWidth?.value,
    row.status,
  ]
  return parts.filter(Boolean).join(" ").toLowerCase()
}

/** Full-text filter used by the fabrics table search (not paginated). */
export function filterFabricsBySearch(
  rows: FabricRow[],
  query: string
): FabricRow[] {
  if (!query.trim()) return rows
  const q = query.toLowerCase().trim()
  return rows.filter((row) => fabricSearchableString(row).includes(q))
}
