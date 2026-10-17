import { prisma } from "../src/lib/db";
import { hashPassword, verifyPassword } from "../src/lib/password";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 10) {
    throw new Error("Defina ADMIN_EMAIL e ADMIN_PASSWORD com pelo menos 10 caracteres.");
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  console.log(
    JSON.stringify({
      found: Boolean(existing),
      email,
      totpEnabled: existing?.totpEnabled ?? null,
    }),
  );

  if (existing) {
    const matches = await verifyPassword(password, existing.passwordHash);
    console.log("passwordMatchesEnv", matches);
    if (!matches) {
      await prisma.adminUser.update({
        where: { email },
        data: { passwordHash: await hashPassword(password), totpEnabled: false, totpSecretEncrypted: null },
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
