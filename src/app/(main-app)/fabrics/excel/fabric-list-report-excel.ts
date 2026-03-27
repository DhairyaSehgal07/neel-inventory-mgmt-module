import * as XLSX from "xlsx"

import type { FabricRow } from "../columns"
import {
  buildFabricReportCellValues,
  FABRIC_REPORT_COLUMNS,
} from "../fabric-list-report-shared"

function sanitizeFilenamePart(s: string): string {
  return s.replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, " ").trim()
}

export function getFabricListReportExcelBlob(
  rows: FabricRow[],
  title: string,
  generatedAtLabel: string
): Blob {
  const headerRow = FABRIC_REPORT_COLUMNS.map((c) => c.header)
  const dataRows = rows.map((f) => {
    const cells = buildFabricReportCellValues(f)
    return FABRIC_REPORT_COLUMNS.map((c) => cells[c.key])
  })

  const aoa: string[][] = [
    [title],
    [generatedAtLabel],
    [],
    headerRow,
    ...dataRows,
  ]

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Fabrics")

  const buf = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
  })

  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}

/** Suggested download name, e.g. `Fabric-report-All-2026-03-28.xlsx`. */
export function getFabricListReportExcelFilename(categoryLabel: string): string {
  const day = new Date().toISOString().slice(0, 10)
  return `${sanitizeFilenamePart(`Fabric-report-${categoryLabel}-${day}`)}.xlsx`
}
