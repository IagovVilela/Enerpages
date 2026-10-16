import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { publicOrigin } from "@/lib/tenant";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const pages = await publishedPages();
    return pages.map((page) => ({
      url: page.customDomain ? `https://${page.customDomain}` : publicOrigin(page.slug),
      lastModified: page.updatedAt,
    }));
  } catch {
    // Build containers cannot reach Railway private Postgres; runtime still serves a live sitemap.
    return [];
  }
}

async function publishedPages() {
  "use cache";
  cacheTag("pages:index");
  cacheLife("hours");
  return prisma.page.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true, customDomain: true },
  });
}
