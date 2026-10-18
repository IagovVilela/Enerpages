import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveHost, rootDomain } from "@/lib/tenant";

const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth",
  "/api/leads",
  "/api/analytics",
  "/api/intake",
  "/intake",
  "/preview",
  "/site",
  "/uploads",
];

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;
  const resolved = resolveHost(host, rootDomain());

  if (resolved.kind === "tenant" || resolved.kind === "custom") {
    if (
      pathname.startsWith("/api/leads") ||
      pathname.startsWith("/api/analytics") ||
      pathname.startsWith("/api/site-icon") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/uploads")
    ) {
      return NextResponse.next();
    }
    /** Favicon do tenant: logo do cliente, sem usar o ícone global da Enerpages. */
    if (
      pathname === "/favicon.ico" ||
      pathname === "/icon" ||
      pathname.startsWith("/icon.") ||
      pathname.startsWith("/apple-icon")
    ) {
      const url = request.nextUrl.clone();
      if (resolved.kind === "tenant") {
        url.pathname = `/api/site-icon/${resolved.slug}`;
      } else {
        url.pathname = `/api/site-icon/domain/${encodeURIComponent(resolved.host)}`;
      }
      return NextResponse.rewrite(url);
    }
    const url = request.nextUrl.clone();
    url.pathname =
      resolved.kind === "tenant"
        ? `/site/slug/${resolved.slug}`
        : `/site/domain/${encodeURIComponent(resolved.host)}`;
    return NextResponse.rewrite(url);
  }

  /** Em /site/slug/... no host do studio, /favicon.ico ainda pedia a marca Enerpages. */
  if (
    pathname === "/favicon.ico" ||
    pathname === "/icon" ||
    pathname.startsWith("/icon.") ||
    pathname.startsWith("/apple-icon")
  ) {
    const referer = request.headers.get("referer") || "";
    const slugMatch = referer.match(/\/site\/slug\/([^/?#]+)/i);
    if (slugMatch?.[1]) {
      const url = request.nextUrl.clone();
      url.pathname = `/api/site-icon/${decodeURIComponent(slugMatch[1])}`;
      return NextResponse.rewrite(url);
    }
    const domainMatch = referer.match(/\/site\/domain\/([^/?#]+)/i);
    if (domainMatch?.[1]) {
      const url = request.nextUrl.clone();
      url.pathname = `/api/site-icon/domain/${domainMatch[1]}`;
      return NextResponse.rewrite(url);
    }
  }

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Auth.js v5 em HTTPS usa o cookie `__Secure-authjs.session-token`.
  // Sem secureCookie:true o getToken procura o nome errado e o login "funciona"
  // mas o proxy manda de volta para /login.
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const secureCookie =
    forwardedProto === "https" ||
    request.nextUrl.protocol === "https:" ||
    Boolean(process.env.AUTH_URL?.startsWith("https://"));

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie,
  });
  if (!token) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/favicon.ico",
    "/icon",
    "/icon/:path*",
    "/apple-icon",
    "/apple-icon/:path*",
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
