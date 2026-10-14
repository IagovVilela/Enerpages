import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import { SiteView } from "@/app/(public)/site/slug/[slug]/page";
import { loadPublicPage } from "@/lib/published";

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const page = await cachedDomain(domain);
  if (!page?.data) return { title: "Página não encontrada", robots: { index: false } };
  return { title: page.seoTitle, description: page.seoDescription };
}

export default function DomainPage({ params }: { params: Promise<{ domain: string }> }) {
  return (
    <Suspense fallback={<p className="p-8">Carregando…</p>}>
      <DomainBody params={params} />
    </Suspense>
  );
}

async function DomainBody({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const page = await cachedDomain(domain);
  if (!page) notFound();
  return <SiteView page={page} />;
}

async function cachedDomain(domain: string) {
  "use cache";
  const host = decodeURIComponent(domain);
  cacheTag(`domain:${host}`);
  cacheLife("hours");
  return loadPublicPage({ host });
}
