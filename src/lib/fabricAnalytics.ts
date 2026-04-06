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
