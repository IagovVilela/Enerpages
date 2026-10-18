import { readFile } from "node:fs/promises";
import path from "node:path";
import { readUpload } from "@/lib/storage";

export function readFaviconFromDoc(data: unknown): string | null {
  const favicon = (data as { root?: { props?: { favicon?: string } } } | null)?.root?.props?.favicon;
  return typeof favicon === "string" && favicon.trim() ? favicon.trim() : null;
}

export async function serveLogoUrl(logoUrl: string) {
  if (logoUrl.startsWith("/uploads/")) {
    try {
      const key = logoUrl.replace(/^\/uploads\//, "");
      const file = await readUpload(key);
      return new Response(new Uint8Array(file.data), {
        headers: {
          "Content-Type": file.mimeType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      return null;
    }
  }

  if (/^https?:\/\//i.test(logoUrl)) {
    try {
      const remote = await fetch(logoUrl, { next: { revalidate: 3600 } });
      if (!remote.ok) return null;
      const type = remote.headers.get("content-type") || "image/png";
      const bytes = await remote.arrayBuffer();
      return new Response(bytes, {
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      return null;
    }
  }

  return null;
}

export async function serveBrandFallback() {
  const file = path.join(process.cwd(), "public", "brand", "favicon-32.png");
  const data = await readFile(file);
  return new Response(data, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

export async function resolveSiteIconResponse(input: {
  logoUrl: string | null;
  draftData: unknown;
  publishedData: unknown;
  status: string;
}) {
  const fromRoot =
    input.status === "PUBLISHED"
      ? readFaviconFromDoc(input.publishedData)
      : readFaviconFromDoc(input.draftData);
  const logoUrl = (fromRoot || input.logoUrl || "").trim();
  if (logoUrl) {
    const served = await serveLogoUrl(logoUrl);
    if (served) return served;
  }
  return serveBrandFallback();
}
