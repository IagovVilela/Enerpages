import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPublic?: PrismaClient;
};

/** Placeholder so `next build` can collect page data before runtime env is wired. */
const BUILD_DATABASE_URL = "postgresql://build:build@127.0.0.1:5432/build";

function databaseUrl(preferred?: string) {
  return preferred?.trim() || process.env.DATABASE_URL?.trim() || BUILD_DATABASE_URL;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl() } },
  });

export const prismaPublic =
  globalForPrisma.prismaPublic ??
  new PrismaClient({
    datasources: {
      db: { url: databaseUrl(process.env.DATABASE_URL_PUBLIC) },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPublic = prismaPublic;
}
