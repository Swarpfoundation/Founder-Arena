export const PUBLIC_PATHS = new Set([
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

export const PUBLIC_PREFIXES = [
  "/s/",              // Public startup share pages  /s/[slug]
  "/f/",              // Public founder share pages  /f/[slug]
  "/api/auth/",       // Auth.js: sign-in, callback, signout, session, csrf
  "/api/mobile-auth/",// Mobile auth endpoints validate codes/tokens in handlers
  "/api/cron/",       // Cron endpoints enforce CRON_SECRET in handlers
  "/r/",              // Referral capture links set a short-lived attribution cookie.
];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

export function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

export function hasBearerAuthorizationHeader(value: string | null): boolean {
  return /^Bearer\s+\S+$/.test(value ?? "");
}
