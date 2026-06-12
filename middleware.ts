import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import { hasBearerAuthorizationHeader, isApiPath, isPublicPath } from "@/lib/middleware-routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const isPublic = isPublicPath(nextUrl.pathname);

  // Allow public routes unconditionally
  if (isPublic) {
    return NextResponse.next();
  }

  // In dev with demo mode, allow all routes
  const demoMode = process.env.DEMO_MODE_ENABLED === "true";
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev && demoMode) {
    return NextResponse.next();
  }

  // Native/mobile API clients authenticate inside route handlers with
  // Authorization: Bearer. Let handlers validate tokens and return JSON.
  if (isApiPath(nextUrl.pathname) && hasBearerAuthorizationHeader(req.headers.get("authorization"))) {
    return NextResponse.next();
  }

  // Protected route: require auth
  if (!isLoggedIn) {
    if (isApiPath(nextUrl.pathname)) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).+)",
  ],
};
