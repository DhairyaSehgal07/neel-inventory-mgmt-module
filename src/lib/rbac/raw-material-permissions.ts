import { Permission } from './permissions';

/**
 * When a user can perform an action on compounds or fabrics, grant the matching
 * raw-material batch permission so inventory access stays aligned.
 */
const RAW_MATERIAL_MIRROR_PAIRS: [Permission, Permission][] = [
  [Permission.COMPOUND_BATCH_VIEW, Permission.RAW_MATERIAL_BATCH_VIEW],
  [Permission.COMPOUND_BATCH_CREATE, Permission.RAW_MATERIAL_BATCH_CREATE],
  [Permission.COMPOUND_BATCH_UPDATE, Permission.RAW_MATERIAL_BATCH_UPDATE],
  [Permission.COMPOUND_BATCH_DELETE, Permission.RAW_MATERIAL_BATCH_DELETE],
  [Permission.FABRIC_VIEW, Permission.RAW_MATERIAL_BATCH_VIEW],
  [Permission.FABRIC_CREATE, Permission.RAW_MATERIAL_BATCH_CREATE],
  [Permission.FABRIC_UPDATE, Permission.RAW_MATERIAL_BATCH_UPDATE],
  [Permission.FABRIC_DELETE, Permission.RAW_MATERIAL_BATCH_DELETE],
];

/**
 * Adds raw-material batch permissions that mirror existing compound or fabric grants.
 */
export function withRawMaterialBatchPermissions(permissions: string[]): string[] {
  const set = new Set(permissions.filter(Boolean));

  for (const [source, target] of RAW_MATERIAL_MIRROR_PAIRS) {
    if (set.has(source)) {
      set.add(target);
    }
  }

  return [...set];
}
