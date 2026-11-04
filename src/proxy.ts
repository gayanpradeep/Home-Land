import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

// Fast, cookie-presence-only redirect for UX. This is NOT the security boundary —
// every protected layout/route handler re-verifies the session and role against the
// database (see src/lib/permissions.ts), because middleware alone must never be trusted.
export function proxy(request: NextRequest) {
  const devBypass = process.env.NODE_ENV !== "production" && process.env.DEV_BYPASS_AUTH === "true";
  const hasSession = devBypass || request.cookies.has(SESSION_COOKIE_NAME);
  const { pathname } = request.nextUrl;

  const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/rate");

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/rate/:path*"],
};
