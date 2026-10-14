import { prisma, prismaPublic } from "@/lib/db";
import { pageDataSchema, type PageDocument } from "@/puck/schema";

export type PublicPage = {
  id: string;
  slug: string;
  clientName: string;
  segment: string;
  archetype: string | null;
  seoTitle: string;
  seoDescription: string;
  customDomain: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  data: PageDocument | null;
};

type StateRow = { slug: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; customDomain: string | null; clientName: string };
type PublishedRow = {
  id: string;
  slug: string;
  customDomain: string | null;
  clientName: string;
  segment: string;
  publishedData: unknown;
  seoTitle: string;
  seoDescription: string;
  archetype: string | null;
};

async function readState(where: { slug?: string; host?: string }): Promise<StateRow | null> {
  if (!process.env.DATABASE_URL_PUBLIC) {
    const page = where.slug
      ? await prisma.page.findUnique({ where: { slug: where.slug } })
      : await prisma.page.findUnique({ where: { customDomain: where.host } });
    if (!page) return null;
    return { slug: page.slug, status: page.status, customDomain: page.customDomain, clientName: page.clientName };
  }
  const rows = where.slug
    ? await prismaPublic.$queryRaw<StateRow[]>`SELECT slug, status::text as status, "customDomain", "clientName" FROM "PageState" WHERE slug = ${where.slug} LIMIT 1`
    : await prismaPublic.$queryRaw<StateRow[]>`SELECT slug, status::text as status, "customDomain", "clientName" FROM "PageState" WHERE "customDomain" = ${where.host} LIMIT 1`;
  return rows[0] ?? null;
}

async function readPublished(slug: string): Promise<PublishedRow | null> {
  if (!process.env.DATABASE_URL_PUBLIC) {
    const page = await prisma.page.findFirst({ where: { slug, status: "PUBLISHED" } });
    if (!page?.publishedData) return null;
    return page;
  }
  const rows = await prismaPublic.$queryRaw<PublishedRow[]>`
    SELECT id, slug, "customDomain", "clientName", segment, "publishedData", "seoTitle", "seoDescription", archetype
    FROM "PublishedPage" WHERE slug = ${slug} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function loadPublicPage(where: { slug?: string; host?: string }): Promise<PublicPage | null> {
  const state = await readState(where);
  if (!state) return null;
  if (state.status !== "PUBLISHED") {
    return {
      id: "",
      slug: state.slug,
      clientName: state.clientName,
      segment: "",
      archetype: null,
      seoTitle: state.clientName,
      seoDescription: "",
      customDomain: state.customDomain,
      status: state.status,
      data: null,
    };
  }
  const row = await readPublished(state.slug);
  const parsed = pageDataSchema.safeParse(row?.publishedData);
  return {
    id: row?.id || "",
    slug: state.slug,
    clientName: row?.clientName || state.clientName,
    segment: row?.segment || "",
    archetype: row?.archetype ?? null,
    seoTitle: row?.seoTitle || state.clientName,
    seoDescription: row?.seoDescription || "",
    customDomain: row?.customDomain ?? state.customDomain,
    status: "PUBLISHED",
    data: parsed.success ? parsed.data : null,
  };
}
