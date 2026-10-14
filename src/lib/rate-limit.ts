import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

export function hashIp(ip: string) {
  return createHash("sha256")
    .update(`${ip}:${process.env.AUTH_SECRET || "dev"}`)
    .digest("hex")
    .slice(0, 32);
}

export function clientIp(header: string | null) {
  return header?.split(",")[0]?.trim() || "0.0.0.0";
}

export async function hitRateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const bucket = await prisma.rateBucket.findUnique({ where: { key } });
  if (!bucket || bucket.resetAt < now) {
    const resetAt = new Date(now.getTime() + windowMs);
    await prisma.rateBucket.upsert({
      where: { key },
      create: { key, count: 1, resetAt },
      update: { count: 1, resetAt },
    });
    return { ok: true as const };
  }
  if (bucket.count >= limit) return { ok: false as const };
  await prisma.rateBucket.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return { ok: true as const };
}
