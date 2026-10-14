import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, hashIp, hitRateLimit } from "@/lib/rate-limit";

const eventSchema = z.object({
  slug: z.string().min(1),
  type: z.enum(["view", "cta"]),
});

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const page = await prisma.page.findFirst({ where: { slug: parsed.data.slug, status: "PUBLISHED" }, select: { id: true } });
  if (!page) return Response.json({ ok: false }, { status: 404 });
  const ipHash = hashIp(clientIp(request.headers.get("x-forwarded-for")));
  const limit = await hitRateLimit(`event:${parsed.data.type}:${page.id}:${ipHash}`, parsed.data.type === "view" ? 1 : 20, 60 * 60 * 1000);
  if (!limit.ok) return Response.json({ ok: true });
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  await prisma.analyticsDaily.upsert({
    where: { pageId_day: { pageId: page.id, day } },
    create: { pageId: page.id, day, views: parsed.data.type === "view" ? 1 : 0, ctaClicks: parsed.data.type === "cta" ? 1 : 0 },
    update: parsed.data.type === "view" ? { views: { increment: 1 } } : { ctaClicks: { increment: 1 } },
  });
  return Response.json({ ok: true });
}
