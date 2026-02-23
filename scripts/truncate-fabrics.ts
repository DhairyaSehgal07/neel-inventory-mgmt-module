/**
 * Truncate the fabrics table and restart identity (reset auto-increment).
 * Usage: pnpm run truncate-fabrics
 */
import 'dotenv/config';
import prisma from '../src/lib/prisma';

const SQL = 'TRUNCATE TABLE "fabrics" RESTART IDENTITY CASCADE;';

async function main() {
  await prisma.$executeRawUnsafe(SQL);
  console.log('Done: fabrics table truncated, identity restarted.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
