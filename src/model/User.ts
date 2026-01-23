import { Permission } from '@/lib/rbac/permissions';

export type Role = 'Admin' | 'Manager' | 'Supervisor' | 'Worker';

// Type for User model (matches Prisma schema)
export interface User {
  id: number;
  name: string;
  mobileNumber: string;
  password: string;
  role: Role;
  permissions: Permission[]; // Array of permissions assigned by Admin
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
