"use server";

import { revalidatePath, updateTag } from "next/cache";
import type { Prisma, VersionSource } from "@prisma/client";
import { requireAdmin } from "@/lib/admin";
import { canvasToPuck, puckToCanvas } from "@/lib/canvas/bridge";
import { parseSiteCanvasConfig, siteCanvasSchema } from "@/lib/canvas/site-canvas";
import { prisma } from "@/lib/db";
import { signPreview } from "@/lib/preview";
import { parsePageTags } from "@/lib/segment-labels";
import { slugError } from "@/lib/slug";
import { blankDocument } from "@/puck/defaults";
import { buildPageTemplate, isPageTemplateId, type PageTemplateId } from "@/puck/page-templates";
import { pageDataSchema, SEGMENTS, type PageDocument } from "@/puck/schema";

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

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
      publishEngine: "PUCK",
      editorMode: "PUCK",
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

export async function saveCanvasDraft(pageId: string, data: unknown) {
  await requireAdmin();
  const page = await prisma.page.findUnique({ where: { id: pageId }, select: { clientName: true } });
  if (!page) return { ok: false as const, error: "Página não encontrada." };
  const parsed = siteCanvasSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: "O canvas está inválido." };
  await prisma.page.update({
    where: { id: pageId },
    data: { canvasDraft: asJson(parsed.data), editorMode: "CANVAS" },
  });
  return { ok: true as const };
}

export async function publishCanvas(pageId: string, data: unknown) {
  await requireAdmin();
  const pageMeta = await prisma.page.findUnique({ where: { id: pageId }, select: { clientName: true, slug: true, customDomain: true } });
  if (!pageMeta) return { ok: false as const, error: "Página não encontrada." };
  const parsed = siteCanvasSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: "Revise o canvas antes de publicar." };
  const page = await prisma.page.update({
    where: { id: pageId },
    data: {
      canvasDraft: asJson(parsed.data),
      canvasPublished: asJson(parsed.data),
      status: "PUBLISHED",
      publishEngine: "CANVAS",
      editorMode: "CANVAS",
      publishedAt: new Date(),
      seoTitle: pageMeta.clientName,
    },
  });
  updateTag(`page:${page.slug}`);
  if (page.customDomain) updateTag(`domain:${page.customDomain}`);
  updateTag("pages:index");
  return { ok: true as const, slug: page.slug };
}

export async function setEditorMode(pageId: string, mode: "PUCK" | "CANVAS") {
  await requireAdmin();
  await prisma.page.update({ where: { id: pageId }, data: { editorMode: mode } });
  return { ok: true as const };
}

export async function savePuckDraftFromExport(pageId: string, data: unknown) {
  await requireAdmin();
  const parsed = pageDataSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: "Exportação para Puck inválida." };
  await prisma.page.update({
    where: { id: pageId },
    data: { draftData: parsed.data, editorMode: "PUCK", ...seo(parsed.data) },
  });
  await snapshot(pageId, parsed.data, "MANUAL", "Exportado do Ze");
  return { ok: true as const, data: parsed.data };
}

export async function saveCanvasFromExport(pageId: string, data: unknown, clientName: string) {
  await requireAdmin();
  const canvas = parseSiteCanvasConfig(data, clientName);
  await prisma.page.update({
    where: { id: pageId },
    data: { canvasDraft: asJson(canvas), editorMode: "CANVAS" },
  });
  return { ok: true as const, data: canvas };
}

/** Converte o rascunho Puck salvo no banco → canvas (exportação confiável). */
export async function exportPuckDraftToCanvas(pageId: string) {
  await requireAdmin();
  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) return { ok: false as const, error: "Página não encontrada." };
  const parsed = pageDataSchema.safeParse(page.draftData);
  if (!parsed.success) return { ok: false as const, error: "Rascunho Puck inválido. Salve antes de exportar." };
  const canvas = puckToCanvas(parsed.data, page.clientName);
  await prisma.page.update({
    where: { id: pageId },
    data: { canvasDraft: asJson(canvas), editorMode: "CANVAS" },
  });
  return { ok: true as const, data: canvas };
}

/** Converte o canvas salvo → Puck. */
export async function exportCanvasDraftToPuck(pageId: string) {
  await requireAdmin();
  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) return { ok: false as const, error: "Página não encontrada." };
  const canvas = parseSiteCanvasConfig(page.canvasDraft, page.clientName);
  const doc = canvasToPuck(canvas, page.clientName, page.segment);
  await prisma.page.update({
    where: { id: pageId },
    data: { draftData: doc, editorMode: "PUCK", ...seo(doc) },
  });
  await snapshot(pageId, doc, "MANUAL", "Exportado do Ze");
  return { ok: true as const, data: doc };
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

export async function updatePageSegment(pageId: string, segment: string) {
  await requireAdmin();
  const resolved = SEGMENTS.find((item) => item === segment) ?? "local";
  await prisma.page.update({ where: { id: pageId }, data: { segment: resolved } });
  revalidatePath("/");
  updateTag("pages:index");
  return { ok: true as const };
}

export async function updatePageTags(pageId: string, tags: string[]) {
  await requireAdmin();
  const next = parsePageTags(tags);
  await prisma.page.update({ where: { id: pageId }, data: { tags: next } });
  revalidatePath("/");
  updateTag("pages:index");
  return { ok: true as const, tags: next };
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
      tags: page.tags ?? [],
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
