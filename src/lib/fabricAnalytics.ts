import { FabricStatus, type Prisma } from '@/generated/prisma/client';

/**
 * Fabrics that count toward "live" stock for analytics: positive remaining length,
 * and not rejected or traded. Rows with null status are included.
 */
export function liveFabricStockWhere(): Prisma.FabricWhereInput {
  return {
    fabricLengthCurrent: { gt: 0 },
    OR: [
      { status: null },
      { status: { notIn: [FabricStatus.REJECTED, FabricStatus.TRADED] } },
    ],
  };
}

/**
 * OPEN fabric balance should match the `/fabrics` dashboard OPEN tab:
 * positive remaining length and persisted status OPEN.
 */
export function openFabricStockWhere(): Prisma.FabricWhereInput {
  return {
    fabricLengthCurrent: { gt: 0 },
    status: FabricStatus.OPEN,
  };
}

export type FabricAgingItem = {
  fabricId: number;
  fabricCode: string;
  status: string;
  lastActivityAt: string;
  agingDays: number;
  /** False when no history exists and `updatedAt` was used for last activity. */
  usedHistory: boolean;
};

export type OpenInUseAgingItem = FabricAgingItem & { status: 'OPEN' | 'IN_USE' };

export type PackedAgingItem = FabricAgingItem & { status: 'PACKED' };

export type ConsumptionTrendGranularity = 'day' | 'week' | 'month';

export type ConsumptionTrendSplit = 'none' | 'width' | 'strength' | 'assign';

export type ConsumptionTrendSegment = {
  segmentKey: string;
  label: string;
  consumptionM: number;
};

export type ConsumptionTrendBucket = {
  periodStart: string;
  periodLabel: string;
  totalM: number;
  segments?: ConsumptionTrendSegment[];
};

/** One histogram bucket for `/api/fabrics/analytics/partial-roll-remnant`. */
export type PartialRollRemnantBucket = {
  id: '0-50' | '50-100' | '100-200' | '200+';
  label: string;
  rollCount: number;
  /** Sum of `fabricLengthCurrent` for rolls in this bucket (m). */
  totalRemainingM: number;
};

/** Roll row for partial-roll drilldown (`?bucket=`). */
export type PartialRollDrilldownItem = {
  fabricId: number;
  fabricCode: string;
  widthValueCm: number;
  strengthName: string;
  locationDisplay: string;
  remainingM: number;
};
