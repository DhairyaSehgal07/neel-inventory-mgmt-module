import type { RawMaterial } from '@/generated/prisma/client';

const BAG_TOLERANCE = 1e-6;

/** Matches list API `deriveRawMaterialDisplayStatus` for badges and tabs. */
export function deriveRawMaterialDisplayStatus(rm: RawMaterial): string {
  if (rm.status === 'REJECTED') return 'REJECTED';
  if (rm.status === 'TRADED') return 'TRADED';
  if (rm.status === 'CONSUMED') return 'CONSUMED';
  if (rm.status === 'IN_USE') return 'IN_USE';

  if (rm.availableBags <= BAG_TOLERANCE) return 'CONSUMED';
  if (rm.availableBags < rm.purchasedBags - BAG_TOLERANCE) return 'OPEN';
  if (rm.status === 'ASSIGNED') return 'OPEN';
  return 'PACKED';
}
