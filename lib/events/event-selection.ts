import { SimulationEvent, EventStateContext, mulberry32, hashString } from "./types";
import { EVENT_LIBRARY } from "./event-library";

/** Maximum events per 12-month run */
export const MAX_EVENTS_PER_RUN = 3;

/** Maximum critical events per 12-month run */
export const MAX_CRITICAL_EVENTS_PER_RUN = 2;

/** Base chance that ANY event happens in a given month (deterministic) */
export const MONTHLY_EVENT_CHANCE = 0.35;

/** Filter events that are eligible for the given context */
export function getEligibleEvents(ctx: EventStateContext): SimulationEvent[] {
  return EVENT_LIBRARY.filter((ev) => {
    // Month restrictions
    if (ev.minMonth !== undefined && ctx.monthNumber < ev.minMonth) return false;
    if (ev.maxMonth !== undefined && ctx.monthNumber > ev.maxMonth) return false;
    if (ev.eligibleMonths && ev.eligibleMonths.length > 0 && !ev.eligibleMonths.includes(ctx.monthNumber)) return false;

    // Sector restrictions
    if (ev.eligibleSectors && ev.eligibleSectors.length > 0) {
      if (!ev.eligibleSectors.some((s) => ctx.sector.toLowerCase().includes(s.toLowerCase()))) {
        return false;
      }
    }

    // Once-per-run restriction
    if (ev.oncePerRun && ctx.eventsTriggered.includes(ev.id)) return false;

    // Global run limits
    const criticalCount = ctx.eventsTriggered.filter((id) => {
      const e = EVENT_LIBRARY.find((x) => x.id === id);
      return e?.severity === "critical";
    }).length;

    if (ev.severity === "critical" && criticalCount >= MAX_CRITICAL_EVENTS_PER_RUN) return false;

    const totalEventCount = ctx.eventsTriggered.length;
    if (totalEventCount >= MAX_EVENTS_PER_RUN) return false;

    return true;
  });
}

/** Filter choices that are available given the current state */
export function getAvailableChoices(event: SimulationEvent, ctx: EventStateContext): SimulationEvent["choices"] {
  return event.choices.filter((c) => {
    if (c.minCashRequired !== undefined && ctx.cash < c.minCashRequired) return false;
    if (c.minProductProgress !== undefined && ctx.productProgress < c.minProductProgress) return false;
    if (c.minEmployees !== undefined && ctx.employeeCount < c.minEmployees) return false;
    if (c.minMonth !== undefined && ctx.monthNumber < c.minMonth) return false;
    return true;
  });
}

/**
 * Deterministically select an event for a given month.
 * Returns null if no event should fire this month.
 */
export function selectMonthlyEvent(ctx: EventStateContext): SimulationEvent | null {
  const eligible = getEligibleEvents(ctx);
  if (eligible.length === 0) return null;

  // Seed from startupId + monthNumber for determinism
  const seed = hashString(`${ctx.startupId}:${ctx.monthNumber}`);
  const rng = mulberry32(seed);

  // First roll: does any event happen this month?
  const eventRoll = rng();
  if (eventRoll > MONTHLY_EVENT_CHANCE) return null;

  // Weighted selection from eligible events
  const totalWeight = eligible.reduce((sum, ev) => sum + ev.weight, 0);
  let selectionRoll = rng() * totalWeight;

  for (const ev of eligible) {
    selectionRoll -= ev.weight;
    if (selectionRoll <= 0) return ev;
  }

  // Fallback to last eligible
  return eligible[eligible.length - 1];
}

/**
 * Preview the effects of a choice without mutating state.
 * Returns human-readable effect summary.
 */
export function previewChoiceEffects(choice: SimulationEvent["choices"][number]): string {
  const parts: string[] = [];
  const eff = choice.effects;
  if (eff.cashDelta && eff.cashDelta !== 0) parts.push(`Cash ${eff.cashDelta > 0 ? "+" : ""}$${eff.cashDelta.toLocaleString()}`);
  if (eff.burnDelta && eff.burnDelta !== 0) parts.push(`Burn ${eff.burnDelta > 0 ? "+" : ""}$${eff.burnDelta.toLocaleString()}`);
  if (eff.revenueDelta && eff.revenueDelta !== 0) parts.push(`Revenue ${eff.revenueDelta > 0 ? "+" : ""}$${eff.revenueDelta.toLocaleString()}`);
  if (eff.productDelta && eff.productDelta !== 0) parts.push(`Product ${eff.productDelta > 0 ? "+" : ""}${eff.productDelta}`);
  if (eff.investorDelta && eff.investorDelta !== 0) parts.push(`Investor ${eff.investorDelta > 0 ? "+" : ""}${eff.investorDelta}`);
  if (eff.marketDelta && eff.marketDelta !== 0) parts.push(`Market ${eff.marketDelta > 0 ? "+" : ""}${eff.marketDelta}`);
  if (eff.riskDelta && eff.riskDelta !== 0) parts.push(`Risk ${eff.riskDelta > 0 ? "+" : ""}${eff.riskDelta}`);
  if (eff.valuationMultiplier && eff.valuationMultiplier !== 1) parts.push(`Valuation ×${eff.valuationMultiplier.toFixed(2)}`);
  if (eff.revenueMultiplier && eff.revenueMultiplier !== 1) parts.push(`Revenue ×${eff.revenueMultiplier.toFixed(2)}`);
  if (eff.burnMultiplier && eff.burnMultiplier !== 1) parts.push(`Burn ×${eff.burnMultiplier.toFixed(2)}`);

  return parts.join(" • ") || "No direct effect";
}

/**
 * Check if a player has taken a "clutch" high-risk decision during a critical event.
 * Used for the "Clutch Founder" achievement.
 */
export function isClutchChoice(eventSeverity: string, choiceEffects: SimulationEvent["choices"][number]["effects"]): boolean {
  if (eventSeverity !== "critical") return false;
  const eff = choiceEffects;
  const highRisk = (eff.riskDelta ?? 0) > 3 || Math.abs(eff.cashDelta ?? 0) > 20000 || (eff.burnDelta ?? 0) > 5000;
  const highReward = (eff.revenueDelta ?? 0) > 8000 || (eff.investorDelta ?? 0) > 4 || (eff.productDelta ?? 0) > 8;
  return highRisk && highReward;
}

/**
 * Get the effective monthly event chance, adjusted by current state.
 * Higher risk score and lower runway increase event likelihood slightly.
 */
export function getAdjustedEventChance(ctx: EventStateContext): number {
  let chance = MONTHLY_EVENT_CHANCE;

  // Higher risk = more events
  chance += (ctx.riskScore / 100) * 0.1;

  // Low runway = more events (crisis mode)
  const runway = ctx.monthlyBurn > 0 ? ctx.cash / ctx.monthlyBurn : 999;
  if (runway < 3) chance += 0.1;
  else if (runway < 6) chance += 0.05;

  // High product progress = fewer operational disruptions
  if (ctx.productProgress > 70) chance -= 0.03;

  return clamp(chance, 0.15, 0.6);
}

function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
}
