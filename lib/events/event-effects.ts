import { EventEffect } from "./types";

function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
}

/** Apply event effects to a base simulation delta. All effects are bounded. */
export function applyEventEffects(
  base: {
    totalCashCost: number;
    burnDelta: number;
    revenueDelta: number;
    productDelta: number;
    investorDelta: number;
    marketDelta: number;
    riskDelta: number;
    valuation: number;
    revenueMultiplier: number;
    burnMultiplier: number;
    valuationMultiplier: number;
  },
  effects: EventEffect
): {
  totalCashCost: number;
  eventCashDelta: number;
  burnDelta: number;
  revenueDelta: number;
  productDelta: number;
  investorDelta: number;
  marketDelta: number;
  riskDelta: number;
  valuation: number;
  revenueMultiplier: number;
  burnMultiplier: number;
  valuationMultiplier: number;
} {
  const result = {
    totalCashCost: base.totalCashCost,
    eventCashDelta: effects.cashDelta ?? 0,
    burnDelta: base.burnDelta + (effects.burnDelta ?? 0),
    revenueDelta: base.revenueDelta + (effects.revenueDelta ?? 0),
    productDelta: base.productDelta + (effects.productDelta ?? 0),
    investorDelta: base.investorDelta + (effects.investorDelta ?? 0),
    marketDelta: base.marketDelta + (effects.marketDelta ?? 0),
    riskDelta: base.riskDelta + (effects.riskDelta ?? 0),
    valuation: base.valuation,
    revenueMultiplier: base.revenueMultiplier * (effects.revenueMultiplier ?? 1),
    burnMultiplier: base.burnMultiplier * (effects.burnMultiplier ?? 1),
    valuationMultiplier: base.valuationMultiplier * (effects.valuationMultiplier ?? 1),
  };

  // Apply valuation multiplier effect to valuation directly
  if (effects.valuationMultiplier) {
    result.valuation = Math.round(result.valuation * effects.valuationMultiplier);
  }

  // Clamp multipliers to safe bounds
  result.revenueMultiplier = clamp(result.revenueMultiplier, 0.5, 1.5);
  result.burnMultiplier = clamp(result.burnMultiplier, 0.8, 1.3);
  result.valuationMultiplier = clamp(result.valuationMultiplier, 0.7, 1.3);

  return result;
}

/** Calculate a bounded crisis bonus for leaderboard scoring based on event severity */
export function calculateEventCrisisBonus(
  eventsResolved: Array<{ severity: string; choiceEffects: EventEffect }>
): number {
  let bonus = 0;
  for (const ev of eventsResolved) {
    if (ev.severity === "critical") bonus += 8;
    else if (ev.severity === "moderate") bonus += 4;
    else bonus += 1;
  }
  // Also reward players who took high-risk, high-reward choices
  for (const ev of eventsResolved) {
    const eff = ev.choiceEffects;
    const riskTaken = Math.abs(eff.cashDelta ?? 0) > 15000 || (eff.riskDelta ?? 0) > 3;
    if (riskTaken) bonus += 2;
  }
  return Math.min(bonus, 25); // Hard cap at 25 points
}

/** Calculate event difficulty score for a single month (0-100 scale) */
export function calculateEventDifficultyScore(eventSeverity: string): number {
  switch (eventSeverity) {
    case "critical":
      return 75;
    case "moderate":
      return 50;
    case "minor":
      return 25;
    default:
      return 30;
  }
}
