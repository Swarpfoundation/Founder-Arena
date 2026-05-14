/**
 * Rate limiter with in-memory store (default) and optional Upstash Redis adapter.
 * In-memory store includes periodic cleanup to prevent unbounded growth.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX_REQUESTS = 10;
const CLEANUP_INTERVAL_MS = 5 * 60_000; // 5 minutes

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimiter {
  check(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult>;
}

class InMemoryRateLimiter implements RateLimiter {
  async check(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(key, newEntry);
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        reset: newEntry.resetTime,
      };
    }

    if (entry.count >= maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: entry.resetTime,
      };
    }

    entry.count += 1;
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - entry.count,
      reset: entry.resetTime,
    };
  }
}

class UpstashRateLimiter implements RateLimiter {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  async check(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / windowMs)}`;

    try {
      const res = await fetch(`${this.url}/incr/${encodeURIComponent(windowKey)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (!res.ok) {
        // Fall back to in-memory if Upstash fails
        return new InMemoryRateLimiter().check(key, maxRequests, windowMs);
      }
      const data = (await res.json()) as { result?: number };
      const count = data.result ?? 1;
      const reset = (Math.floor(now / windowMs) + 1) * windowMs;
      return {
        success: count <= maxRequests,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - count),
        reset,
      };
    } catch {
      return new InMemoryRateLimiter().check(key, maxRequests, windowMs);
    }
  }
}

function startCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

function getLimiter(): RateLimiter {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    return new UpstashRateLimiter(upstashUrl, upstashToken);
  }
  startCleanup();
  return new InMemoryRateLimiter();
}

const limiter = getLimiter();

export async function rateLimit(
  key: string,
  maxRequests: number = DEFAULT_MAX_REQUESTS,
  windowMs: number = DEFAULT_WINDOW_MS
): Promise<RateLimitResult> {
  return limiter.check(key, maxRequests, windowMs);
}

export const RATE_LIMITS = {
  aiAnalysis: { maxRequests: 5, windowMs: 60_000 },
  vcReview: { maxRequests: 5, windowMs: 60_000 },
  monthlySimulation: { maxRequests: 10, windowMs: 60_000 },
  termNegotiation: { maxRequests: 10, windowMs: 60_000 },
  startupCreate: { maxRequests: 10, windowMs: 60_000 },
  teamAction: { maxRequests: 20, windowMs: 60_000 },
  read: { maxRequests: 100, windowMs: 60_000 },
} as const;

export async function checkRateLimit(
  userId: string,
  action: keyof typeof RATE_LIMITS
): Promise<string | null> {
  const config = RATE_LIMITS[action];
  const key = `${userId}:${action}`;
  const result = await rateLimit(key, config.maxRequests, config.windowMs);

  if (!result.success) {
    const seconds = Math.ceil((result.reset - Date.now()) / 1000);
    return `Rate limit exceeded. Please try again in ${seconds} second${seconds !== 1 ? "s" : ""}.`;
  }

  return null;
}
