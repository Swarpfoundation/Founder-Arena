import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  rateLimit,
  checkRateLimit,
  RATE_LIMITS,
} from "@/lib/rate-limit";

describe("rate limiter enhanced", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("rateLimit is async and returns result", async () => {
    const result = await rateLimit("async-key", 3, 60_000);
    expect(result.success).toBe(true);
    expect(result.limit).toBe(3);
    expect(result.remaining).toBe(2);
  });

  it("checkRateLimit is async and returns null when allowed", async () => {
    const error = await checkRateLimit("user-async", "read");
    expect(error).toBeNull();
  });

  it("checkRateLimit returns message when blocked", async () => {
    const config = RATE_LIMITS.aiAnalysis;
    for (let i = 0; i < config.maxRequests; i++) {
      await checkRateLimit("user-blocked", "aiAnalysis");
    }
    const error = await checkRateLimit("user-blocked", "aiAnalysis");
    expect(error).toContain("Rate limit exceeded");
  });

  it("resets after window expires", async () => {
    await rateLimit("reset-key", 1, 60_000);
    const now = Date.now();
    vi.setSystemTime(now + 61_000);
    const result = await rateLimit("reset-key", 1, 60_000);
    expect(result.success).toBe(true);
  });

  it("uses Upstash when env vars are set", async () => {
    const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

    // Re-import to pick up new env vars
    const mod = await vi.importActual<typeof import("@/lib/rate-limit")>("@/lib/rate-limit");
    const result = await mod.rateLimit("upstash-key", 5, 60_000);

    // Should fallback to in-memory because fetch to test URL will fail
    expect(result.success).toBe(true);

    process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  });
});
