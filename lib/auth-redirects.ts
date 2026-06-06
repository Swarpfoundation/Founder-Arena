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
  void isAuthenticated;

  return {
    primaryHref: "#platforms",
    primaryLabel: "MOBILE BETA INFO",
    secondaryHref: "#game",
    secondaryLabel: "LEARN ABOUT THE GAME",
  };
}
