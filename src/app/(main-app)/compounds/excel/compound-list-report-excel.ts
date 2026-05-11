import * as XLSX from 'xlsx';

import type { CompoundRow } from '../columns';
import {
  buildCompoundReportCellValues,
  COMPOUND_REPORT_COLUMNS,
} from '../compound-list-report-shared';

function sanitizeFilenamePart(s: string): string {
  return s.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, ' ').trim();
}

export function getCompoundListReportExcelBlob(
  rows: CompoundRow[],
  title: string,
  generatedAtLabel: string
): Blob {
  const headerRow = COMPOUND_REPORT_COLUMNS.map((c) => c.header);
  const dataRows = rows.map((row) => {
    const cells = buildCompoundReportCellValues(row);
    return COMPOUND_REPORT_COLUMNS.map((c) => cells[c.key]);
  });

  const aoa: string[][] = [[title], [generatedAtLabel], [], headerRow, ...dataRows];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Compounds');

  const buf = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  });

  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function getCompoundListReportExcelFilename(categoryLabel: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${sanitizeFilenamePart(`Compound-report-${categoryLabel}-${day}`)}.xlsx`;
}
