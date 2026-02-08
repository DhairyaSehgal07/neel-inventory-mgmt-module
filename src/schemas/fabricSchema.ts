import { z } from 'zod';

export const createFabricSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  fabricTypeId: z.number().int().positive('Fabric type is required'),
  fabricStrengthId: z.number().int().positive('Fabric strength is required'),
  fabricWidthId: z.number().int().positive('Fabric width is required'),
  fabricLength: z.number().min(0, 'Fabric length must be non-negative'),
  nameOfVendor: z.string().min(1, 'Vendor name is required'),
  gsmObserved: z.number().min(0, 'GSM observed must be non-negative'),
  netWeight: z.number().min(0, 'Net weight must be non-negative'),
  gsmCalculated: z.number().min(0, 'GSM calculated must be non-negative'),
});

export type CreateFabricInput = z.infer<typeof createFabricSchema>;
