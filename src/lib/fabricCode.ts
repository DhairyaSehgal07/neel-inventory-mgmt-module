/**
 * Generates a unique fabric code from type, strength, width, vendor, sequence and date.
 * Format: {typeName}-{strengthName}-{widthValue}-{vendor}-{sequence}-{dateStr}
 * Sequence is 1-based; values below 1 are normalized to 1.
 */
export function generateFabricCode(params: {
  fabricTypeName: string;
  fabricStrengthName: string;
  fabricWidthValue: number;
  nameOfVendor: string;
  sequenceNumber: number;
  dateStr: string;
}): string {
  const {
    fabricTypeName,
    fabricStrengthName,
    fabricWidthValue,
    nameOfVendor,
    sequenceNumber,
    dateStr,
  } = params;

  const sequence = Math.max(1, sequenceNumber);

  return [
    fabricTypeName,
    fabricStrengthName,
    String(fabricWidthValue),
    nameOfVendor,
    String(sequence),
    dateStr,
  ].join('-');
}
