import { logger } from "./logger";

export type GameEvent =
  | "startup_created"
  | "startup_finalized"
  | "pitch_review_submitted"
  | "simulation_month_run"
  | "term_sheet_accepted"
  | "term_sheet_rejected"
  | "employee_hired"
  | "employee_fired"
  | "market_snapshot_generated"
  | "market_snapshot_activated"
  | "leaderboard_entry_created"
  | "achievement_unlocked"
  | "user_signed_in"
  | "user_signed_out";

export interface AnalyticsAdapter {
  track(event: GameEvent, properties?: Record<string, unknown>): void;
}

class NoOpAnalytics implements AnalyticsAdapter {
  track() {
    /* no-op */
  }
}

class LoggingAnalytics implements AnalyticsAdapter {
  track(event: GameEvent, properties?: Record<string, unknown>) {
    logger.info("[analytics] event", { event, ...properties });
  }
}

let adapter: AnalyticsAdapter = new NoOpAnalytics();

if (process.env.ANALYTICS_ENABLED === "true") {
  adapter = new LoggingAnalytics();
}

export function trackEvent(event: GameEvent, properties?: Record<string, unknown>) {
  adapter.track(event, properties);
}

export function setAnalyticsAdapter(a: AnalyticsAdapter) {
  adapter = a;
}
