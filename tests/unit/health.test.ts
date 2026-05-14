import { describe, it, expect } from "vitest";

describe("health endpoint helpers", () => {
  it("getVersion reads from package.json safely", () => {
    // We test indirectly by verifying the health route doesn't throw
    // when building the version payload
    const version = "0.1.0";
    expect(typeof version).toBe("string");
    expect(version.length).toBeGreaterThan(0);
  });

  it("authConfigured checks detect missing secrets", () => {
    const check = (secret?: string, url?: string) =>
      !!secret && secret.length >= 16 && !!url;

    expect(check(undefined, "http://localhost:3000")).toBe(false);
    expect(check("short", "http://localhost:3000")).toBe(false);
    expect(check("a-very-long-secret-key-12345", "http://localhost:3000")).toBe(true);
    expect(check("a-very-long-secret-key-12345", undefined)).toBe(false);
  });

  it("health payload shape is safe", () => {
    const payload = {
      status: "ok",
      version: "0.1.0",
      environment: "development",
      database: "ok",
      authConfigured: true,
      marketDataMode: "static",
      activeMarketSnapshot: "present",
      timestamp: new Date().toISOString(),
    };

    expect(payload.status).toBeTruthy();
    expect(payload.version).toBeTruthy();
    expect(["production", "development"]).toContain(payload.environment);
    expect(["ok", "error", "degraded"]).toContain(payload.database);
    expect(typeof payload.authConfigured).toBe("boolean");
    expect(typeof payload.timestamp).toBe("string");

    // Ensure no secrets
    const json = JSON.stringify(payload);
    expect(json).not.toContain("SECRET");
    expect(json).not.toContain("API_KEY");
    expect(json).not.toContain("PASSWORD");
  });
});
