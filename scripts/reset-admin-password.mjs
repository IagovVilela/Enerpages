import { PrismaClient } from "@prisma/client";
import { argon2id, argon2Verify } from "hash-wasm";

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return argon2id({
    password,
    salt,
    parallelism: 1,
    iterations: 2,
    memorySize: 19456,
    hashLength: 32,
    outputType: "encoded",
  });
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 10) {
    throw new Error("ADMIN_EMAIL/ADMIN_PASSWORD inválidos");
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  console.log("found", Boolean(existing), "totp", existing?.totpEnabled ?? null);

  if (existing) {
    const matches = await argon2Verify({ password, hash: existing.passwordHash }).catch(() => false);
    console.log("matchesEnv", matches);
    if (!matches) {
      await prisma.adminUser.update({
        where: { email },
        data: {
          passwordHash: await hashPassword(password),
          totpEnabled: false,
          totpSecretEncrypted: null,
        },
      });
      console.log("passwordReset", true);
    }
  } else {
    await prisma.adminUser.create({
      data: { email, name: "Admin", passwordHash: await hashPassword(password) },
    });
    console.log("adminCreated", true);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
