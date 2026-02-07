/**
 * Available permissions in the system
 * Admin users have all permissions by default
 * Other users can be granted specific permissions by Admin
 */
export enum Permission {
  // Belt permissions
  BELT_VIEW = 'belt:view',
  BELT_CREATE = 'belt:create',
  BELT_UPDATE = 'belt:update',
  BELT_DELETE = 'belt:delete',

  // User management permissions
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_PERMISSIONS = 'user:manage_permissions',

  // Dashboard permissions
  DASHBOARD_VIEW = 'dashboard:view',
  DASHBOARD_REVERSE_TRACKING = 'dashboard:reverse_tracking',

  // Reports permissions
  REPORTS_VIEW = 'reports:view',
  REPORTS_EXPORT = 'reports:export',

  // Compound master permissions
  COMPOUND_MASTER_VIEW = 'compound_master:view',
  COMPOUND_MASTER_CREATE = 'compound_master:create',
  COMPOUND_MASTER_UPDATE = 'compound_master:update',
  COMPOUND_MASTER_DELETE = 'compound_master:delete',

  COMPOUND_BATCH_VIEW = 'compound_batch:view',
  COMPOUND_BATCH_CREATE = 'compound_batch:create',
  COMPOUND_BATCH_UPDATE = 'compound_batch:update',
  COMPOUND_BATCH_DELETE = 'compound_batch:delete',

  // Rating permissions
  RATING_VIEW = 'rating:view',
  RATING_CREATE = 'rating:create',
  RATING_UPDATE = 'rating:update',
  RATING_DELETE = 'rating:delete',

  // Fabric settings (type, strength, width)
  FABRIC_TYPE_VIEW = 'fabric_type:view',
  FABRIC_TYPE_CREATE = 'fabric_type:create',
  FABRIC_TYPE_UPDATE = 'fabric_type:update',
  FABRIC_TYPE_DELETE = 'fabric_type:delete',

  FABRIC_STRENGTH_VIEW = 'fabric_strength:view',
  FABRIC_STRENGTH_CREATE = 'fabric_strength:create',
  FABRIC_STRENGTH_UPDATE = 'fabric_strength:update',
  FABRIC_STRENGTH_DELETE = 'fabric_strength:delete',

  FABRIC_WIDTH_VIEW = 'fabric_width:view',
  FABRIC_WIDTH_CREATE = 'fabric_width:create',
  FABRIC_WIDTH_UPDATE = 'fabric_width:update',
  FABRIC_WIDTH_DELETE = 'fabric_width:delete',
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
    Permission.COMPOUND_MASTER_VIEW,
    Permission.COMPOUND_MASTER_CREATE,
    Permission.COMPOUND_MASTER_UPDATE,
    Permission.COMPOUND_MASTER_DELETE,
  ],
  COMPOUND_BATCH: [
    Permission.COMPOUND_BATCH_VIEW,
    Permission.COMPOUND_BATCH_CREATE,
    Permission.COMPOUND_BATCH_UPDATE,
    Permission.COMPOUND_BATCH_DELETE,
  ],
  RATING: [
    Permission.RATING_VIEW,
    Permission.RATING_CREATE,
    Permission.RATING_UPDATE,
    Permission.RATING_DELETE,
  ],
  FABRIC_TYPE: [
    Permission.FABRIC_TYPE_VIEW,
    Permission.FABRIC_TYPE_CREATE,
    Permission.FABRIC_TYPE_UPDATE,
    Permission.FABRIC_TYPE_DELETE,
  ],
  FABRIC_STRENGTH: [
    Permission.FABRIC_STRENGTH_VIEW,
    Permission.FABRIC_STRENGTH_CREATE,
    Permission.FABRIC_STRENGTH_UPDATE,
    Permission.FABRIC_STRENGTH_DELETE,
  ],
  FABRIC_WIDTH: [
    Permission.FABRIC_WIDTH_VIEW,
    Permission.FABRIC_WIDTH_CREATE,
    Permission.FABRIC_WIDTH_UPDATE,
    Permission.FABRIC_WIDTH_DELETE,
  ],
} as const;

/**
 * All available permissions
 */
export const ALL_PERMISSIONS = Object.values(Permission);
