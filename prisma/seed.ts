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
    const mobileNumber = '8437702351';

    const existing = await prisma.user.findFirst({
      where: { mobileNumber },
    });

    if (existing) {
      console.log('✅ User Aseem already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('123456', 10);
    const permissions = ALL_PERMISSIONS.map((p) => String(p));

    await prisma.user.create({
      data: {
        name: 'Aseem',
        mobileNumber,
        password: hashedPassword,
        role: 'Admin',
        permissions,
        isActive: true,
      },
    });

    console.log('🌱 User Aseem (Admin) seeded successfully with all permissions');
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
