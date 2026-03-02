/**
 * Generates a unique fabric code from id, type, strength, width, vendor, sequence and date.
 * Format: {id}-{typeName}-{strengthName}-{widthValue}-{vendor}-{sequence}-{dateStr}
 * Sequence is 1-based; values below 1 are normalized to 1.
 */
export function generateFabricCode(params: {
  id: string;
  fabricTypeName: string;
  fabricStrengthName: string;
  fabricWidthValue: number;
  nameOfVendor: string;
  sequenceNumber: number;
  dateStr: string;
}): string {
  const {
    id,
    fabricTypeName,
    fabricStrengthName,
    fabricWidthValue,
    nameOfVendor,
    sequenceNumber,
    dateStr,
  } = params;

  const sequence = Math.max(1, sequenceNumber);

  return [
    id,
    fabricTypeName,
    fabricStrengthName,
    String(fabricWidthValue),
    nameOfVendor,
    String(sequence),
    dateStr,
  ].join('-');
}
