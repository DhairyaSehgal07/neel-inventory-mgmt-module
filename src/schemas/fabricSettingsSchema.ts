import { z } from 'zod';

export const createFabricTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
});

export const updateFabricTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .optional(),
});

export const createFabricStrengthSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
});

export const updateFabricStrengthSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .optional(),
});

export const createFabricWidthSchema = z.object({
  value: z.number().positive('Value must be positive'),
});

export const updateFabricWidthSchema = z.object({
  value: z.number().positive('Value must be positive').optional(),
});

export type CreateFabricTypeInput = z.infer<typeof createFabricTypeSchema>;
export type UpdateFabricTypeInput = z.infer<typeof updateFabricTypeSchema>;
export type CreateFabricStrengthInput = z.infer<typeof createFabricStrengthSchema>;
export type UpdateFabricStrengthInput = z.infer<typeof updateFabricStrengthSchema>;
export type CreateFabricWidthInput = z.infer<typeof createFabricWidthSchema>;
export type UpdateFabricWidthInput = z.infer<typeof updateFabricWidthSchema>;
