"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { applyIntakeToDocument, emptyIntake, intakeSchema, type IntakePayload } from "@/lib/intake/schema";
import { createIntakeToken, intakeExpiresAt, intakePublicUrl } from "@/lib/intake/token";
import { normalizeSlug } from "@/lib/slug";
import { SEGMENTS } from "@/puck/schema";
import { buildPageTemplate, isPageTemplateId } from "@/puck/page-templates";
import { createPage } from "@/actions/studio";

export async function createIntakeInvite(input: {
  clientNameHint?: string;
  segmentHint?: string;
  notes?: string;
  origin?: string;
}) {
  await requireAdmin();
  const segment =
    input.segmentHint && (SEGMENTS as readonly string[]).includes(input.segmentHint)
      ? input.segmentHint
      : null;
  const invite = await prisma.intakeInvite.create({
    data: {
      token: createIntakeToken(),
      expiresAt: intakeExpiresAt(14),
      clientNameHint: input.clientNameHint?.trim() || null,
      segmentHint: segment,
      notes: input.notes?.trim() || null,
    },
  });
  return {
    ok: true as const,
    id: invite.id,
    token: invite.token,
    url: intakePublicUrl(invite.token, input.origin),
  };
}

export async function markIntakeExpiredIfNeeded(inviteId: string) {
  const invite = await prisma.intakeInvite.findUnique({ where: { id: inviteId } });
  if (!invite) return null;
  if (invite.status === "PENDING" && invite.expiresAt.getTime() < Date.now()) {
    return prisma.intakeInvite.update({
      where: { id: inviteId },
      data: { status: "EXPIRED" },
    });
  }
  return invite;
}

export async function createPageFromIntake(inviteId: string, slugInput?: string) {
  await requireAdmin();
  const invite = await prisma.intakeInvite.findUnique({
    where: { id: inviteId },
    include: { submission: true },
  });
  if (!invite?.submission) return { ok: false as const, error: "Este convite ainda não tem respostas." };
  if (invite.status === "USED" && invite.pageId) {
    return { ok: true as const, id: invite.pageId, already: true as const };
  }

  const parsed = intakeSchema.safeParse(invite.submission.payload);
  if (!parsed.success) return { ok: false as const, error: "Payload do cliente inválido." };
  const payload = parsed.data;
  const slug = normalizeSlug(slugInput || payload.clientName);
  const templateId = isPageTemplateId(payload.templateId) ? payload.templateId : "classic";
  const base = buildPageTemplate(templateId, payload.clientName, payload.segment);
  const data = applyIntakeToDocument(base, payload);

  const created = await createPage({
    clientName: payload.clientName,
    segment: payload.segment,
    slug,
    data,
    templateId,
  });
  if (!created.ok) return created;

  await prisma.intakeInvite.update({
    where: { id: inviteId },
    data: { status: "USED", pageId: created.id },
  });
  return { ok: true as const, id: created.id };
}

export async function openIntakeInBriefing(inviteId: string) {
  await requireAdmin();
  redirect(`/briefing?intake=${inviteId}`);
}

export async function linkIntakeToPage(inviteId: string, pageId: string) {
  await requireAdmin();
  const invite = await prisma.intakeInvite.findUnique({ where: { id: inviteId } });
  if (!invite) return { ok: false as const, error: "Convite não encontrado." };
  await prisma.intakeInvite.update({
    where: { id: inviteId },
    data: { status: "USED", pageId },
  });
  return { ok: true as const };
}

export function parseIntakePayload(raw: unknown): IntakePayload | null {
  const parsed = intakeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export { emptyIntake };
