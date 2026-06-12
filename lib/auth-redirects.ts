const DEFAULT_AUTH_CALLBACK = "/dashboard";
const MOBILE_AUTH_CALLBACK_PATH = "/api/mobile-auth/callback";

export function isAllowedMobileAuthCallbackUrl(callbackUrl: string): boolean {
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) return false;
  try {
    const parsed = new URL(callbackUrl, "https://founder-arena.local");
    return parsed.origin === "https://founder-arena.local" && parsed.pathname === MOBILE_AUTH_CALLBACK_PATH;
  } catch {
    return false;
  }
}

export function sanitizeAuthCallbackUrl(callbackUrl: string | null | undefined): string {
  if (!callbackUrl) return DEFAULT_AUTH_CALLBACK;
  const trimmed = callbackUrl.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return DEFAULT_AUTH_CALLBACK;
  if (trimmed === "/login" || trimmed.startsWith("/login?")) {
    return DEFAULT_AUTH_CALLBACK;
  }
  if (trimmed.startsWith("/api/") && !isAllowedMobileAuthCallbackUrl(trimmed)) {
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
