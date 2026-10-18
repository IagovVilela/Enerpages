import { prisma } from "@/lib/db";
import { resolveSiteIconResponse, serveBrandFallback } from "@/lib/site-icon";

export const runtime = "nodejs";

/** Favicon do site do cliente (tenant). Fallback: marca Enerpages. */
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const page = await prisma.page.findUnique({
    where: { slug },
    select: { logoUrl: true, draftData: true, publishedData: true, status: true },
  });
  if (!page) return serveBrandFallback();
  return resolveSiteIconResponse(page);
}
