import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter,
});

export async function main() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { mobileNumber: "9877741375" },
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("123456", 10);

    // Create admin user
    await prisma.user.create({
      data: {
        name: "Admin",
        mobileNumber: "9877741375",
        password: hashedPassword,
        role: "Admin",
        isActive: true,
        permissions: [],
      },
    });

    console.log("🌱 Admin user seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
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
