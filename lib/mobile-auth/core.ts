import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const MOBILE_AUTH_PROVIDERS = ["google", "github"] as const;
export type MobileAuthProvider = (typeof MOBILE_AUTH_PROVIDERS)[number];

export type MobileTokenStatus =
  | { valid: true }
  | { valid: false; reason: "missing" | "expired" | "revoked" };

const DEFAULT_ALLOWED_REDIRECT_URIS = ["founderarena://auth-callback"];
const DEFAULT_CODE_TTL_SECONDS = 300;
const DEFAULT_TOKEN_TTL_DAYS = 30;

export function isMobileAuthEnabled(env: Partial<NodeJS.ProcessEnv> = process.env): boolean {
  return env.MOBILE_AUTH_ENABLED !== "false";
}

export function getAllowedRedirectUris(env: Partial<NodeJS.ProcessEnv> = process.env): string[] {
  const configured = env.MOBILE_AUTH_ALLOWED_REDIRECT_URIS;
  if (!configured) return DEFAULT_ALLOWED_REDIRECT_URIS;
  return configured
    .split(",")
    .map((uri) => uri.trim())
    .filter(Boolean);
}

export function getMobileAuthCodeTtlSeconds(env: Partial<NodeJS.ProcessEnv> = process.env): number {
  const parsed = Number(env.MOBILE_AUTH_CODE_TTL_SECONDS);
  return Number.isFinite(parsed) && parsed >= 60 && parsed <= 900 ? Math.floor(parsed) : DEFAULT_CODE_TTL_SECONDS;
}

export function getMobileAuthTokenTtlDays(env: Partial<NodeJS.ProcessEnv> = process.env): number {
  const parsed = Number(env.MOBILE_AUTH_TOKEN_TTL_DAYS);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 365 ? Math.floor(parsed) : DEFAULT_TOKEN_TTL_DAYS;
}

export function parseMobileAuthProvider(value: string | null): MobileAuthProvider | null {
  return value === "google" || value === "github" ? value : null;
}

export function isAllowedMobileRedirectUri(
  redirectUri: string,
  env: Partial<NodeJS.ProcessEnv> = process.env
): boolean {
  return getAllowedRedirectUris(env).includes(redirectUri);
}

export function sha256Base64Url(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

export function hashMobileSecret(value: string, env: Partial<NodeJS.ProcessEnv> = process.env): string {
  const pepper = env.AUTH_SECRET ?? env.NEXTAUTH_SECRET ?? "founder-arena-mobile-auth-dev-pepper";
  return createHash("sha256").update(`${pepper}:${value}`).digest("hex");
}

export function createOpaqueMobileSecret(byteLength = 32): string {
  return randomBytes(byteLength).toString("base64url");
}

export function buildExpiryDate(now: Date, seconds: number): Date {
  return new Date(now.getTime() + seconds * 1000);
}

export function buildTokenExpiryDate(now: Date, days: number): Date {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

export function sanitizeMobileMetadata(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/[\u0000-\u001F\u007F]/g, "");
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export function verifyPkceChallenge(input: {
  codeChallenge?: string | null;
  codeChallengeMethod?: string | null;
  codeVerifier?: string | null;
}): boolean {
  if (!input.codeChallenge) return true;
  if (!input.codeVerifier || input.codeVerifier.length < 32 || input.codeVerifier.length > 128) return false;

  const method = input.codeChallengeMethod ?? "S256";
  if (method !== "S256") return false;

  return timingSafeStringEqual(sha256Base64Url(input.codeVerifier), input.codeChallenge);
}

export function timingSafeStringEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.byteLength !== bBuffer.byteLength) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

export function evaluateMobileTokenStatus(input: {
  found: boolean;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
  now?: Date;
}): MobileTokenStatus {
  const now = input.now ?? new Date();
  if (!input.found) return { valid: false, reason: "missing" };
  if (input.revokedAt) return { valid: false, reason: "revoked" };
  if (!input.expiresAt || input.expiresAt.getTime() <= now.getTime()) {
    return { valid: false, reason: "expired" };
  }
  return { valid: true };
}

export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const parts = authorizationHeader.trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const [scheme, token] = parts;
  if (scheme !== "Bearer" || !token || token.includes(" ")) return null;
  return token.trim();
}

export function buildMobileAuthCallbackUrl(input: {
  baseUrl: string;
  attemptId: string;
  state: string;
}): string {
  const url = new URL("/api/mobile-auth/callback", input.baseUrl);
  url.searchParams.set("attempt", input.attemptId);
  url.searchParams.set("state", input.state);
  return url.toString();
}

export function appendCodeToMobileRedirect(input: {
  redirectUri: string;
  code: string;
  state: string;
}): string {
  const separator = input.redirectUri.includes("?") ? "&" : "?";
  return `${input.redirectUri}${separator}code=${encodeURIComponent(input.code)}&state=${encodeURIComponent(input.state)}`;
}
