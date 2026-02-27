import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { ALL_PERMISSIONS } from '../src/lib/rbac/permissions';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

export async function main() {
  try {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const permissions = ALL_PERMISSIONS.map((p) => String(p));

    // Seed Aseem (Admin)
    const aseemMobile = '8437702351';
    const existingAseem = await prisma.user.findFirst({
      where: { mobileNumber: aseemMobile },
    });

    if (existingAseem) {
      console.log('✅ User Aseem already exists');
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
