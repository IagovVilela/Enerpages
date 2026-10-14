import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, hashIp, hitRateLimit } from "@/lib/rate-limit";

const leadSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1).max(120),
  email: z.string().email().max(160),
  phone: z.string().max(40).optional().or(z.literal("")),
  message: z.string().min(1).max(4000),
  company: z.string().optional(),
  token: z.string().optional(),
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return Response.json({ error: "Origem recusada." }, { status: 403 });
  }
  const parsed = leadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Dados inválidos." }, { status: 400 });
  if (parsed.data.company) return Response.json({ ok: true });

  const page = await prisma.page.findFirst({ where: { slug: parsed.data.slug, status: "PUBLISHED" } });
  if (!page) return Response.json({ error: "Página não encontrada." }, { status: 404 });

  if (process.env.TURNSTILE_SECRET_KEY) {
    const verified = await verifyTurnstile(parsed.data.token || "", clientIp(request.headers.get("x-forwarded-for")));
    if (!verified) return Response.json({ error: "Confirme o captcha." }, { status: 400 });
  }

  const ipHash = hashIp(clientIp(request.headers.get("x-forwarded-for")));
  const limit = await hitRateLimit(`lead:${page.id}:${ipHash}`, 5, 15 * 60 * 1000);
  if (!limit.ok) return Response.json({ error: "Muitas mensagens. Tente mais tarde." }, { status: 429 });

  const lead = await prisma.lead.create({
    data: {
      pageId: page.id,
      ipHash,
      payload: { name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone || "", message: parsed.data.message },
    },
  });

  if (process.env.RESEND_API_KEY && process.env.LEAD_EMAIL) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.LEAD_FROM || "Studio <onboarding@resend.dev>",
        to: process.env.LEAD_EMAIL,
        subject: `Lead de ${page.clientName}`,
        text: `${parsed.data.name} <${parsed.data.email}>\n${parsed.data.message}`,
      }),
    });
    if (response.ok) await prisma.lead.update({ where: { id: lead.id }, data: { notifiedAt: new Date() } });
  }

  return Response.json({ ok: true });
}

async function verifyTurnstile(token: string, ip: string) {
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY || "", response: token, remoteip: ip }),
  });
  const data = (await response.json()) as { success?: boolean };
  return Boolean(data.success);
}
