// 인증 가드 — 보호 경로 접근 시 세션 쿠키(JWT)를 낙관적으로 검증하고 미로그인 시 /login 으로 보낸다.
// (Next.js 16: middleware → proxy 로 개명, nodejs 런타임)

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

const PROTECTED = ["/dashboard", "/company", "/alerts", "/billing"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const uid = token ? await verifySessionToken(token) : null;
  if (uid === null) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/company/:path*", "/alerts/:path*", "/billing/:path*"],
};
