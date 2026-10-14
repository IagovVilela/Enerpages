import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPublic?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

export const prismaPublic =
  globalForPrisma.prismaPublic ??
  new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL_PUBLIC || process.env.DATABASE_URL },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPublic = prismaPublic;
}
