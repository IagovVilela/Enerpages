import { parseSiteCanvasConfig, type SiteCanvasConfig } from "@/lib/canvas/site-canvas";
import { prisma, prismaPublic } from "@/lib/db";
import { pageDataSchema, type PageDocument } from "@/puck/schema";

export type PublicPage = {
  id: string;
  slug: string;
  clientName: string;
  logoUrl: string | null;
  segment: string;
  archetype: string | null;
  seoTitle: string;
  seoDescription: string;
  customDomain: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishEngine: "PUCK" | "CANVAS";
  data: PageDocument | null;
  canvas: SiteCanvasConfig | null;
};

type StateRow = {
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  customDomain: string | null;
  clientName: string;
  logoUrl: string | null;
};

type PublishedRow = {
  id: string;
  slug: string;
  customDomain: string | null;
  clientName: string;
  logoUrl: string | null;
  segment: string;
  publishedData: unknown;
  canvasPublished: unknown | null;
  publishEngine: "PUCK" | "CANVAS";
  seoTitle: string;
  seoDescription: string;
  archetype: string | null;
};

function isMissingRelation(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const meta = "meta" in error ? (error as { meta?: { code?: string; message?: string } }).meta : undefined;
  const message = "message" in error ? String((error as { message?: unknown }).message) : "";
  return (
    meta?.code === "42P01" ||
    /relation .* does not exist/i.test(meta?.message || "") ||
    /relation .* does not exist/i.test(message)
  );
}

async function readStateFromAdmin(where: { slug?: string; host?: string }): Promise<StateRow | null> {
  const page = where.slug
    ? await prisma.page.findUnique({ where: { slug: where.slug } })
    : await prisma.page.findUnique({ where: { customDomain: where.host } });
  if (!page) return null;
  return {
    slug: page.slug,
    status: page.status,
    customDomain: page.customDomain,
    clientName: page.clientName,
    logoUrl: page.logoUrl,
  };
}

async function readPublishedFromAdmin(slug: string): Promise<PublishedRow | null> {
  const page = await prisma.page.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!page) return null;
  return {
    id: page.id,
    slug: page.slug,
    customDomain: page.customDomain,
    clientName: page.clientName,
    logoUrl: page.logoUrl,
    segment: page.segment,
    publishedData: page.publishedData,
    canvasPublished: page.canvasPublished,
    publishEngine: page.publishEngine,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    archetype: page.archetype,
  };
}

async function readState(where: { slug?: string; host?: string }): Promise<StateRow | null> {
  if (!process.env.DATABASE_URL_PUBLIC) {
    return readStateFromAdmin(where);
  }
  try {
    const rows = where.slug
      ? await prismaPublic.$queryRaw<StateRow[]>`SELECT slug, status::text as status, "customDomain", "clientName", "logoUrl" FROM "PageState" WHERE slug = ${where.slug} LIMIT 1`
      : await prismaPublic.$queryRaw<StateRow[]>`SELECT slug, status::text as status, "customDomain", "clientName", "logoUrl" FROM "PageState" WHERE "customDomain" = ${where.host} LIMIT 1`;
    return rows[0] ?? null;
  } catch (error) {
    if (!isMissingRelation(error)) throw error;
    return readStateFromAdmin(where);
  }
}

async function readPublished(slug: string): Promise<PublishedRow | null> {
  if (!process.env.DATABASE_URL_PUBLIC) {
    return readPublishedFromAdmin(slug);
  }
  try {
    const rows = await prismaPublic.$queryRaw<PublishedRow[]>`
      SELECT id, slug, "customDomain", "clientName", "logoUrl", segment, "publishedData", "canvasPublished",
             "publishEngine"::text as "publishEngine", "seoTitle", "seoDescription", archetype
      FROM "PublishedPage" WHERE slug = ${slug} LIMIT 1
    `;
    return rows[0] ?? null;
  } catch (error) {
    if (!isMissingRelation(error)) throw error;
    return readPublishedFromAdmin(slug);
  }
}

/** Injeta logoUrl da página nos blocos Navbar/Footer sem gravar no JSON. */
export function withClientLogo(data: PageDocument, logoUrl: string | null): PageDocument {
  if (!logoUrl) return data;
  return {
    ...data,
    content: data.content.map((block) => {
      if (block.type !== "Navbar" && block.type !== "Footer") return block;
      return { ...block, props: { ...block.props, logoImage: logoUrl } } as typeof block;
    }),
  };
}

export async function loadPublicPage(where: { slug?: string; host?: string }): Promise<PublicPage | null> {
  const state = await readState(where);
  if (!state) return null;
  if (state.status !== "PUBLISHED") {
    return {
      id: "",
      slug: state.slug,
      clientName: state.clientName,
      logoUrl: state.logoUrl,
      segment: "",
      archetype: null,
      seoTitle: state.clientName,
      seoDescription: "",
      customDomain: state.customDomain,
      status: state.status,
      publishEngine: "PUCK",
      data: null,
      canvas: null,
    };
  }
  const row = await readPublished(state.slug);
  const engine = row?.publishEngine === "CANVAS" ? "CANVAS" : "PUCK";
  const parsed = pageDataSchema.safeParse(row?.publishedData);
  const canvas =
    engine === "CANVAS" && row?.canvasPublished
      ? parseSiteCanvasConfig(row.canvasPublished, row.clientName || state.clientName)
      : null;
  const logoUrl = row?.logoUrl ?? state.logoUrl;

  return {
    id: row?.id || "",
    slug: state.slug,
    clientName: row?.clientName || state.clientName,
    logoUrl,
    segment: row?.segment || "",
    archetype: row?.archetype ?? null,
    seoTitle: row?.seoTitle || state.clientName,
    seoDescription: row?.seoDescription || "",
    customDomain: row?.customDomain ?? state.customDomain,
    status: "PUBLISHED",
    publishEngine: engine,
    data: parsed.success ? withClientLogo(parsed.data, logoUrl) : null,
    canvas,
  };
}
