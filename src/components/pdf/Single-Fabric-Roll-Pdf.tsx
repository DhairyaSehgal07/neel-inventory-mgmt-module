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

// Custom page size: 143.5 mm (h) x 199.6 mm (w) in points (72 pt = 1 inch)
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

  fabricCodeText: {
    width: "100%",
    alignItems: "center",
    marginBottom: 14,
  },

  fabricCodeBold: {
    fontSize: 14,
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
    textAlign: 'center',
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
    fontSize: 14,
    color: "#6b7280",
    letterSpacing: 0.5,
    marginBottom: 3,
  },

  value: {
    fontSize: 16,
    fontWeight: 600,
    color: "#111827",
  },

  valueMono: {
    fontSize: 10,
    fontWeight: 500,
    color: "#111827",
  },

  statusBadge: {
    fontSize: 9,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
  },

  placeholder: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
  },
});

export type SingleFabricPdfParams = {
  productUrl: string;
  qrDataUrl: string;
  id: number;
  dateDisplay: string;
  fabricCode: string;
  fabricTypeName: string;
  fabricStrengthName: string;
  fabricWidthValue: number;
  fabricWidthInitial: number;
  fabricWidthCurrent: number;
  fabricLengthInitial: number;
  fabricLengthCurrent: number;
  nameOfVendor: string;
  gsmObserved: number;
  gsmCalculated: number;
  netWeight: number;
  status: string | null | undefined;
};

const SingleFabricPdfDocument = (props: SingleFabricPdfParams) => (
  <Document>
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={styles.contentColumn}>
        <View style={styles.qrSection}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- PDF Image has no alt prop */}
          <Image src={props.qrDataUrl} style={styles.qrImage} />
        </View>

        <View style={styles.fabricCodeText}>
          <Text style={styles.fabricCodeBold}>{props.fabricCode || "—"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoSection}>
          <View style={styles.grid}>
            <View style={styles.gridCell}>
              <Text style={styles.label}>FABRIC TYPE</Text>
              <Text style={styles.value}>{props.fabricTypeName || "—"}</Text>
            </View>

            <View style={styles.gridCell}>
              <Text style={styles.label}>STRENGTH</Text>
              <Text style={styles.value}>{props.fabricStrengthName || "—"}</Text>
            </View>



            <View style={styles.gridCell}>
              <Text style={styles.label}>WIDTH</Text>
              <Text style={styles.value}>
                {props.fabricWidthInitial} cm
              </Text>
            </View>

            <View style={styles.gridCell}>
              <Text style={styles.label}>FABRIC LENGTH</Text>
              <Text style={styles.value}>
                {props.fabricLengthCurrent} m
              </Text>
            </View>

            <View style={styles.gridCell}>
              <Text style={styles.label}>VENDOR</Text>
              <Text style={styles.value}>
                {props.nameOfVendor || "—"}
              </Text>
            </View>

            <View style={styles.gridCell}>
              <Text style={styles.label}>STATUS</Text>
              <Text style={styles.statusBadge}>
                {props.status ?? "—"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

/**
 * Generate the single-fabric PDF as a Blob. Pass all data via params (no fetch).
 * Caller should generate qrDataUrl and pass it for best performance.
 */
export async function getSingleFabricPdfBlob(
  params: SingleFabricPdfParams
): Promise<Blob> {
  return pdf(<SingleFabricPdfDocument {...params} />).toBlob();
}

const SingleFabricPdf = () => (
  <PDFViewer width="100%" height="600">
    <Document>
      <Page size={PAGE_SIZE} style={styles.page}>
        <View>
          <Text style={styles.placeholder}>
            Open from fabric table to view PDF.
          </Text>
        </View>
      </Page>
    </Document>
  </PDFViewer>
);

export default SingleFabricPdf;
