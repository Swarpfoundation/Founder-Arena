import { describe, expect, it } from "vitest";
import {
  appendCodeToMobileRedirect,
  buildMobileAuthCallbackUrl,
  evaluateMobileTokenStatus,
  extractBearerToken,
  getAllowedRedirectUris,
  getMobileAuthCodeTtlSeconds,
  getMobileAuthTokenTtlDays,
  hashMobileSecret,
  isAllowedMobileRedirectUri,
  parseMobileAuthProvider,
  sha256Base64Url,
  verifyPkceChallenge,
} from "@/lib/mobile-auth/core";

describe("mobile auth token exchange helpers", () => {
  it("accepts only supported OAuth providers", () => {
    expect(parseMobileAuthProvider("google")).toBe("google");
    expect(parseMobileAuthProvider("github")).toBe("github");
    expect(parseMobileAuthProvider("apple")).toBeNull();
    expect(parseMobileAuthProvider(null)).toBeNull();
  });

  it("allowlists mobile redirect URIs exactly", () => {
    const env = {
      MOBILE_AUTH_ALLOWED_REDIRECT_URIS: "founderarena://auth-callback,founderarena-dev://auth-callback",
    };

    expect(getAllowedRedirectUris(env)).toEqual([
      "founderarena://auth-callback",
      "founderarena-dev://auth-callback",
    ]);
    expect(isAllowedMobileRedirectUri("founderarena://auth-callback", env)).toBe(true);
    expect(isAllowedMobileRedirectUri("founderarena://auth-callback/extra", env)).toBe(false);
    expect(isAllowedMobileRedirectUri("https://evil.example/callback", env)).toBe(false);
  });

  it("bounds configurable TTLs to safe ranges", () => {
    expect(getMobileAuthCodeTtlSeconds({ MOBILE_AUTH_CODE_TTL_SECONDS: "120" })).toBe(120);
    expect(getMobileAuthCodeTtlSeconds({ MOBILE_AUTH_CODE_TTL_SECONDS: "3" })).toBe(300);
    expect(getMobileAuthTokenTtlDays({ MOBILE_AUTH_TOKEN_TTL_DAYS: "14" })).toBe(14);
    expect(getMobileAuthTokenTtlDays({ MOBILE_AUTH_TOKEN_TTL_DAYS: "9999" })).toBe(30);
  });

  it("verifies S256 PKCE and rejects invalid verifiers", () => {
    const verifier = "A".repeat(64);
    const challenge = sha256Base64Url(verifier);

    expect(verifyPkceChallenge({ codeChallenge: challenge, codeChallengeMethod: "S256", codeVerifier: verifier })).toBe(true);
    expect(verifyPkceChallenge({ codeChallenge: challenge, codeChallengeMethod: "S256", codeVerifier: "B".repeat(64) })).toBe(false);
    expect(verifyPkceChallenge({ codeChallenge: challenge, codeChallengeMethod: "plain", codeVerifier: verifier })).toBe(false);
    expect(verifyPkceChallenge({ codeChallenge: challenge, codeChallengeMethod: "S256", codeVerifier: "short" })).toBe(false);
  });

  it("does not store raw mobile codes or bearer tokens as hashes", () => {
    const raw = "mobile-secret-token";
    const hashed = hashMobileSecret(raw, { AUTH_SECRET: "test-secret" });

    expect(hashed).not.toBe(raw);
    expect(hashed).toMatch(/^[a-f0-9]{64}$/);
    expect(hashMobileSecret(raw, { AUTH_SECRET: "test-secret" })).toBe(hashed);
  });

  it("evaluates mobile token validity without exposing token content", () => {
    const now = new Date("2026-06-12T12:00:00.000Z");

    expect(evaluateMobileTokenStatus({ found: false, now })).toEqual({ valid: false, reason: "missing" });
    expect(evaluateMobileTokenStatus({ found: true, expiresAt: new Date("2026-06-12T11:59:00.000Z"), now }))
      .toEqual({ valid: false, reason: "expired" });
    expect(evaluateMobileTokenStatus({
      found: true,
      expiresAt: new Date("2026-06-13T12:00:00.000Z"),
      revokedAt: new Date("2026-06-12T12:00:00.000Z"),
      now,
    })).toEqual({ valid: false, reason: "revoked" });
    expect(evaluateMobileTokenStatus({
      found: true,
      expiresAt: new Date("2026-06-13T12:00:00.000Z"),
      now,
    })).toEqual({ valid: true });
  });

  it("parses strict bearer authorization headers", () => {
    expect(extractBearerToken("Bearer abc.def")).toBe("abc.def");
    expect(extractBearerToken("bearer abc.def")).toBeNull();
    expect(extractBearerToken("Bearer")).toBeNull();
    expect(extractBearerToken("Bearer abc def")).toBeNull();
    expect(extractBearerToken(null)).toBeNull();
  });

  it("builds callback and app redirect URLs without leaking secrets", () => {
    const callback = buildMobileAuthCallbackUrl({
      baseUrl: "https://api.founderarena.xyz",
      attemptId: "attempt-1",
      state: "state-1",
    });
    expect(callback).toBe("https://api.founderarena.xyz/api/mobile-auth/callback?attempt=attempt-1&state=state-1");

    const appRedirect = appendCodeToMobileRedirect({
      redirectUri: "founderarena://auth-callback",
      code: "code value",
      state: "state value",
    });
    expect(appRedirect).toBe("founderarena://auth-callback?code=code%20value&state=state%20value");
  });
});
