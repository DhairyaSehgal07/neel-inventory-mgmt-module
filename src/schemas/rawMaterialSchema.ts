import { z } from 'zod';
import { RawMaterialStatus } from '@/generated/prisma/enums';

export const createRawMaterialSchema = z.object({
  materialCode: z.string().trim().min(1, 'Material code is required'),
  date: z.string().min(1, 'Date is required'),
  createdBy: z.string().trim().min(1, 'Created by is required'),
  rawMaterial: z.string().trim().min(1, 'Raw material name is required'),
  grade: z.string().trim().optional().nullable(),
  vendor: z.string().trim().optional().nullable(),
  units: z.string().trim().min(1, 'Units are required'),
  weightPerUnit: z
    .number()
    .positive('Weight per unit must be greater than zero'),
  purchasedBags: z.number().min(0, 'Purchased bags must be non-negative').default(0),
  /** If omitted, defaults to purchasedBags on create. */
  availableBags: z.number().min(0, 'Available bags must be non-negative').optional(),
  location: z.string().trim().optional().nullable(),
  status: z.nativeEnum(RawMaterialStatus).optional(),
});

export type CreateRawMaterialInput = z.infer<typeof createRawMaterialSchema>;

export const updateRawMaterialSchema = createRawMaterialSchema.partial();

export type UpdateRawMaterialInput = z.infer<typeof updateRawMaterialSchema>;
