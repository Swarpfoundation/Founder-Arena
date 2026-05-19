const DEFAULT_AUTH_CALLBACK = "/dashboard";

export function sanitizeAuthCallbackUrl(callbackUrl: string | null | undefined): string {
  if (!callbackUrl) return DEFAULT_AUTH_CALLBACK;
  const trimmed = callbackUrl.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return DEFAULT_AUTH_CALLBACK;
  if (trimmed === "/login" || trimmed.startsWith("/login?") || trimmed.startsWith("/api/")) {
    return DEFAULT_AUTH_CALLBACK;
  }
  return trimmed;
}

export function getLandingCtaState(isAuthenticated: boolean) {
  return isAuthenticated
    ? {
        primaryHref: "/dashboard",
        primaryLabel: "CONTINUE FOUNDER ARENA",
        secondaryHref: "/startup/new",
        secondaryLabel: "DEPLOY NEW RUN",
      }
    : {
        primaryHref: "/startup/new",
        primaryLabel: "START NEW RUN",
        secondaryHref: "/login",
        secondaryLabel: "LOGIN",
      };
}
