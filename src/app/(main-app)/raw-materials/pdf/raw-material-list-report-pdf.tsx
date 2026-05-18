import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';

import type { RawMaterialRow } from '../columns';
import {
  buildRawMaterialReportCellValues,
  RAW_MATERIAL_REPORT_COLUMNS,
  type RawMaterialReportColumnKey,
} from '../raw-material-list-report-shared';

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

const PDF_COL_WIDTH: Record<RawMaterialReportColumnKey, string> = {
  materialCode: '9%',
  rawMaterial: '11%',
  vendor: '11%',
  date: '8%',
  availableBags: '7.5%',
  purchasedBags: '7.5%',
  availableKg: '8%',
  purchasedKg: '8%',
  location: '11%',
  status: '9%',
};

type RawMaterialListReportPdfProps = {
  title: string;
  generatedAtLabel: string;
  rows: RawMaterialRow[];
};

function RawMaterialListReportPdfDocument({
  title,
  generatedAtLabel,
  rows,
}: RawMaterialListReportPdfProps) {
  if (rows.length === 0) {
    return (
      <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{generatedAtLabel}</Text>
          <Text style={styles.empty}>No raw materials in this category.</Text>
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
            {RAW_MATERIAL_REPORT_COLUMNS.map((col) => (
              <View key={col.key} style={{ width: PDF_COL_WIDTH[col.key] }}>
                <Text style={styles.headerCell}>{col.header}</Text>
              </View>
            ))}
          </View>
          {rows.map((row) => {
            const cells = buildRawMaterialReportCellValues(row);
            return (
              <View key={row.id} style={styles.bodyRow}>
                {RAW_MATERIAL_REPORT_COLUMNS.map((col) => (
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

export async function getRawMaterialListReportPdfBlob(
  rows: RawMaterialRow[],
  title: string,
  generatedAtLabel: string
): Promise<Blob> {
  return pdf(
    <RawMaterialListReportPdfDocument
      title={title}
      generatedAtLabel={generatedAtLabel}
      rows={rows}
    />
  ).toBlob();
}
