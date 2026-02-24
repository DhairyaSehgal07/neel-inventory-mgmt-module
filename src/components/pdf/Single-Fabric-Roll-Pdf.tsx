import React from "react";
import QRCode from "qrcode";
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

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  qrWrapper: {
    alignItems: "center",
    marginBottom: 24,
  },
  qrImage: {
    width: 360,
    height: 360,
  },
  fabricCode: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginTop: 8,
  },
  placeholder: {
    fontSize: 18,
    textAlign: "center",
    color: "#666",
  },
});

type SingleFabricPdfDocumentProps = {
  fabricCode: string;
  qrDataUrl: string;
};

const SingleFabricPdfDocument = ({ fabricCode, qrDataUrl }: SingleFabricPdfDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.qrWrapper}>
        <Image src={qrDataUrl} style={styles.qrImage} />
        <Text style={styles.fabricCode}>{fabricCode}</Text>
      </View>
    </Page>
  </Document>
);

export type SingleFabricPdfBlobParams = {
  fabricCode: string;
  /** Product URL encoded in the QR (same as /api/fabrics/[id]/qrcode). */
  productUrl: string;
};

/** Generate the single-fabric PDF as a Blob (e.g. for opening in a new tab). */
export async function getSingleFabricPdfBlob(
  fabric: SingleFabricPdfBlobParams
): Promise<Blob> {
  const qrDataUrl = await QRCode.toDataURL(fabric.productUrl, {
    type: "image/png",
    margin: 2,
    width: 256,
  });
  return pdf(
    <SingleFabricPdfDocument
      fabricCode={fabric.fabricCode}
      qrDataUrl={qrDataUrl}
    />
  ).toBlob();
}

const SingleFabricPdf = () => (
  <PDFViewer width="100%" height="600">
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.placeholder}>Open from fabric table to view QR + code.</Text>
        </View>
      </Page>
    </Document>
  </PDFViewer>
);

export default SingleFabricPdf;