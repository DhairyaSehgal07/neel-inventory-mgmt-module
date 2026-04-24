import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  PDFViewer,
  pdf,
} from "@react-pdf/renderer";

function formatProductionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "—";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const MM_TO_PT = 72 / 25.4;
const PAGE_SIZE: [number, number] = [
  199.6 * MM_TO_PT, // width
  143.5 * MM_TO_PT, // height
];

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 18,
    fontFamily: "Helvetica",
  },

  contentColumn: {
    flexDirection: "column",
    flex: 1,
    width: "100%",
  },

  qrSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },

  codeText: {
    width: "100%",
    alignItems: "center",
    marginBottom: 14,
  },

  codeBold: {
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
  },

  qrImage: {
    width: 180,
    height: 180,
  },

  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 14,
  },

  infoSection: {
    width: "100%",
    textAlign: "center",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  gridCell: {
    width: "32%",
    marginBottom: 14,
  },

  label: {
    fontSize: 22,
    color: "#6b7280",
    letterSpacing: 0.5,
    marginBottom: 3,
  },

  value: {
    fontSize: 24,
    fontWeight: 600,
    color: "#111827",
  },

  statusBadge: {
    fontSize: 19,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
  },

  placeholder: {
    fontSize: 22,
    textAlign: "center",
    color: "#666",
  },
});

export type SingleCompoundPdfParams = {
  productUrl: string;
  qrDataUrl: string;
  id: number;
  compoundCode: string;
  compoundName: string;
  dateOfProduction: string;
  status: string | null | undefined;
};

export const SingleCompoundPdfPageContent = (props: SingleCompoundPdfParams) => (
  <View style={styles.contentColumn}>
    <View style={styles.qrSection}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- PDF Image has no alt prop */}
      <Image src={props.qrDataUrl} style={styles.qrImage} />
    </View>

    <View style={styles.codeText}>
      <Text style={styles.codeBold}>{props.compoundCode || "—"}</Text>
    </View>

    <View style={styles.divider} />

    <View style={styles.infoSection}>
      <View style={styles.grid}>
        <View style={styles.gridCell}>
          <Text style={styles.label}>NAME</Text>
          <Text style={styles.value}>{props.compoundName || "—"}</Text>
        </View>

        <View style={styles.gridCell}>
          <Text style={styles.label}>STATUS</Text>
          <Text style={styles.statusBadge}>{props.status ?? "—"}</Text>
        </View>

        <View style={styles.gridCell}>
          <Text style={styles.label}>DATE</Text>
          <Text style={styles.value}>
            {formatProductionDate(props.dateOfProduction)}
          </Text>
        </View>
      </View>
    </View>
  </View>
);

const SingleCompoundPdfDocument = (props: SingleCompoundPdfParams) => (
  <Document>
    <Page size={PAGE_SIZE} style={styles.page}>
      <SingleCompoundPdfPageContent {...props} />
    </Page>
  </Document>
);

export async function getSingleCompoundPdfBlob(
  params: SingleCompoundPdfParams
): Promise<Blob> {
  return pdf(<SingleCompoundPdfDocument {...params} />).toBlob();
}

const SingleCompoundPdf = () => (
  <PDFViewer width="100%" height="600">
    <Document>
      <Page size={PAGE_SIZE} style={styles.page}>
        <View>
          <Text style={styles.placeholder}>
            Open from compounds table to view PDF.
          </Text>
        </View>
      </Page>
    </Document>
  </PDFViewer>
);

export default SingleCompoundPdf;
