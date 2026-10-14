import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Render } from "@puckeditor/core/rsc";
import { cacheLife, cacheTag } from "next/cache";
import { config } from "@/puck/config";
import { loadPublicPage, type PublicPage } from "@/lib/published";
import { ARCHETYPES } from "@/lib/ai/archetypes";
import { publicOrigin } from "@/lib/tenant";
import type { PageDocument } from "@/puck/schema";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await cachedPage(slug);
  if (!page || page.status !== "PUBLISHED" || !page.data) {
    return { title: page ? `${page.clientName} · em construção` : "Página não encontrada", robots: { index: false, follow: false } };
  }
  return metadataFor(page);
}

export default function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<p className="p-8">Carregando…</p>}>
      <SiteBody params={params} />
    </Suspense>
  );
}

async function SiteBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await cachedPage(slug);
  if (!page) notFound();
  return <SiteView page={page} />;
}

export async function cachedPage(slug: string) {
  "use cache";
  cacheTag(`page:${slug}`);
  cacheLife("hours");
  return loadPublicPage({ slug });
}

export function SiteView({ page }: { page: PublicPage }) {
  if (page.status !== "PUBLISHED" || !page.data) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em]">Em construção</p>
          <h1 className="mt-3 text-5xl">{page.clientName}</h1>
        </div>
      </main>
    );
  }
  const data = withRuntime(page.data, page.slug, page.id);
  const schema = jsonLd(page);
  const ga = /^G-[A-Z0-9]+$/.test(page.data.root.props.analytics.ga4) ? page.data.root.props.analytics.ga4 : "";
  const pixel = /^\d{5,20}$/.test(page.data.root.props.analytics.metaPixel) ? page.data.root.props.analytics.metaPixel : "";
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {ga ? <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" /> : null}
      {ga ? <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}</Script> : null}
      {pixel ? <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}</Script> : null}
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" /> : null}
      <Render config={config} data={data} />
    </>
  );
}

function withRuntime(data: PageDocument, slug: string, pageId: string): PageDocument {
  return { ...data, root: { props: { ...data.root.props, slug, pageId } } };
}

function metadataFor(page: PublicPage): Metadata {
  const seo = page.data?.root.props.seo;
  const url = page.customDomain ? `https://${page.customDomain}` : publicOrigin(page.slug);
  return {
    title: seo?.title || page.seoTitle,
    description: seo?.description || page.seoDescription,
    alternates: { canonical: url },
    openGraph: {
      title: seo?.title || page.seoTitle,
      description: seo?.description || page.seoDescription,
      url,
      images: seo?.ogImage ? [seo.ogImage] : undefined,
    },
    icons: page.data?.root.props.favicon ? { icon: page.data.root.props.favicon } : undefined,
  };
}

function jsonLd(page: PublicPage) {
  const type = ARCHETYPES[page.archetype || page.segment]?.schemaType || "WebPage";
  return {
    "@context": "https://schema.org",
    "@type": type,
    name: page.clientName,
    description: page.seoDescription,
    url: page.customDomain ? `https://${page.customDomain}` : publicOrigin(page.slug),
  };
}
