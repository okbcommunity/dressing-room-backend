import { PrismaClient } from '@prisma/client';

export const { closeDB, connectDB, db } = (() => {
  let db: PrismaClient | null = null;

  function connectDB(): PrismaClient {
    if (db == null) {
      console.log('Successfully connected to database.');
      db = new PrismaClient();
    }
    return db;
  }

  async function closeDB() {
    if (db != null) {
      await db.$disconnect();
      console.log('Successfully closed the connection to the database.');
    }
  }

  return { closeDB, connectDB, db: db ?? connectDB() };
})();
