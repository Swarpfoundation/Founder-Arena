import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Exact-match paths that require no authentication.
// Add new public API routes here explicitly — never add a broad /api/ prefix.
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/pricing",
  "/market",
  "/leaderboard",
  "/graveyard",
  "/how-to-play",
  "/demo",
  // Public API routes (each must be justified individually)
  "/api/health",            // Deployment health check
  "/api/webhooks/stripe",   // Stripe webhook — signature verified inside handler
  "/api/market/snapshot",   // Read-only market data consumed by the public /market page
  "/api/vc-review-firms",   // Fictional firm catalog only; no user/deck data
  // Share page roots (sub-paths handled by PUBLIC_PREFIXES)
  "/s",
  "/f",
]);

// Prefix-match paths where ALL sub-routes must be public.
// Keep this list narrow.
const PUBLIC_PREFIXES = [
  "/s/",        // Public startup share pages  /s/[slug]
  "/f/",        // Public founder share pages  /f/[slug]
  "/api/auth/", // Auth.js: sign-in, callback, signout, session, csrf
  "/api/cron/", // Cron endpoints: Vercel Cron runs unauthenticated; each handler
                // enforces CRON_SECRET (≥16 chars) before doing any work.
  "/r/",         // Referral capture links set a short-lived attribution cookie.
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
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
