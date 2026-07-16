import type { Role } from '@/model/User';
import {
  Permission,
  PermissionGroups,
  ALL_PERMISSIONS,
} from './permissions';

/**
 * Default permissions per role (for seeding or new user creation).
 * Admin has all permissions at runtime and does not need to store them.
 * User management / admin panel is Admin-only (role check).
 */
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<Exclude<Role, 'Admin'>, Permission[]> = {
  Manager: [
    ...PermissionGroups.FABRIC,
    ...PermissionGroups.COMPOUND,
    ...PermissionGroups.RAW_MATERIAL,
  ],
  Supervisor: [
    ...PermissionGroups.FABRIC,
    ...PermissionGroups.COMPOUND,
    ...PermissionGroups.RAW_MATERIAL,
  ],
  Worker: [
    Permission.FABRIC_READ,
    Permission.FABRIC_UPDATE,
    Permission.COMPOUND_READ,
    Permission.COMPOUND_UPDATE,
    Permission.RAW_MATERIAL_READ,
    Permission.RAW_MATERIAL_UPDATE,
  ],
};

/**
 * Get default permissions for a role (Admin is not in map; they have all at runtime).
 */
export function getDefaultPermissionsForRole(role: Role): Permission[] {
  if (role === 'Admin') {
    return [...ALL_PERMISSIONS];
  }
  return DEFAULT_PERMISSIONS_BY_ROLE[role] ?? [];
}
