import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/pricing",
  "/market",
  "/leaderboard",
  "/graveyard",
  "/how-to-play",
  "/api/auth",
  "/api/health",
  "/s",
  "/f",
];

const PUBLIC_PREFIXES = ["/s/", "/f/", "/api/"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

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

  // Protected route: require auth
  if (!isLoggedIn) {
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
