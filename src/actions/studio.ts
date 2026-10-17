"use server";

import { updateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { signPreview } from "@/lib/preview";
import { slugError } from "@/lib/slug";
import { pageDataSchema, SEGMENTS, type PageDocument } from "@/puck/schema";
import { blankDocument } from "@/puck/defaults";
import { buildPageTemplate, isPageTemplateId, type PageTemplateId } from "@/puck/page-templates";
import type { VersionSource } from "@prisma/client";

function seo(data: PageDocument) {
  return {
    seoTitle: data.root.props.seo.title,
    seoDescription: data.root.props.seo.description,
    archetype: data.root.props.archetype,
  };
}

async function snapshot(pageId: string, data: PageDocument, source: VersionSource, label: string) {
  const page = await prisma.page.update({
    where: { id: pageId },
    data: { currentVersion: { increment: 1 } },
  });
  await prisma.pageVersion.create({
    data: { pageId, version: page.currentVersion, data, source, label },
  });
}

export async function saveDraft(pageId: string, data: unknown) {
  await requireAdmin();
  const parsed = pageDataSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: "O documento da página está inválido." };
  await prisma.page.update({
    where: { id: pageId },
    data: { draftData: parsed.data, ...seo(parsed.data) },
  });
  const last = await prisma.pageVersion.findFirst({
    where: { pageId, source: "AUTOSAVE" },
    orderBy: { createdAt: "desc" },
  });
  if (!last || Date.now() - last.createdAt.getTime() > 180000) {
    await snapshot(pageId, parsed.data, "AUTOSAVE", "Autosave");
  }
  return { ok: true as const };
}

export async function publishPage(pageId: string, data: unknown) {
  await requireAdmin();
  const parsed = pageDataSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: "Revise os campos antes de publicar." };
  const page = await prisma.page.update({
    where: { id: pageId },
    data: {
      draftData: parsed.data,
      publishedData: parsed.data,
      status: "PUBLISHED",
      publishedAt: new Date(),
      ...seo(parsed.data),
    },
  });
  await snapshot(pageId, parsed.data, "PUBLISH", "Publicação");
  updateTag(`page:${page.slug}`);
  if (page.customDomain) updateTag(`domain:${page.customDomain}`);
  updateTag("pages:index");
  return { ok: true as const, slug: page.slug };
}

export async function unpublishPage(pageId: string) {
  await requireAdmin();
  const page = await prisma.page.update({
    where: { id: pageId },
    data: { status: "DRAFT" },
  });
  updateTag(`page:${page.slug}`);
  updateTag("pages:index");
}

async function uniqueSlug(base: string) {
  const error = slugError(base);
  if (error) return { ok: false as const, error };
  const taken = await prisma.page.findUnique({ where: { slug: base }, select: { id: true } });
  if (!taken) return { ok: true as const, slug: base };
  const suffix = Date.now().toString().slice(-4);
  const candidate = `${base.slice(0, Math.max(1, 63 - suffix.length - 1))}-${suffix}`;
  const stillTaken = await prisma.page.findUnique({ where: { slug: candidate }, select: { id: true } });
  if (stillTaken) return { ok: false as const, error: "Esse subdomínio já existe. Escolha outro." };
  return { ok: true as const, slug: candidate };
}

export async function createPage(input: {
  clientName: string;
  segment: string;
  slug: string;
  data?: PageDocument;
  templateId?: PageTemplateId | string;
}) {
  await requireAdmin();
  const resolved = await uniqueSlug(input.slug);
  if (!resolved.ok) return resolved;
  const slug = resolved.slug;
  const segment = SEGMENTS.find((item) => item === input.segment) ?? "local";
  const templateId = input.templateId && isPageTemplateId(input.templateId) ? input.templateId : null;
  const data =
    input.data ??
    (templateId ? buildPageTemplate(templateId, input.clientName, segment) : blankDocument(input.clientName, segment));
  const parsed = pageDataSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "A proposta gerada está inválida para o editor. Gere de novo ou use outra proposta.",
    };
  }
  try {
    const page = await prisma.page.create({
      data: {
        slug,
        clientName: input.clientName,
        segment: input.segment,
        draftData: parsed.data,
        ...seo(parsed.data),
        versions: {
          create: {
            version: 1,
            data: parsed.data,
            source: "MANUAL",
            label: templateId ? `Modelo ${templateId}` : "Criação",
          },
        },
      },
    });
    return { ok: true as const, id: page.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/unique|slug/i.test(message)) {
      return { ok: false as const, error: "Esse subdomínio acabou de ser usado. Tente de novo." };
    }
    return { ok: false as const, error: "Não foi possível criar a página. Tente de novo." };
  }
}

export async function applyPageTemplate(pageId: string, templateId: string, clientName: string, segment: string) {
  await requireAdmin();
  if (!isPageTemplateId(templateId)) return { ok: false as const, error: "Modelo inválido." };
  const resolvedSegment = SEGMENTS.find((item) => item === segment) ?? "local";
  const parsed = pageDataSchema.parse(buildPageTemplate(templateId, clientName, resolvedSegment));
  await prisma.page.update({
    where: { id: pageId },
    data: { draftData: parsed, segment: resolvedSegment, ...seo(parsed) },
  });
  await snapshot(pageId, parsed, "MANUAL", `Modelo ${templateId}`);
  return { ok: true as const, data: parsed };
}

export async function updatePageMeta(pageId: string, input: { clientName: string; slug: string; customDomain: string }) {
  await requireAdmin();
  const error = slugError(input.slug);
  if (error) return { ok: false as const, error };
  const domain = input.customDomain.trim().toLowerCase();
  try {
    const page = await prisma.page.update({
      where: { id: pageId },
      data: {
        clientName: input.clientName,
        slug: input.slug,
        customDomain: domain || null,
      },
    });
    updateTag(`page:${page.slug}`);
    updateTag("pages:index");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Subdomínio ou domínio já está em uso." };
  }
}

export async function duplicatePage(pageId: string) {
  await requireAdmin();
  const page = await prisma.page.findUniqueOrThrow({ where: { id: pageId } });
  let slug = `${page.slug}-copia`;
  const error = slugError(slug);
  if (error) slug = `${page.slug}-2`;
  const exists = await prisma.page.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now().toString().slice(-4)}`;
  const copy = await prisma.page.create({
    data: {
      slug,
      clientName: `${page.clientName} cópia`,
      segment: page.segment,
      draftData: page.draftData ?? {},
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      archetype: page.archetype,
      versions: { create: { version: 1, data: page.draftData ?? {}, source: "MANUAL", label: "Duplicada" } },
    },
  });
  return copy.id;
}

export async function archivePage(pageId: string) {
  await requireAdmin();
  const page = await prisma.page.update({ where: { id: pageId }, data: { status: "ARCHIVED" } });
  updateTag(`page:${page.slug}`);
  updateTag("pages:index");
}

export async function deletePage(pageId: string) {
  await requireAdmin();
  const page = await prisma.page.delete({ where: { id: pageId } });
  updateTag(`page:${page.slug}`);
  updateTag("pages:index");
}

export async function restoreVersion(pageId: string, versionId: string) {
  await requireAdmin();
  const version = await prisma.pageVersion.findFirstOrThrow({ where: { id: versionId, pageId } });
  const parsed = pageDataSchema.parse(version.data);
  await prisma.page.update({
    where: { id: pageId },
    data: { draftData: parsed, ...seo(parsed) },
  });
  await snapshot(pageId, parsed, "RESTORE", `Restaurado da versão ${version.version}`);
}

export async function previewLink(pageId: string) {
  await requireAdmin();
  return signPreview(pageId);
}
