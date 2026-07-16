/**
 * Available permissions in the system.
 * Admin users have all permissions by default (role check).
 * Other users are granted module CRUD + reports by Admin.
 */
export enum Permission {
  // Fabrics
  FABRIC_CREATE = 'fabric:create',
  FABRIC_READ = 'fabric:read',
  FABRIC_UPDATE = 'fabric:update',
  FABRIC_DELETE = 'fabric:delete',
  FABRIC_REPORTS = 'fabric:reports',

  // Compounds
  COMPOUND_CREATE = 'compound:create',
  COMPOUND_READ = 'compound:read',
  COMPOUND_UPDATE = 'compound:update',
  COMPOUND_DELETE = 'compound:delete',
  COMPOUND_REPORTS = 'compound:reports',

  // Raw materials
  RAW_MATERIAL_CREATE = 'raw_material:create',
  RAW_MATERIAL_READ = 'raw_material:read',
  RAW_MATERIAL_UPDATE = 'raw_material:update',
  RAW_MATERIAL_DELETE = 'raw_material:delete',
  RAW_MATERIAL_REPORTS = 'raw_material:reports',
}

/**
 * Permission groups for the admin permission picker.
 */
export const PermissionGroups = {
  FABRIC: [
    Permission.FABRIC_CREATE,
    Permission.FABRIC_READ,
    Permission.FABRIC_UPDATE,
    Permission.FABRIC_DELETE,
    Permission.FABRIC_REPORTS,
  ],
  COMPOUND: [
    Permission.COMPOUND_CREATE,
    Permission.COMPOUND_READ,
    Permission.COMPOUND_UPDATE,
    Permission.COMPOUND_DELETE,
    Permission.COMPOUND_REPORTS,
  ],
  RAW_MATERIAL: [
    Permission.RAW_MATERIAL_CREATE,
    Permission.RAW_MATERIAL_READ,
    Permission.RAW_MATERIAL_UPDATE,
    Permission.RAW_MATERIAL_DELETE,
    Permission.RAW_MATERIAL_REPORTS,
  ],
} as const;

export const ALL_PERMISSIONS = Object.values(Permission);

/**
 * Map legacy permission strings to the simplified model.
 * Used when migrating stored user.permissions arrays.
 */
const LEGACY_PERMISSION_MAP: Record<string, Permission[]> = {
  // Fabrics (inventory)
  'fabric:view': [Permission.FABRIC_READ],
  'fabric:create': [Permission.FABRIC_CREATE],
  'fabric:update': [Permission.FABRIC_UPDATE],
  'fabric:delete': [Permission.FABRIC_DELETE],
  'fabric:read': [Permission.FABRIC_READ],
  'fabric:reports': [Permission.FABRIC_REPORTS],

  // Fabric settings → fabric module
  'fabric_type:view': [Permission.FABRIC_READ],
  'fabric_type:create': [Permission.FABRIC_CREATE],
  'fabric_type:update': [Permission.FABRIC_UPDATE],
  'fabric_type:delete': [Permission.FABRIC_DELETE],
  'fabric_strength:view': [Permission.FABRIC_READ],
  'fabric_strength:create': [Permission.FABRIC_CREATE],
  'fabric_strength:update': [Permission.FABRIC_UPDATE],
  'fabric_strength:delete': [Permission.FABRIC_DELETE],
  'fabric_width:view': [Permission.FABRIC_READ],
  'fabric_width:create': [Permission.FABRIC_CREATE],
  'fabric_width:update': [Permission.FABRIC_UPDATE],
  'fabric_width:delete': [Permission.FABRIC_DELETE],

  // Compounds
  'compound_master:view': [Permission.COMPOUND_READ],
  'compound_master:create': [Permission.COMPOUND_CREATE],
  'compound_master:update': [Permission.COMPOUND_UPDATE],
  'compound_master:delete': [Permission.COMPOUND_DELETE],
  'compound_batch:view': [Permission.COMPOUND_READ],
  'compound_batch:create': [Permission.COMPOUND_CREATE],
  'compound_batch:update': [Permission.COMPOUND_UPDATE],
  'compound_batch:delete': [Permission.COMPOUND_DELETE],
  'compound:create': [Permission.COMPOUND_CREATE],
  'compound:read': [Permission.COMPOUND_READ],
  'compound:update': [Permission.COMPOUND_UPDATE],
  'compound:delete': [Permission.COMPOUND_DELETE],
  'compound:reports': [Permission.COMPOUND_REPORTS],

  // Raw materials
  'raw_material_batch:view': [Permission.RAW_MATERIAL_READ],
  'raw_material_batch:create': [Permission.RAW_MATERIAL_CREATE],
  'raw_material_batch:update': [Permission.RAW_MATERIAL_UPDATE],
  'raw_material_batch:delete': [Permission.RAW_MATERIAL_DELETE],
  'raw_material:create': [Permission.RAW_MATERIAL_CREATE],
  'raw_material:read': [Permission.RAW_MATERIAL_READ],
  'raw_material:update': [Permission.RAW_MATERIAL_UPDATE],
  'raw_material:delete': [Permission.RAW_MATERIAL_DELETE],
  'raw_material:reports': [Permission.RAW_MATERIAL_REPORTS],

  // Global reports → all module reports
  'reports:view': [
    Permission.FABRIC_REPORTS,
    Permission.COMPOUND_REPORTS,
    Permission.RAW_MATERIAL_REPORTS,
  ],
  'reports:export': [
    Permission.FABRIC_REPORTS,
    Permission.COMPOUND_REPORTS,
    Permission.RAW_MATERIAL_REPORTS,
  ],
};

/**
 * Normalize a stored permissions array to the current Permission enum.
 * Drops unknown / obsolete values (belt, rating, user, dashboard, etc.).
 */
export function normalizePermissions(permissions: string[]): Permission[] {
  const next = new Set<Permission>();

  for (const raw of permissions) {
    const mapped = LEGACY_PERMISSION_MAP[raw];
    if (mapped) {
      for (const p of mapped) next.add(p);
      continue;
    }
    if ((ALL_PERMISSIONS as string[]).includes(raw)) {
      next.add(raw as Permission);
    }
  }

  return ALL_PERMISSIONS.filter((p) => next.has(p));
}
