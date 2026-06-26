import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, PDFViewer, pdf } from '@react-pdf/renderer';

function formatProductionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '—';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
    marginBottom: 14,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  qrCodeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  qrCodeValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    marginTop: 2,
    fontFamily: 'Helvetica',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 14,
  },
  infoSection: {
    width: '100%',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCell: {
    width: '32%',
    marginBottom: 14,
  },
  label: {
    fontSize: 22,
    color: '#6b7280',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  value: {
    fontSize: 24,
    fontWeight: 600,
    color: '#111827',
  },
  statusBadge: {
    fontSize: 19,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  placeholder: {
    fontSize: 22,
    textAlign: 'center',
    color: '#666',
  },
});

export type SingleRawMaterialPdfParams = {
  qrDataUrl: string;
  materialCode: string;
  rawMaterialName: string;
  date: string;
  status: string | null | undefined;
};

export const SingleRawMaterialPdfPageContent = (props: SingleRawMaterialPdfParams) => (
  <View style={styles.contentColumn}>
    <View style={styles.qrSection}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- PDF Image has no alt prop */}
      <Image src={props.qrDataUrl} style={styles.qrImage} />
      <Text style={styles.qrCodeLabel}>MATERIAL CODE</Text>
      <Text style={styles.qrCodeValue}>{props.materialCode || '—'}</Text>
    </View>

    <View style={styles.divider} />

    <View style={styles.infoSection}>
      <View style={styles.grid}>
        <View style={styles.gridCell}>
          <Text style={styles.label}>NAME</Text>
          <Text style={styles.value}>{props.rawMaterialName || '—'}</Text>
        </View>

        <View style={styles.gridCell}>
          <Text style={styles.label}>STATUS</Text>
          <Text style={styles.statusBadge}>{props.status ?? '—'}</Text>
        </View>

        <View style={styles.gridCell}>
          <Text style={styles.label}>DATE</Text>
          <Text style={styles.value}>{formatProductionDate(props.date)}</Text>
        </View>
      </View>
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
