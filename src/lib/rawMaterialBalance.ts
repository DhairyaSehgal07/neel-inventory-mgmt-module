import type { RawMaterialStatus } from '@/generated/prisma/enums';

export const BAG_TOLERANCE = 1e-6;

export function nextStatusFromBags(
  availableBags: number,
  purchasedBags: number
): RawMaterialStatus {
  if (availableBags <= BAG_TOLERANCE) return 'CONSUMED';
  if (availableBags < purchasedBags - BAG_TOLERANCE) return 'OPEN';
  return 'PACKED';
}

export function isFullyPacked(availableBags: number, purchasedBags: number): boolean {
  return Math.abs(availableBags - purchasedBags) <= BAG_TOLERANCE && purchasedBags > BAG_TOLERANCE;
}

/** Set packedAt when transitioning to fully packed; clear when opened or consumed. */
export function resolvePackedAt(
  availableBags: number,
  purchasedBags: number,
  previousPackedAt: Date | null,
  now: Date = new Date()
): Date | null {
  if (isFullyPacked(availableBags, purchasedBags)) {
    return previousPackedAt ?? now;
  }
  return null;
}

export function computeBagWeights(
  purchasedBags: number,
  availableBags: number,
  weightPerUnit: number
): { ok: true; purchasedWeightKg: number; availableWeightKg: number } | { ok: false; message: string } {
  if (availableBags - purchasedBags > BAG_TOLERANCE) {
    return {
      ok: false,
      message: 'Available bags cannot exceed purchased bags',
    };
  }
  return {
    ok: true,
    purchasedWeightKg: purchasedBags * weightPerUnit,
    availableWeightKg: availableBags * weightPerUnit,
  };
}

export function balanceHistoryConsumptionKg(h: {
  availableWeightKgBefore: number | null;
  availableWeightKgAfter: number | null;
}): number {
  const before = h.availableWeightKgBefore;
  const after = h.availableWeightKgAfter;
  if (before == null || after == null) return 0;
  return Math.max(0, before - after);
}

export function balanceHistoryConsumptionBags(h: {
  availableBagsBefore: number | null;
  availableBagsAfter: number | null;
}): number {
  const before = h.availableBagsBefore;
  const after = h.availableBagsAfter;
  if (before == null || after == null) return 0;
  return Math.max(0, before - after);
}

export type RawMaterialBalanceSnapshot = {
  availableBags: number;
  availableWeightKg: number;
  status: RawMaterialStatus;
  packedAt: Date | null;
};

export function buildBalanceUpdateData(
  existing: {
    availableBags: number;
    purchasedBags: number;
    weightPerUnit: number;
    status: RawMaterialStatus;
    packedAt: Date | null;
  },
  availableBags: number,
  now: Date = new Date()
): RawMaterialBalanceSnapshot & {
  purchasedWeightKg: number;
  availableWeightKg: number;
} {
  const status = nextStatusFromBags(availableBags, existing.purchasedBags);
  const availableWeightKg = availableBags * existing.weightPerUnit;
  const packedAt = resolvePackedAt(
    availableBags,
    existing.purchasedBags,
    existing.packedAt,
    now
  );
  return {
    availableBags,
    availableWeightKg,
    status,
    packedAt,
    purchasedWeightKg: existing.purchasedBags * existing.weightPerUnit,
  };
}
