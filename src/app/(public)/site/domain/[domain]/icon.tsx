import { prisma } from "@/lib/db";
import { resolveSiteIconResponse, serveBrandFallback } from "@/lib/site-icon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Ícone da rota /site/domain/[domain] — logo do cliente. */
export default async function Icon({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const host = decodeURIComponent(domain).toLowerCase();
  const page = await prisma.page.findUnique({
    where: { customDomain: host },
    select: { logoUrl: true, draftData: true, publishedData: true, status: true },
  });
  if (!page) return serveBrandFallback();
  return resolveSiteIconResponse(page);
}
