const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "authorization",
  "cookie",
  "x-cron-secret",
  "pitchDeckUrl",
  "pitch",
  "problem",
  "solution",
  "accessToken",
  "refreshToken",
  "idToken",
]);

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return Array.from(SENSITIVE_KEYS).some((sk) => lower.includes(sk.toLowerCase()));
}

export function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (value.length === 0) return value;
    if (value.length <= 8) return "***";
    return value.slice(0, 3) + "***" + value.slice(-3);
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(redactValue);
  if (typeof value === "object") return redactObject(value as Record<string, unknown>);
  return value;
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      out[key] = typeof val === "string" && val.length > 0 ? "[REDACTED]" : val;
    } else if (Array.isArray(val)) {
      out[key] = val.map(redactValue);
    } else if (typeof val === "object" && val !== null) {
      out[key] = redactObject(val as Record<string, unknown>);
    } else {
      out[key] = val;
    }
  }
  return out;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const redactedMeta = meta ? redactObject(meta) : undefined;

  if (process.env.NODE_ENV === "production") {
    const entry: Record<string, unknown> = {
      level,
      message,
      timestamp,
    };
    if (redactedMeta) entry.meta = redactedMeta;
    console.log(JSON.stringify(entry));
  } else {
    const prefix = `[${timestamp}] ${level.toUpperCase()}`;
    if (redactedMeta) {
      console.log(prefix, message, redactedMeta);
    } else {
      console.log(prefix, message);
    }
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};
