import { prisma } from "@/lib/db";
import { resolveSiteIconResponse, serveBrandFallback } from "@/lib/site-icon";

/** Favicon por domínio próprio do cliente. */
export async function GET(_request: Request, context: { params: Promise<{ domain: string }> }) {
  const { domain } = await context.params;
  const host = decodeURIComponent(domain).toLowerCase();
  const page = await prisma.page.findUnique({
    where: { customDomain: host },
    select: { logoUrl: true, draftData: true, publishedData: true, status: true },
  });
  if (!page) return serveBrandFallback();
  return resolveSiteIconResponse(page);
}
