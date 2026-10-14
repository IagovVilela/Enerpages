"use server";

import { Secret, TOTP } from "otpauth";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/admin";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export async function beginTotp() {
  const user = await requireAdmin();
  const secret = new Secret({ size: 20 });
  const totp = new TOTP({ issuer: "Studio", label: user.email, secret, digits: 6, period: 30 });
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { totpSecretEncrypted: encryptSecret(secret.base32), totpEnabled: false },
  });
  return { qr: await QRCode.toDataURL(totp.toString()), secret: secret.base32 };
}

export async function confirmTotp(code: string) {
  const user = await requireAdmin();
  if (!user.totpSecretEncrypted) return { ok: false as const, error: "Gere um segredo antes." };
  const secret = decryptSecret(user.totpSecretEncrypted);
  const totp = new TOTP({ secret, digits: 6, period: 30 });
  if (totp.validate({ token: code, window: 1 }) === null) return { ok: false as const, error: "Código inválido." };
  await prisma.adminUser.update({ where: { id: user.id }, data: { totpEnabled: true } });
  return { ok: true as const };
}

export async function disableTotp(password: string, code: string) {
  const user = await requireAdmin();
  if (!(await verifyPassword(password, user.passwordHash))) return { ok: false as const, error: "Senha inválida." };
  if (user.totpEnabled && user.totpSecretEncrypted) {
    const secret = decryptSecret(user.totpSecretEncrypted);
    const totp = new TOTP({ secret, digits: 6, period: 30 });
    if (totp.validate({ token: code, window: 1 }) === null) return { ok: false as const, error: "Código inválido." };
  }
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { totpEnabled: false, totpSecretEncrypted: null },
  });
  return { ok: true as const };
}
