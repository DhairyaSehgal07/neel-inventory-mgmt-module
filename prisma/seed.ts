import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { ALL_PERMISSIONS, normalizePermissions } from '../src/lib/rbac/permissions';

async function syncExistingUserPermissions(
  user: { id: number; permissions: string[] },
  permissions: string[]
) {
  const next = normalizePermissions(permissions);
  const changed =
    next.length !== user.permissions.length ||
    next.some((p) => !user.permissions.includes(p));

  if (!changed) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { permissions: next },
  });
  console.log(`🔄 Synced permissions for user #${user.id}`);
}

export async function main() {
  try {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const permissions = [...ALL_PERMISSIONS];

    // Seed Aseem (Admin)
    const aseemMobile = '8437702351';
    const existingAseem = await prisma.user.findFirst({
      where: { mobileNumber: aseemMobile },
    });

    if (existingAseem) {
      console.log('✅ User Aseem already exists');
      await syncExistingUserPermissions(existingAseem, permissions);
    } else {
      await prisma.user.create({
        data: {
          name: 'Aseem',
          mobileNumber: aseemMobile,
          password: hashedPassword,
          role: 'Admin',
          permissions,
          isActive: true,
        },
      });
      console.log('🌱 User Aseem (Admin) seeded successfully with all permissions');
    }

    // Seed office (Manager)
    const officeMobile = '9876902351';
    const existingOffice = await prisma.user.findFirst({
      where: { mobileNumber: officeMobile },
    });

    if (existingOffice) {
      console.log('✅ User office already exists');
      await syncExistingUserPermissions(existingOffice, permissions);
    } else {
      await prisma.user.create({
        data: {
          name: 'office',
          mobileNumber: officeMobile,
          password: hashedPassword,
          role: 'Manager',
          permissions,
          isActive: true,
        },
      });
      console.log('🌱 User office (Manager) seeded successfully with all permissions');
    }

    // Seed Stores (Supervisor - below Manager)
    const storesMobile = '9876902360';
    const existingStores = await prisma.user.findFirst({
      where: { mobileNumber: storesMobile },
    });

    if (existingStores) {
      console.log('✅ User Stores already exists');
      await syncExistingUserPermissions(existingStores, permissions);
    } else {
      await prisma.user.create({
        data: {
          name: 'Stores',
          mobileNumber: storesMobile,
          password: hashedPassword,
          role: 'Supervisor',
          permissions,
          isActive: true,
        },
      });
      console.log('🌱 User Stores (Supervisor) seeded successfully with all permissions');
    }

    // Migrate all other users to the simplified permission model
    const others = await prisma.user.findMany({
      where: {
        mobileNumber: { notIn: [aseemMobile, officeMobile, storesMobile] },
      },
      select: { id: true, name: true, permissions: true },
    });

    for (const user of others) {
      const next = normalizePermissions(user.permissions);
      const changed =
        next.length !== user.permissions.length ||
        next.some((p) => !user.permissions.includes(p));
      if (!changed) continue;
      await prisma.user.update({
        where: { id: user.id },
        data: { permissions: next },
      });
      console.log(`🔄 Migrated permissions for user #${user.id} (${user.name})`);
    }
  } catch (error) {
    console.error('❌ Error seeding user:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
