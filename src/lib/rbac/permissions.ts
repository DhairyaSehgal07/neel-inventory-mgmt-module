/**
 * Available permissions in the system
 * Admin users have all permissions by default
 * Other users can be granted specific permissions by Admin
 */
export enum Permission {
  // Belt permissions
  BELT_VIEW = "belt:view",
  BELT_CREATE = "belt:create",
  BELT_UPDATE = "belt:update",
  BELT_DELETE = "belt:delete",

  // User management permissions
  USER_VIEW = "user:view",
  USER_CREATE = "user:create",
  USER_UPDATE = "user:update",
  USER_DELETE = "user:delete",
  USER_MANAGE_PERMISSIONS = "user:manage_permissions",

  // Dashboard permissions
  DASHBOARD_VIEW = "dashboard:view",
  DASHBOARD_REVERSE_TRACKING = "dashboard:reverse_tracking",

  // Reports permissions
  REPORTS_VIEW = "reports:view",
  REPORTS_EXPORT = "reports:export",

  // Compound type permissions
  COMPOUND_TYPE_VIEW = "compound_type:view",
  COMPOUND_TYPE_CREATE = "compound_type:create",
  COMPOUND_TYPE_UPDATE = "compound_type:update",
  COMPOUND_TYPE_DELETE = "compound_type:delete",
}

/**
 * Permission groups for easier management
 */
export const PermissionGroups = {
  BELT: [
    Permission.BELT_VIEW,
    Permission.BELT_CREATE,
    Permission.BELT_UPDATE,
    Permission.BELT_DELETE,
  ],
  USER: [
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_MANAGE_PERMISSIONS,
  ],
  DASHBOARD: [
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_REVERSE_TRACKING,
  ],
  REPORTS: [
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
  ],
  COMPOUND_TYPE: [
    Permission.COMPOUND_TYPE_VIEW,
    Permission.COMPOUND_TYPE_CREATE,
    Permission.COMPOUND_TYPE_UPDATE,
    Permission.COMPOUND_TYPE_DELETE,
  ],
} as const;

/**
 * All available permissions
 */
export const ALL_PERMISSIONS = Object.values(Permission);
