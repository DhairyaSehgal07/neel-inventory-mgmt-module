import * as XLSX from 'xlsx';

import type { RawMaterialRow } from '../columns';
import {
  buildRawMaterialReportCellValues,
  RAW_MATERIAL_REPORT_COLUMNS,
} from '../raw-material-list-report-shared';

function sanitizeFilenamePart(s: string): string {
  return s.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, ' ').trim();
}

export function getRawMaterialListReportExcelBlob(
  rows: RawMaterialRow[],
  title: string,
  generatedAtLabel: string
): Blob {
  const headerRow = RAW_MATERIAL_REPORT_COLUMNS.map((c) => c.header);
  const dataRows = rows.map((row) => {
    const cells = buildRawMaterialReportCellValues(row);
    return RAW_MATERIAL_REPORT_COLUMNS.map((c) => cells[c.key]);
  });

  const aoa: string[][] = [[title], [generatedAtLabel], [], headerRow, ...dataRows];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Raw materials');

  const buf = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  });

  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function getRawMaterialListReportExcelFilename(categoryLabel: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${sanitizeFilenamePart(`Raw-material-report-${categoryLabel}-${day}`)}.xlsx`;
}
