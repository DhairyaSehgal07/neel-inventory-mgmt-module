import type { Role } from '@/model/User';
import {
  Permission,
  PermissionGroups,
  ALL_PERMISSIONS,
} from './permissions';

/**
 * Default permissions per role (for seeding or new user creation).
 * Admin has all permissions at runtime and does not need to store them.
 * Other roles can be assigned these defaults; Admin can override per user.
 */
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<Exclude<Role, 'Admin'>, Permission[]> = {
  Manager: [
    ...PermissionGroups.USER,
    ...PermissionGroups.DASHBOARD,
    ...PermissionGroups.REPORTS,
    ...PermissionGroups.BELT,
    ...PermissionGroups.COMPOUND_TYPE,
    ...PermissionGroups.COMPOUND_BATCH,
    ...PermissionGroups.RATING,
    ...PermissionGroups.FABRIC_TYPE,
    ...PermissionGroups.FABRIC_STRENGTH,
    ...PermissionGroups.FABRIC_WIDTH,
  ],
  Supervisor: [
    Permission.USER_VIEW,
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_REVERSE_TRACKING,
    Permission.REPORTS_VIEW,
    ...PermissionGroups.BELT,
    ...PermissionGroups.COMPOUND_TYPE,
    ...PermissionGroups.COMPOUND_BATCH,
    ...PermissionGroups.RATING,
    ...PermissionGroups.FABRIC_TYPE,
    ...PermissionGroups.FABRIC_STRENGTH,
    ...PermissionGroups.FABRIC_WIDTH,
  ],
  Worker: [
    Permission.BELT_VIEW,
    Permission.BELT_UPDATE,
    Permission.DASHBOARD_VIEW,
    Permission.COMPOUND_MASTER_VIEW,
    Permission.COMPOUND_BATCH_VIEW,
    Permission.COMPOUND_BATCH_UPDATE,
    Permission.RATING_VIEW,
    Permission.RATING_CREATE,
    Permission.RATING_UPDATE,
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
