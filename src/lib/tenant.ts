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
    host.endsWith(".vercel.app")
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

export function publicOrigin(slug: string) {
  const host = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${slug}.${host}`;
}
