import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SiteView } from "@/app/(public)/site/slug/[slug]/page";
import { prisma } from "@/lib/db";
import { readPreview } from "@/lib/preview";
import { pageDataSchema } from "@/puck/schema";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={<p className="p-8">Carregando preview…</p>}>
      <PreviewBody params={params} />
    </Suspense>
  );
}

async function PreviewBody({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const pageId = readPreview(token);
  if (!pageId) notFound();
  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) notFound();
  const parsed = pageDataSchema.safeParse(page.draftData);
  if (!parsed.success) notFound();
  return (
    <SiteView
      page={{
        id: page.id,
        slug: page.slug,
        clientName: page.clientName,
        segment: page.segment,
        archetype: page.archetype,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        customDomain: page.customDomain,
        status: "PUBLISHED",
        data: parsed.data,
      }}
    />
  );
}
