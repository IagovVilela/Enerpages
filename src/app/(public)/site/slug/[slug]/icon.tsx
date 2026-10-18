import { prisma } from "@/lib/db";
import { resolveSiteIconResponse, serveBrandFallback } from "@/lib/site-icon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Ícone da rota /site/slug/[slug] — logo do cliente, não a marca Enerpages. */
export default async function Icon({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({
    where: { slug },
    select: { logoUrl: true, draftData: true, publishedData: true, status: true },
  });
  if (!page) return serveBrandFallback();
  return resolveSiteIconResponse(page);
}
