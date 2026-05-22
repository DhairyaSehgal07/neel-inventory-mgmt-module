import type { Prisma } from '@/generated/prisma/client';

type HistoryClient = {
  rawMaterialHistory: {
    create: (args: {
      data: Prisma.RawMaterialHistoryCreateInput;
    }) => Promise<unknown>;
  };
};
import type { RawMaterialStatus } from '@/generated/prisma/enums';
import { RawMaterialHistoryAction } from '@/generated/prisma/enums';

export type RawMaterialHistoryCreateInput = {
  rawMaterialId: number;
  performedById: number | null;
  availableBagsBefore: number;
  availableBagsAfter: number;
  availableWeightKgBefore: number;
  availableWeightKgAfter: number;
  statusBefore: RawMaterialStatus;
  statusAfter: RawMaterialStatus;
};

export function createBalanceHistoryData(
  input: RawMaterialHistoryCreateInput
): Omit<Prisma.RawMaterialHistoryCreateInput, 'rawMaterial'> {
  return {
    actionType: RawMaterialHistoryAction.BALANCE_UPDATE,
    ...(input.performedById != null
      ? { performedBy: { connect: { id: input.performedById } } }
      : {}),
    availableBagsBefore: input.availableBagsBefore,
    availableBagsAfter: input.availableBagsAfter,
    availableWeightKgBefore: input.availableWeightKgBefore,
    availableWeightKgAfter: input.availableWeightKgAfter,
    statusBefore: input.statusBefore,
    statusAfter: input.statusAfter,
  };
}

export async function logRawMaterialBalanceUpdate(
  prisma: HistoryClient,
  input: RawMaterialHistoryCreateInput
): Promise<void> {
  const tol = 1e-6;
  const bagsChanged =
    Math.abs(input.availableBagsBefore - input.availableBagsAfter) > tol;
  const weightChanged =
    Math.abs(input.availableWeightKgBefore - input.availableWeightKgAfter) > tol;
  if (!bagsChanged && !weightChanged) return;

  await prisma.rawMaterialHistory.create({
    data: {
      rawMaterial: { connect: { id: input.rawMaterialId } },
      ...createBalanceHistoryData(input),
    },
  });
}
