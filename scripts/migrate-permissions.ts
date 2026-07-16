/**
 * Migrate all users to the simplified permission model
 * (fabrics / compounds / raw materials CRUD + reports).
 *
 * Usage: pnpm run migrate-permissions
 */
import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { normalizePermissions } from '../src/lib/rbac/permissions';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, permissions: true },
  });

  let updated = 0;

  for (const user of users) {
    const next = normalizePermissions(user.permissions);
    const changed =
      next.length !== user.permissions.length ||
      next.some((p) => !user.permissions.includes(p)) ||
      user.permissions.some((p) => !next.includes(p as (typeof next)[number]));

    if (!changed) continue;

    await prisma.user.update({
      where: { id: user.id },
      data: { permissions: next },
    });
    updated++;
    console.log(
      `Updated #${user.id} (${user.name}, ${user.role}): ${user.permissions.length} → ${next.length} permissions`
    );
  }

  console.log(
    updated > 0
      ? `Done: ${updated} user(s) migrated.`
      : 'Done: all users already use the simplified permission model.'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
