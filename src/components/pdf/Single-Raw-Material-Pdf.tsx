import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  PDFViewer,
  pdf,
} from '@react-pdf/renderer';

const MM_TO_PT = 72 / 25.4;
const PAGE_SIZE: [number, number] = [199.6 * MM_TO_PT, 143.5 * MM_TO_PT];

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 18,
    fontFamily: 'Helvetica',
  },
  contentColumn: {
    flexDirection: 'column',
    flex: 1,
    width: '100%',
  },
  qrSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameText: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  nameBold: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
    textAlign: 'center',
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  placeholder: {
    fontSize: 22,
    textAlign: 'center',
    color: '#666',
  },
});

export type SingleRawMaterialPdfParams = {
  qrDataUrl: string;
  rawMaterial: string;
};

export const SingleRawMaterialPdfPageContent = (props: SingleRawMaterialPdfParams) => (
  <View style={styles.contentColumn}>
    <View style={styles.qrSection}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- PDF Image has no alt prop */}
      <Image src={props.qrDataUrl} style={styles.qrImage} />
    </View>

    <View style={styles.nameText}>
      <Text style={styles.nameBold}>{props.rawMaterial || '—'}</Text>
    </View>
  </View>
);

const SingleRawMaterialPdfDocument = (props: SingleRawMaterialPdfParams) => (
  <Document>
    <Page size={PAGE_SIZE} style={styles.page}>
      <SingleRawMaterialPdfPageContent {...props} />
    </Page>
  </Document>
);

export async function getSingleRawMaterialPdfBlob(
  params: SingleRawMaterialPdfParams
): Promise<Blob> {
  return pdf(<SingleRawMaterialPdfDocument {...params} />).toBlob();
}

const SingleRawMaterialPdf = () => (
  <PDFViewer width="100%" height="600">
    <Document>
      <Page size={PAGE_SIZE} style={styles.page}>
        <View>
          <Text style={styles.placeholder}>Open from raw materials table to view PDF.</Text>
        </View>
      </Page>
    </Document>
  </PDFViewer>
);

export default SingleRawMaterialPdf;
