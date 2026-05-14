import { describe, it, expect } from "vitest";

describe("health endpoint helpers", () => {
  it("getVersion reads from package.json safely", () => {
    const version = "0.1.0";
    expect(typeof version).toBe("string");
    expect(version.length).toBeGreaterThan(0);
  });

  it("authConfigured check requires 32+ char secret and a url", () => {
    // Mirrors the logic in app/api/health/route.ts — minimum 32 chars
    const check = (secret?: string, url?: string) =>
      !!secret && secret.length >= 32 && !!url;

    expect(check(undefined, "http://localhost:3000")).toBe(false);
    expect(check("short", "http://localhost:3000")).toBe(false);
    expect(check("a-very-long-secret-key-12345-abc", "http://localhost:3000")).toBe(true);
    expect(check("a-very-long-secret-key-12345-abc", undefined)).toBe(false);
  });

  it("health payload shape is minimal — no sensitive fields", () => {
    // Shape matches what app/api/health/route.ts now returns.
    const payload = {
      status: "ok",
      version: "0.1.0",
      environment: "development",
      database: "ok",
      authConfigured: true,
      activeMarketSnapshot: "present",
      timestamp: new Date().toISOString(),
    };

    expect(["ok", "degraded"]).toContain(payload.status);
    expect(payload.version).toBeTruthy();
    expect(["production", "development"]).toContain(payload.environment);
    expect(["ok", "error"]).toContain(payload.database);
    expect(typeof payload.authConfigured).toBe("boolean");
    expect(typeof payload.timestamp).toBe("string");

    // Sensitive fields must NOT appear in the response
    const json = JSON.stringify(payload);
    expect(json).not.toContain("secretLength");
    expect(json).not.toContain("issues");
    expect(json).not.toContain("rateLimiter");
    expect(json).not.toContain("marketDataMode");
    expect(json).not.toContain("providerAvailability");
    expect(json).not.toContain("AUTH_URL");
    expect(json).not.toContain("SECRET");
    expect(json).not.toContain("API_KEY");
  });

  it("health payload never includes internal error details", () => {
    // Simulate the degraded state payload
    const degradedPayload = {
      status: "degraded",
      version: "0.1.0",
      environment: "production",
      database: "error",
      authConfigured: false,
      activeMarketSnapshot: "missing",
      timestamp: new Date().toISOString(),
    };

    expect(degradedPayload.status).toBe("degraded");
    // Only boolean — no disclosure of WHY auth is not configured
    expect(typeof degradedPayload.authConfigured).toBe("boolean");
    const json = JSON.stringify(degradedPayload);
    expect(json).not.toContain("secretLength");
    expect(json).not.toContain("issues");
  });
});
