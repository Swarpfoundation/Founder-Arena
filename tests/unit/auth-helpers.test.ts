import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  rateLimit,
  checkRateLimit,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import {
  ActionError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  RateLimitError,
  toUserMessage,
} from "@/lib/errors";

describe("rate limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows requests within limit", async () => {
    const result = await rateLimit("test-key", 5, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests over limit", async () => {
    await rateLimit("test-key-2", 2, 60_000);
    await rateLimit("test-key-2", 2, 60_000);
    const result = await rateLimit("test-key-2", 2, 60_000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", async () => {
    await rateLimit("test-key-3", 1, 60_000);
    const now = Date.now();
    vi.setSystemTime(now + 61_000);
    const result = await rateLimit("test-key-3", 1, 60_000);
    expect(result.success).toBe(true);
  });

  it("checkRateLimit returns null when allowed", async () => {
    const error = await checkRateLimit("user-1", "aiAnalysis");
    expect(error).toBeNull();
  });

  it("checkRateLimit returns message when blocked", async () => {
    const config = RATE_LIMITS.aiAnalysis;
    for (let i = 0; i < config.maxRequests; i++) {
      await checkRateLimit("user-2", "aiAnalysis");
    }
    const error = await checkRateLimit("user-2", "aiAnalysis");
    expect(error).toContain("Rate limit exceeded");
  });
});

describe("error helpers", () => {
  it("ActionError has correct code", () => {
    const err = new ActionError("test", "TEST_CODE");
    expect(err.message).toBe("test");
    expect(err.code).toBe("TEST_CODE");
  });

  it("UnauthorizedError has default message", () => {
    const err = new UnauthorizedError();
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toContain("sign in");
  });

  it("toUserMessage handles ActionError", () => {
    const msg = toUserMessage(new ForbiddenError());
    expect(msg).toContain("permission");
  });

  it("toUserMessage handles generic errors", () => {
    const msg = toUserMessage(new Error("boom"));
    expect(msg).toBe("boom");
  });

  it("toUserMessage handles unknown errors", () => {
    const msg = toUserMessage("string error");
    expect(msg).toBe("An unexpected error occurred.");
  });
});
