import prisma from "./prisma";

/**
 * Ensures the database connection is established. Call once per request if needed.
 * Seeding is done via `npx prisma db seed`, not on every request.
 */
async function dbConnect(): Promise<void> {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error("❌ Database connection failed", error);
    throw error;
  }
}

export default dbConnect;
