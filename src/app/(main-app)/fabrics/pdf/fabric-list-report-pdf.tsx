import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer"

import type { FabricRow } from "../columns"
import {
  buildFabricReportCellValues,
  FABRIC_REPORT_COLUMNS,
  type FabricReportColumnKey,
} from "../fabric-list-report-shared"

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#111827",
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 14,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerCell: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 7,
    fontWeight: 700,
    color: "#374151",
  },
  bodyRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  bodyCell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 7,
    color: "#111827",
  },
  empty: {
    padding: 24,
    textAlign: "center",
    fontSize: 10,
    color: "#6b7280",
  },
})

/** PDF column widths (sum ≈ 100%) — must align with `FABRIC_REPORT_COLUMNS`. */
const PDF_COL_WIDTH: Record<FabricReportColumnKey, string> = {
  fabricCode: "14%",
  fabricDate: "8%",
  type: "9%",
  strength: "8%",
  width: "7%",
  length: "8%",
  vendor: "9%",
  location: "10%",
  gsm: "6%",
  net: "6%",
  status: "6%",
  assignTo: "9%",
}

type FabricListReportPdfProps = {
  title: string
  generatedAtLabel: string
  rows: FabricRow[]
}

function FabricListReportPdfDocument({
  title,
  generatedAtLabel,
  rows,
}: FabricListReportPdfProps) {
  if (rows.length === 0) {
    return (
      <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{generatedAtLabel}</Text>
          <Text style={styles.empty}>No fabrics in this category.</Text>
        </Page>
      </Document>
    )
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{generatedAtLabel}</Text>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            {FABRIC_REPORT_COLUMNS.map((col) => (
              <View key={col.key} style={{ width: PDF_COL_WIDTH[col.key] }}>
                <Text style={styles.headerCell}>{col.header}</Text>
              </View>
            ))}
          </View>
          {rows.map((f) => {
            const cells = buildFabricReportCellValues(f)
            return (
              <View key={f.id} style={styles.bodyRow}>
                {FABRIC_REPORT_COLUMNS.map((col) => (
                  <View key={col.key} style={{ width: PDF_COL_WIDTH[col.key] }}>
                    <Text style={styles.bodyCell}>{cells[col.key]}</Text>
                  </View>
                ))}
              </View>
            )
          })}
        </View>
      </Page>
    </Document>
  )
}

export async function getFabricListReportPdfBlob(
  rows: FabricRow[],
  title: string,
  generatedAtLabel: string
): Promise<Blob> {
  return pdf(
    <FabricListReportPdfDocument
      title={title}
      generatedAtLabel={generatedAtLabel}
      rows={rows}
    />
  ).toBlob()
}
