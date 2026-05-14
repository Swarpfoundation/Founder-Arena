import { logger } from "./logger";

export async function withTiming<T>(
  name: string,
  fn: () => Promise<T>,
  meta?: Record<string, unknown>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = Math.round(performance.now() - start);
    logger.info(`[timing] ${name} completed`, { name, durationMs: duration, status: "ok", ...meta });
    return result;
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    const error = err instanceof Error ? err.message : String(err);
    logger.error(`[timing] ${name} failed`, { name, durationMs: duration, status: "error", error, ...meta });
    throw err;
  }
}
