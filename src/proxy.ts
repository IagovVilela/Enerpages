import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveHost, rootDomain } from "@/lib/tenant";

const PUBLIC_PREFIXES = ["/login", "/api/auth", "/api/leads", "/api/analytics", "/preview", "/uploads"];

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;
  const resolved = resolveHost(host, rootDomain());

  if (resolved.kind === "tenant" || resolved.kind === "custom") {
    if (
      pathname.startsWith("/api/leads") ||
      pathname.startsWith("/api/analytics") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/uploads")
    ) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname =
      resolved.kind === "tenant"
        ? `/site/slug/${resolved.slug}`
        : `/site/domain/${encodeURIComponent(resolved.host)}`;
    return NextResponse.rewrite(url);
  }

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};
