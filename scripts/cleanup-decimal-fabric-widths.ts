/**
 * Remove fabric_widths master records whose value is not a whole number (cm).
 * Skips widths still referenced by fabrics (reports and exits with error).
 *
 * Usage: pnpm run cleanup-decimal-fabric-widths
 */
import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  const widths = await prisma.fabricWidth.findMany({ orderBy: { value: 'asc' } });
  const decimalWidths = widths.filter((w) => !Number.isInteger(w.value));

  if (decimalWidths.length === 0) {
    console.log('No decimal fabric widths found.');
    return;
  }

  console.log(`Found ${decimalWidths.length} decimal fabric width(s):`);
  for (const w of decimalWidths) {
    const fabricCount = await prisma.fabric.count({ where: { fabricWidthId: w.id } });
    console.log(`  id=${w.id} value=${w.value} fabrics=${fabricCount}`);
    if (fabricCount > 0) {
      throw new Error(
        `Cannot delete fabric width id=${w.id} (value=${w.value}): ${fabricCount} fabric(s) still reference it`
      );
    }
  }

  const ids = decimalWidths.map((w) => w.id);
  const result = await prisma.fabricWidth.deleteMany({ where: { id: { in: ids } } });
  console.log(`Deleted ${result.count} decimal fabric width(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
