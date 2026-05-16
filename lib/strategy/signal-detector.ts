import type { StrategySignal, StrategySignalSource, FounderPlaystyle } from "./types";
import {
  DECISION_SIGNAL_MAP,
  ROLE_SIGNAL_MAP,
  SOCIAL_SIGNAL_MAP,
  COUNTER_SIGNAL_MAP,
  MISSION_SIGNAL_MAP,
  SignalMapping,
} from "./strategy-catalog";

// ─── ID generation ────────────────────────────────────────────────────────────

function makeSignalId(sourceId: string): string {
  // djb2-based deterministic hash of sourceId
  let h = 5381;
  for (let i = 0; i < sourceId.length; i++) {
    h = ((h << 5) + h) ^ sourceId.charCodeAt(i);
    h |= 0;
  }
  return `sig-${Math.abs(h).toString(36)}`;
}

function buildSignals(
  mappings: SignalMapping[],
  source: StrategySignalSource,
  actionKey: string,
  month: number,
  extraTags: string[]
): StrategySignal[] {
  return mappings.map((m) => {
    // sourceId includes playstyle so the same action at same month but
    // mapping to different playstyles gets distinct IDs and dedup keys.
    const sourceId = `${source}:${actionKey}:m${month}:${m.playstyle}`;
    return {
      id: makeSignalId(sourceId),
      source,
      sourceId,
      month,
      playstyle: m.playstyle,
      weight: m.weight,
      reason: m.reason,
      tags: [actionKey, ...extraTags],
    };
  });
}

// ─── Signal generators ────────────────────────────────────────────────────────

export function signalsFromDecisions(
  decisionIds: string[],
  month: number
): StrategySignal[] {
  const signals: StrategySignal[] = [];
  for (const id of decisionIds) {
    const mappings = DECISION_SIGNAL_MAP[id];
    if (mappings) {
      signals.push(...buildSignals(mappings, "monthly_decision", id, month, ["decision"]));
    }
  }
  return signals;
}

export function signalsFromHire(role: string, month: number): StrategySignal[] {
  const key = role;
  const mappings = ROLE_SIGNAL_MAP[key];
  if (!mappings) return [];
  return buildSignals(mappings, "hire", role.replace(/[\s/]/g, "_"), month, ["hire"]);
}

export function signalsFromSocialAction(
  actionId: string,
  month: number
): StrategySignal[] {
  const mappings = SOCIAL_SIGNAL_MAP[actionId];
  if (!mappings) return [];
  return buildSignals(mappings, "social_action", actionId, month, ["social"]);
}

export function signalsFromCounterAction(
  counterActionId: string,
  month: number
): StrategySignal[] {
  const mappings = COUNTER_SIGNAL_MAP[counterActionId];
  if (!mappings) return [];
  return buildSignals(mappings, "rival_counter_action", counterActionId, month, ["counter_action"]);
}

export function signalsFromMission(
  category: string,
  status: string,
  month: number
): StrategySignal[] {
  if (status !== "completed") return [];
  const key = category.toLowerCase();
  const mappings = MISSION_SIGNAL_MAP[key];
  if (!mappings) return [];
  return buildSignals(mappings, "mission", key, month, ["mission"]);
}

// ─── Dedup + append ───────────────────────────────────────────────────────────

/**
 * Appends new signals to an existing list, deduplicating by sourceId.
 * Caps the total at 500 entries (oldest first).
 */
export function appendSignals(
  existing: StrategySignal[],
  incoming: StrategySignal[]
): StrategySignal[] {
  const seenIds = new Set(existing.map((s) => s.sourceId));
  const deduped = incoming.filter((s) => !seenIds.has(s.sourceId));
  return [...existing, ...deduped].slice(-500);
}
