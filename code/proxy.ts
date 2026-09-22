import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/token";

function isPublic(pathname: string) {
  if (pathname === "/app/login" || pathname.startsWith("/app/login/")) return true;
  if (pathname.startsWith("/api/auth/login") || pathname.startsWith("/api/auth/logout")) return true;
  if (pathname.startsWith("/api/p/") || pathname === "/api/p") return true;
  if (pathname.startsWith("/p/") || pathname === "/p") return true;
  if (pathname.startsWith("/_next") || pathname.startsWith("/brand") || pathname === "/favicon.ico") return true;
  return false;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/app/login";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/api/demo")) {
    return NextResponse.json({ error: "演示接口已关闭" }, { status: 404 });
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  const needsAuth =
    pathname === "/" ||
    pathname.startsWith("/app") ||
    pathname.startsWith("/api/");

  if (needsAuth && !isPublic(pathname)) {
    const session = readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "请先登录" }, { status: 401 });
      }
      const url = req.nextUrl.clone();
      url.pathname = "/app/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/).*)"],
};
