import type { StrategyState, StrategyEffect, ComputeStrategyContext } from "./types";

/**
 * Compute the aggregate simulation effect of all active synergies.
 *
 * Balance targets (per month, all synergies combined):
 *   - revenue: max ±$3K
 *   - productProgress: max ±5
 *   - investorScore: max ±3
 *   - riskScore: max ±4
 *   - userGrowth: max ±200
 *   - valuation: max ±$20K
 *   - burn: max ±$3K reduction
 *   - social: max ±6 hype/trust, ±8 brandRisk
 */
export function computeStrategyEffects(
  state: StrategyState,
  ctx: ComputeStrategyContext
): StrategyEffect {
  const effect: Required<StrategyEffect> = {
    productProgressDelta: 0,
    revenueDelta: 0,
    userGrowthDelta: 0,
    investorScoreDelta: 0,
    riskScoreDelta: 0,
    valuationDelta: 0,
    burnDelta: 0,
    socialHypeDelta: 0,
    socialTrustDelta: 0,
    brandRiskDelta: 0,
  };

  for (const synergy of state.activeSynergies) {
    const e = synergy.effects;
    effect.productProgressDelta += e.productProgressDelta ?? 0;
    effect.revenueDelta         += e.revenueDelta ?? 0;
    effect.userGrowthDelta      += e.userGrowthDelta ?? 0;
    effect.investorScoreDelta   += e.investorScoreDelta ?? 0;
    effect.riskScoreDelta       += e.riskScoreDelta ?? 0;
    effect.valuationDelta       += e.valuationDelta ?? 0;
    effect.burnDelta            += e.burnDelta ?? 0;
    effect.socialHypeDelta      += e.socialHypeDelta ?? 0;
    effect.socialTrustDelta     += e.socialTrustDelta ?? 0;
    effect.brandRiskDelta       += e.brandRiskDelta ?? 0;
  }

  // Apply trade-off penalties from conflicting stacks
  effect.brandRiskDelta += computeConflictPenalty(state, ctx);

  // Hard caps to prevent strategy from being overpowered
  effect.productProgressDelta = clamp(effect.productProgressDelta, -5, 5);
  effect.revenueDelta         = clamp(effect.revenueDelta, -3000, 3000);
  effect.userGrowthDelta      = clamp(effect.userGrowthDelta, -200, 200);
  effect.investorScoreDelta   = clamp(effect.investorScoreDelta, -3, 3);
  effect.riskScoreDelta       = clamp(effect.riskScoreDelta, -4, 4);
  effect.valuationDelta       = clamp(effect.valuationDelta, -20000, 20000);
  effect.burnDelta            = clamp(effect.burnDelta, -3000, 1500);
  effect.socialHypeDelta      = clamp(effect.socialHypeDelta, -6, 6);
  effect.socialTrustDelta     = clamp(effect.socialTrustDelta, -5, 5);
  effect.brandRiskDelta       = clamp(effect.brandRiskDelta, -8, 8);

  return stripZeros(effect);
}

function computeConflictPenalty(
  state: StrategyState,
  ctx: ComputeStrategyContext
): number {
  let penalty = 0;
  const getProgress = (p: string) =>
    state.stacks.find((s) => s.playstyle === p)?.progress ?? 0;

  const hypeProg    = getProgress("hype_machine");
  const cockProg    = getProgress("cockroach");
  const capitalProg = getProgress("capital_blitzscaler");

  // Hype Machine active but product is weak → brand risk
  if (hypeProg >= 50 && ctx.productProgress < 40) {
    penalty += 3;
  }

  // Rival Killer + low trust → brand risk
  const rivalProg = getProgress("rival_killer");
  if (rivalProg >= 50 && ctx.socialTrust < 35) {
    penalty += 2;
  }

  // Cockroach + Capital Blitzscaler conflict → neither benefit applies fully
  if (cockProg >= 25 && capitalProg >= 25) {
    penalty += 1;
  }

  return penalty;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function stripZeros(e: Required<StrategyEffect>): StrategyEffect {
  const result: StrategyEffect = {};
  for (const [k, v] of Object.entries(e)) {
    if (v !== 0) (result as Record<string, number>)[k] = v;
  }
  return result;
}
