import prisma from "./prisma";
import bcrypt from "bcryptjs";

async function seedAdminUser() {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "Admin" },
    });
    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("123456", 10);

    await prisma.user.create({
      data: {
        name: "Aseem",
        mobileNumber: "8437702351",
        password: hashedPassword,
        role: "Admin",
        isActive: true,
      },
    });
    console.log("🌱 Admin user seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
  }
}

async function dbConnect(): Promise<void> {
  try {
    // Test the connection by running a simple query
    await prisma.$connect();
    console.log("✅ DB connected successfully");

    // Seed admin user after successful connection
    await seedAdminUser();
  } catch (error) {
    console.log("❌ Database connection failed", error);
    process.exit(1);
  }
}

export default dbConnect;
