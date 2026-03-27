import type { FabricRow } from "./columns"

export const FABRIC_REPORT_COLUMNS = [
  { key: "fabricCode", header: "Fabric Code" },
  { key: "fabricDate", header: "Date" },
  { key: "type", header: "Type" },
  { key: "strength", header: "Strength" },
  { key: "width", header: "Width (cm)" },
  { key: "length", header: "Length (m)" },
  { key: "vendor", header: "Vendor" },
  { key: "location", header: "Location" },
  { key: "gsm", header: "GSM" },
  { key: "net", header: "Net (kg)" },
  { key: "status", header: "Status" },
  { key: "assignTo", header: "Assigned To" },
] as const

export type FabricReportColumnKey = (typeof FABRIC_REPORT_COLUMNS)[number]["key"]

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

function locationDisplay(f: FabricRow): string {
  const locations = f.locations ?? []
  if (!locations.length) return "—"
  const first = locations[0]
  const parts = [first.area, first.floor].filter(Boolean)
  const base = parts.join(", ")
  const extra =
    locations.length > 1 ? ` (+${locations.length - 1} more)` : ""
  return truncate(`${base}${extra}`, 42)
}

/** Cell strings aligned with the fabrics table / PDF report. */
export function buildFabricReportCellValues(
  f: FabricRow
): Record<FabricReportColumnKey, string> {
  return {
    fabricCode: f.fabricCode || "—",
    fabricDate: truncate(String(f.fabricDate ?? "—"), 14),
    type: truncate(f.fabricType?.name ?? "—", 16),
    strength: truncate(f.fabricStrength?.name ?? "—", 14),
    width: `${f.fabricWidthInitial} cm`,
    length: `${f.fabricLengthCurrent} / ${f.fabricLengthInitial}`,
    vendor: truncate((f.nameOfVendor || "—").trim() || "—", 22),
    location: locationDisplay(f),
    gsm: String(f.gsmObserved ?? "—"),
    net: String(f.netWeight ?? "—"),
    status: truncate(f.status ?? "—", 12),
    assignTo: truncate(f.assignTo ?? "—", 16),
  }
}

function getFabricTimestamp(fabric: FabricRow): number {
  const primary = Date.parse(fabric.date)
  if (!Number.isNaN(primary)) return primary
  const fallback = Date.parse(fabric.fabricDate)
  if (!Number.isNaN(fallback)) return fallback
  return Number.MAX_SAFE_INTEGER
}

export type ReportCategoryId =
  | "all"
  | "PACKED"
  | "IN_USE"
  | "CLOSED"
  | "OPEN"
  | "REJECTED"
  | "TRADED"

export function prepareFabricsForCategoryReport(
  fabrics: FabricRow[],
  categoryId: ReportCategoryId
): FabricRow[] {
  let result = fabrics
  if (categoryId !== "all") {
    result = result.filter((f) => (f.status ?? "") === categoryId)
  }
  return [...result].sort((a, b) => {
    const timeDiff = getFabricTimestamp(a) - getFabricTimestamp(b)
    if (timeDiff !== 0) return timeDiff
    return a.id - b.id
  })
}
