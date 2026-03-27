/**
 * Normalize all fabric codes to the format from src/lib/fabricCode.ts:
 * {id}-{typeName}-{strengthName}-{widthValue}-{vendor}-{sequence}-{dateStr}
 *
 * For any fabric whose fabricCode does not already start with its id, recompute
 * the code using generateFabricCode and update the record.
 *
 * Usage: pnpm run normalize-fabric-codes
 */
import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { generateFabricCode } from '../src/lib/fabricCode';

function sequenceFromExistingCode(fabricCode: string): number {
  const parts = fabricCode.split('-');
  if (parts.length < 2) return 1;
  const parsed = parseInt(parts[parts.length - 2], 10);
  return Number.isNaN(parsed) ? 1 : parsed;
}

async function main() {
  const fabrics = await prisma.fabric.findMany({
    include: {
      fabricType: true,
      fabricStrength: true,
      fabricWidth: true,
    },
    orderBy: { id: 'asc' },
  });

  let updated = 0;
  for (const fabric of fabrics) {
    const expectedPrefix = `${fabric.id}-`;
    if (fabric.fabricCode.startsWith(expectedPrefix)) {
      continue;
    }

    const sequenceNumber = sequenceFromExistingCode(fabric.fabricCode);
    const dateStr =
      fabric.fabricDate && fabric.fabricDate.length >= 10
        ? fabric.fabricDate.slice(0, 10)
        : (fabric.date instanceof Date
            ? fabric.date
            : new Date(fabric.date)
          ).toISOString().slice(0, 10);

    const newCode = generateFabricCode({
      id: String(fabric.id),
      fabricTypeName: fabric.fabricType.name,
      fabricStrengthName: fabric.fabricStrength.name,
      fabricWidthValue: fabric.fabricWidth.value,
      nameOfVendor: fabric.nameOfVendor,
      sequenceNumber,
      dateStr,
    });

    if (newCode === fabric.fabricCode) continue;

    await prisma.fabric.update({
      where: { id: fabric.id },
      data: { fabricCode: newCode },
    });
    updated++;
    console.log(`Updated fabric ${fabric.id}: "${fabric.fabricCode}" → "${newCode}"`);
  }

  console.log(`Done: ${updated} fabric(s) updated, ${fabrics.length - updated} already in correct format.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
