import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { redactValue, logger } from "@/lib/observability/logger";
import { withTiming } from "@/lib/observability/timing";
import { trackEvent, setAnalyticsAdapter, type AnalyticsAdapter, type GameEvent } from "@/lib/observability/events";

describe("observability", () => {
  describe("redactValue", () => {
    it("returns null/undefined as-is", () => {
      expect(redactValue(null)).toBeNull();
      expect(redactValue(undefined)).toBeUndefined();
    });

    it("redacts short strings", () => {
      expect(redactValue("abc")).toBe("***");
    });

    it("redacts long strings with prefix/suffix", () => {
      const result = redactValue("hello-world");
      expect(result).toBe("hel***rld");
    });

    it("passes through numbers and booleans", () => {
      expect(redactValue(42)).toBe(42);
      expect(redactValue(true)).toBe(true);
    });

    it("redacts arrays recursively", () => {
      const result = redactValue(["secret", 123, "another-secret"]);
      expect(result).toEqual(["***", 123, "ano***ret"]);
    });

    it("redacts sensitive object keys", () => {
      const result = redactValue({
        username: "alice",
        password: "supersecret",
        apiKey: "key-12345",
        count: 5,
      });
      expect(result).toEqual({
        username: "alice",
        password: "[REDACTED]",
        apiKey: "[REDACTED]",
        count: 5,
      });
    });

    it("redacts nested objects", () => {
      const result = redactValue({
        user: { name: "alice", token: "tok-abc" },
        data: { value: 10 },
      });
      expect(result).toEqual({
        user: { name: "alice", token: "[REDACTED]" },
        data: { value: 10 },
      });
    });
  });

  describe("logger", () => {
    let logSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      logSpy.mockRestore();
    });

    it("logs info with redacted meta", () => {
      logger.info("test message", { apiKey: "secret-key", count: 3 });
      expect(logSpy).toHaveBeenCalled();
      const call = logSpy.mock.calls[0] as unknown[];
      const meta = call[2] as Record<string, unknown>;
      expect(meta.apiKey).toBe("[REDACTED]");
      expect(meta.count).toBe(3);
    });

    it("logs error with redacted meta", () => {
      logger.error("error occurred", { password: "hunter2" });
      expect(logSpy).toHaveBeenCalled();
      const call = logSpy.mock.calls[0] as unknown[];
      const meta = call[2] as Record<string, unknown>;
      expect(meta.password).toBe("[REDACTED]");
    });
  });

  describe("withTiming", () => {
    let logSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      logSpy.mockRestore();
    });

    it("logs success for fast functions", async () => {
      const result = await withTiming("fast-op", async () => "ok");
      expect(result).toBe("ok");
      expect(logSpy).toHaveBeenCalled();
      const call = logSpy.mock.calls[0] as unknown[];
      const meta = call[2] as Record<string, unknown>;
      expect(meta.name).toBe("fast-op");
      expect(meta.status).toBe("ok");
      expect(typeof meta.durationMs).toBe("number");
    });

    it("logs failure for throwing functions", async () => {
      await expect(
        withTiming("fail-op", async () => {
          throw new Error("boom");
        })
      ).rejects.toThrow("boom");

      expect(logSpy).toHaveBeenCalled();
      const call = logSpy.mock.calls[0] as unknown[];
      const meta = call[2] as Record<string, unknown>;
      expect(meta.name).toBe("fail-op");
      expect(meta.status).toBe("error");
      expect(meta.error).toBe("boom");
    });

    it("passes through metadata", async () => {
      await withTiming("meta-op", async () => "ok", { userId: "u1" });
      const call = logSpy.mock.calls[0] as unknown[];
      const meta = call[2] as Record<string, unknown>;
      expect(meta.userId).toBe("u1");
    });
  });

  describe("trackEvent", () => {
    it("no-ops by default", () => {
      // Should not throw
      trackEvent("startup_created", { startupId: "s1" });
    });

    it("routes to custom adapter", () => {
      const tracked: { event: GameEvent; props?: Record<string, unknown> }[] = [];
      const adapter: AnalyticsAdapter = {
        track(event, properties) {
          tracked.push({ event, props: properties });
        },
      };
      setAnalyticsAdapter(adapter);
      trackEvent("simulation_month_run", { month: 3 });
      expect(tracked).toHaveLength(1);
      expect(tracked[0].event).toBe("simulation_month_run");
      expect(tracked[0].props).toEqual({ month: 3 });
      // Reset to no-op for other tests
      setAnalyticsAdapter({ track: () => {} });
    });
  });
});
