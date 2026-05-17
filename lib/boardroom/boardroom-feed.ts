import type { BoardroomEvent, BoardroomEffect } from "./types";

export interface BoardroomFeedItem {
  id: string;
  month: number;
  category: "boardroom";
  title: string;
  body: string;
  severity: "positive" | "neutral" | "warning" | "critical";
  source: "boardroom";
}

const SEVERITY_BY_PRESSURE: Record<string, BoardroomFeedItem["severity"]> = {
  runway_crisis: "critical",
  investor_conflict: "critical",
  brand_risk: "warning",
  compliance_risk: "warning",
  revenue_miss: "warning",
  product_delay: "neutral",
  burn_rate: "warning",
  rival_pressure: "neutral",
  fundraising_pressure: "neutral",
  strategy_doubt: "neutral",
  acquisition_pressure: "positive",
  growth_expectation: "neutral",
};

export function buildBoardroomTriggerFeedItem(
  event: BoardroomEvent
): BoardroomFeedItem {
  return {
    id: `feed_${event.id}`,
    month: event.month,
    category: "boardroom",
    title: `BOARD ALERT: ${event.title}`,
    body: event.concern,
    severity: SEVERITY_BY_PRESSURE[event.pressureType] ?? "neutral",
    source: "boardroom",
  };
}

export function buildBoardroomResolutionFeedItem(
  event: BoardroomEvent,
  responseTitle: string,
  outcomeNarrative: string,
  effects: BoardroomEffect,
  month: number
): BoardroomFeedItem {
  const isPositive =
    (effects.investorScoreDelta ?? 0) > 0 ||
    (effects.boardConfidenceDelta ?? 0) > 5 ||
    (effects.revenueDelta ?? 0) > 0;

  const isNegative =
    (effects.riskScoreDelta ?? 0) > 5 ||
    (effects.investorScoreDelta ?? 0) < -5;

  const severity: BoardroomFeedItem["severity"] = isNegative
    ? "warning"
    : isPositive
    ? "positive"
    : "neutral";

  return {
    id: `feed_res_${event.id}_${month}`,
    month,
    category: "boardroom",
    title: `BOARD: ${event.title} — Resolved`,
    body: `${responseTitle}: ${outcomeNarrative}`,
    severity,
    source: "boardroom",
  };
}
