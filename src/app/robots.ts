import type { MetadataRoute } from "next";
import { rootDomain } from "@/lib/tenant";

export default function robots(): MetadataRoute.Robots {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN || rootDomain();
  const protocol = root.includes("localhost") ? "http" : "https";
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${protocol}://${root}/sitemap.xml`,
  };
}
