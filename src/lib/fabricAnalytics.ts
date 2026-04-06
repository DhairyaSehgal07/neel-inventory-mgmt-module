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

/** Stock cover row for `/api/fabrics/analytics/stock-cover-by-sku`. */
export type StockCoverBySkuItem = {
  fabricId: number;
  fabricCode: string;
  currentBalanceM: number;
  totalConsumptionM: number;
  averageMonthlyConsumptionM: number;
  stockCoverMonths: number | null;
};

/** Open / in-use aging row for `/api/fabrics/analytics/open-in-use-aging`. */
export type OpenInUseAgingItem = {
  fabricId: number;
  fabricCode: string;
  status: 'OPEN' | 'IN_USE';
  lastActivityAt: string;
  agingDays: number;
  /** False when no history exists and `updatedAt` was used for last activity. */
  usedHistory: boolean;
};

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
