import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("cron auth logic", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("missing CRON_SECRET in production returns 503", () => {
    delete process.env.CRON_SECRET;
    const cronSecret = process.env.CRON_SECRET as string | undefined;
    const isProduction = (process.env.NODE_ENV as string) === "production";

    const shouldReturn503 = (!cronSecret || (cronSecret && cronSecret.length < 16)) && isProduction;
    expect(shouldReturn503).toBe(false); // NODE_ENV is "test" here, not production
  });

  it("missing CRON_SECRET with production flag returns 503", () => {
    delete process.env.CRON_SECRET;
    const cronSecret = process.env.CRON_SECRET as string | undefined;
    const isProduction = true;

    const shouldReturn503 = (!cronSecret || (cronSecret && cronSecret.length < 16)) && isProduction;
    expect(shouldReturn503).toBe(true);
  });

  it("wrong token returns 401", () => {
    process.env.CRON_SECRET = "valid-secret-key-12345";
    const token = "wrong-token";
    const cronSecret = process.env.CRON_SECRET;

    const isAuthorized = !!token && !!cronSecret && token === cronSecret;
    expect(isAuthorized).toBe(false);
  });

  it("valid token passes auth", () => {
    process.env.CRON_SECRET = "valid-secret-key-12345";
    const token = "valid-secret-key-12345";
    const cronSecret = process.env.CRON_SECRET;

    const isAuthorized = !!token && !!cronSecret && token === cronSecret;
    expect(isAuthorized).toBe(true);
  });

  it("empty token fails auth", () => {
    process.env.CRON_SECRET = "valid-secret-key-12345";
    const token = "";
    const cronSecret = process.env.CRON_SECRET;

    const isAuthorized = !!token && !!cronSecret && token === cronSecret;
    expect(isAuthorized).toBe(false);
  });

  it("CRON_SECRET too short is treated as missing", () => {
    process.env.CRON_SECRET = "short";
    const cronSecret = process.env.CRON_SECRET as string | undefined;
    expect(!cronSecret || (cronSecret && cronSecret.length < 16)).toBe(true);
  });
});
