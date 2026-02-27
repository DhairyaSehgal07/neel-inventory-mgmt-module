import { z } from 'zod';

export const locationSchema = z.object({
  area: z.string(),
  floor: z.string(),
});

/** One set of locations per fabric when creating multiple; index i = locations for i-th fabric. */
export const createFabricSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  fabricTypeId: z.number().int().positive('Fabric type is required'),
  fabricStrengthId: z.number().int().positive('Fabric strength is required'),
  fabricWidthValue: z.number().min(0, 'Fabric width (m) must be non-negative'),
  fabricLengthInitial: z.number().min(0, 'Fabric length initial must be non-negative'),
  fabricLengthCurrent: z.number().min(0, 'Fabric length current must be non-negative').optional(),
  fabricWidthInitial: z.number().min(0, 'Fabric width initial must be non-negative').optional(),
  fabricWidthCurrent: z.number().min(0, 'Fabric width current must be non-negative').optional(),
  nameOfVendor: z.string().min(1, 'Vendor name is required'),
  gsmObserved: z.number().min(0, 'GSM observed must be non-negative'),
  netWeight: z.number().min(0, 'Net weight must be non-negative'),
  gsmCalculated: z.number().min(0, 'GSM calculated must be non-negative'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  /** Per-fabric locations: locationsPerFabric[i] = locations for the i-th fabric. Optional. */
  locationsPerFabric: z.array(z.array(locationSchema)).optional().default([]),
  /** @deprecated Use locationsPerFabric. If provided, same locations applied to every fabric. */
  locations: z.array(locationSchema).optional().default([]),
});

export type CreateFabricInput = z.infer<typeof createFabricSchema>;

/** Schema for PATCH: same as create plus optional assignTo (string or null to clear). */
export const updateFabricSchema = createFabricSchema.extend({
  assignTo: z.string().nullable().optional(),
});

export type UpdateFabricInput = z.infer<typeof updateFabricSchema>;
