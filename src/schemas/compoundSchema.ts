import { z } from 'zod';
import { CompoundStatus } from '@/generated/prisma/enums';

export const createCompoundSchema = z.object({
  compoundCode: z.string().trim().min(1, 'Compound code is required'),
  dateOfProduction: z.string().min(1, 'Date of production is required'),
  createdBy: z.string().trim().min(1, 'Created by is required'),
  compoundName: z.string().trim().min(1, 'Compound name is required'),
  batch: z.string().trim().min(1, 'Batch is required'),
  batchCount: z.number().positive('Batch count must be positive'),
  weightPerBatchKg: z.number().min(0, 'Weight per batch (kg) must be non-negative'),
  /** If provided, must match `batchCount × weightPerBatchKg` (within tolerance). */
  totalWeightProducedKg: z.number().min(0).optional(),
  weightConsumedKg: z.number().min(0).optional().default(0),
  location: z.string().trim().min(1, 'Location is required'),
  status: z.nativeEnum(CompoundStatus).optional().nullable(),
});

export type CreateCompoundInput = z.infer<typeof createCompoundSchema>;

export const updateCompoundSchema = createCompoundSchema.partial();

export type UpdateCompoundInput = z.infer<typeof updateCompoundSchema>;
