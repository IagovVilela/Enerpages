export type HostResolution =
  | { kind: "studio" }
  | { kind: "tenant"; slug: string }
  | { kind: "custom"; host: string };

const STUDIO_LABELS = new Set(["www", "studio", "app"]);

export function hostnameOf(hostHeader: string) {
  return hostHeader.split(":")[0].toLowerCase();
}

export function resolveHost(hostHeader: string, rootDomain: string): HostResolution {
  const host = hostnameOf(hostHeader);
  const root = hostnameOf(rootDomain);

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === root ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".up.railway.app")
  ) {
    return { kind: "studio" };
  }

  if (host.endsWith(`.${root}`)) {
    const slug = host.slice(0, -(root.length + 1));
    if (!slug || slug.includes(".")) return { kind: "custom", host };
    if (STUDIO_LABELS.has(slug)) return { kind: "studio" };
    return { kind: "tenant", slug };
  }

  return { kind: "custom", host };
}

export function rootDomain() {
  return process.env.ROOT_DOMAIN || "localhost";
}

/** Hosts de plataforma sem wildcard SSL em subdomínio aninhado (ex.: *.service.up.railway.app). */
export function usesPathTenantUrls(host: string) {
  const h = hostnameOf(host);
  return (
    h.endsWith(".up.railway.app") ||
    h.endsWith(".railway.app") ||
    h.endsWith(".vercel.app")
  );
}

export function publicOrigin(slug: string) {
  const host = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000").replace(/\/$/, "");
  const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
  if (usesPathTenantUrls(host)) {
    return `${protocol}://${host}/site/slug/${slug}`;
  }
  return `${protocol}://${slug}.${host}`;
}
