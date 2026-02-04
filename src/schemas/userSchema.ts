import { z } from 'zod';
import { Permission } from '@/lib/rbac/permissions';

const roleEnum = z.enum(['Admin', 'Manager', 'Supervisor', 'Worker'] as const);
const permissionEnum = z.nativeEnum(Permission);

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobileNumber: z.string().min(10, 'Valid mobile number required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: roleEnum.default('Worker'),
  permissions: z.array(permissionEnum).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  mobileNumber: z.string().min(10).optional(),
  password: z.string().min(6).optional(),
  role: roleEnum.optional(),
  permissions: z.array(permissionEnum).optional(),
  isActive: z.boolean().optional(),
});

export const updateUserPermissionsSchema = z.object({
  permissions: z.array(permissionEnum),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserPermissionsInput = z.infer<typeof updateUserPermissionsSchema>;
