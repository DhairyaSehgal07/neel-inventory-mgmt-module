import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';

import type { CompoundRow } from '../columns';
import {
  buildCompoundReportCellValues,
  COMPOUND_REPORT_COLUMNS,
  type CompoundReportColumnKey,
} from '../compound-list-report-shared';

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#111827',
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 14,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerCell: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 7,
    fontWeight: 700,
    color: '#374151',
  },
  bodyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bodyCell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 7,
    color: '#111827',
  },
  empty: {
    padding: 24,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
  },
});

const PDF_COL_WIDTH: Record<CompoundReportColumnKey, string> = {
  compoundCode: '11%',
  compoundName: '16%',
  batch: '7%',
  dateOfProduction: '10%',
  weightRemaining: '9%',
  weightTotal: '9%',
  location: '14%',
  assignTo: '12%',
  status: '12%',
};

type CompoundListReportPdfProps = {
  title: string;
  generatedAtLabel: string;
  rows: CompoundRow[];
};

function CompoundListReportPdfDocument({
  title,
  generatedAtLabel,
  rows,
}: CompoundListReportPdfProps) {
  if (rows.length === 0) {
    return (
      <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{generatedAtLabel}</Text>
          <Text style={styles.empty}>No compounds in this category.</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{generatedAtLabel}</Text>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            {COMPOUND_REPORT_COLUMNS.map((col) => (
              <View key={col.key} style={{ width: PDF_COL_WIDTH[col.key] }}>
                <Text style={styles.headerCell}>{col.header}</Text>
              </View>
            ))}
          </View>
          {rows.map((row) => {
            const cells = buildCompoundReportCellValues(row);
            return (
              <View key={row.id} style={styles.bodyRow}>
                {COMPOUND_REPORT_COLUMNS.map((col) => (
                  <View key={col.key} style={{ width: PDF_COL_WIDTH[col.key] }}>
                    <Text style={styles.bodyCell}>{cells[col.key]}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
}

export async function getCompoundListReportPdfBlob(
  rows: CompoundRow[],
  title: string,
  generatedAtLabel: string
): Promise<Blob> {
  return pdf(
    <CompoundListReportPdfDocument
      title={title}
      generatedAtLabel={generatedAtLabel}
      rows={rows}
    />
  ).toBlob();
}
