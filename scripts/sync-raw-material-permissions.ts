/**
 * Backfill raw-material batch permissions for all users based on compound/fabric grants.
 * Usage: pnpm run sync-raw-material-permissions
 */
import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { withRawMaterialBatchPermissions } from '../src/lib/rbac/raw-material-permissions';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, permissions: true },
  });

  let updated = 0;

  for (const user of users) {
    const next = withRawMaterialBatchPermissions(user.permissions);
    const changed =
      next.length !== user.permissions.length ||
      next.some((p) => !user.permissions.includes(p));

    if (!changed) continue;

    await prisma.user.update({
      where: { id: user.id },
      data: { permissions: next },
    });
    updated++;
    console.log(`Updated permissions for user #${user.id} (${user.name})`);
  }

  console.log(
    updated > 0
      ? `Done: ${updated} user(s) updated.`
      : 'Done: all users already have aligned raw-material permissions.'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
