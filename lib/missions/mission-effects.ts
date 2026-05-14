/**
 * Founder Arena — Mission Effects Application
 *
 * Applies bounded mission completion/failure effects to simulation state.
 */

import { MissionEffect } from "./types";

function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(num, max));
}

export interface SimulationState {
  cash: number;
  monthlyBurn: number;
  revenue: number;
  valuation: number;
  productProgress: number;
  investorScore: number;
  marketScore: number;
  riskScore: number;
}

export function applyMissionEffects(
  state: SimulationState,
  effect: MissionEffect
): SimulationState {
  return {
    cash: state.cash + (effect.cashDelta ?? 0),
    monthlyBurn: state.monthlyBurn + (effect.burnDelta ?? 0),
    revenue: state.revenue + (effect.revenueDelta ?? 0),
    valuation: state.valuation + (effect.valuationDelta ?? 0),
    productProgress: clamp(state.productProgress + (effect.productProgressDelta ?? 0), 0, 100),
    investorScore: clamp(state.investorScore + (effect.investorScoreDelta ?? 0), 0, 100),
    marketScore: clamp(state.marketScore + (effect.marketScoreDelta ?? 0), 0, 100),
    riskScore: clamp(state.riskScore + (effect.riskScoreDelta ?? 0), 0, 100),
  };
}

export function combineMissionEffects(effects: MissionEffect[]): MissionEffect {
  const combined: MissionEffect = {};
  for (const e of effects) {
    combined.cashDelta = (combined.cashDelta ?? 0) + (e.cashDelta ?? 0);
    combined.burnDelta = (combined.burnDelta ?? 0) + (e.burnDelta ?? 0);
    combined.revenueDelta = (combined.revenueDelta ?? 0) + (e.revenueDelta ?? 0);
    combined.valuationDelta = (combined.valuationDelta ?? 0) + (e.valuationDelta ?? 0);
    combined.productProgressDelta = (combined.productProgressDelta ?? 0) + (e.productProgressDelta ?? 0);
    combined.investorScoreDelta = (combined.investorScoreDelta ?? 0) + (e.investorScoreDelta ?? 0);
    combined.marketScoreDelta = (combined.marketScoreDelta ?? 0) + (e.marketScoreDelta ?? 0);
    combined.riskScoreDelta = (combined.riskScoreDelta ?? 0) + (e.riskScoreDelta ?? 0);
    combined.userGrowthDelta = (combined.userGrowthDelta ?? 0) + (e.userGrowthDelta ?? 0);
  }
  return combined;
}

export function boundMissionEffect(effect: MissionEffect, bounds: {
  maxCashDelta?: number;
  maxBurnDelta?: number;
  maxRevenueDelta?: number;
  maxValuationDelta?: number;
  maxProductDelta?: number;
  maxScoreDelta?: number;
} = {}): MissionEffect {
  const b = {
    maxCashDelta: 50000,
    maxBurnDelta: 10000,
    maxRevenueDelta: 50000,
    maxValuationDelta: 2000000,
    maxProductDelta: 25,
    maxScoreDelta: 15,
    ...bounds,
  };

  return {
    cashDelta: effect.cashDelta ? clamp(effect.cashDelta, -b.maxCashDelta, b.maxCashDelta) : undefined,
    burnDelta: effect.burnDelta ? clamp(effect.burnDelta, -b.maxBurnDelta, b.maxBurnDelta) : undefined,
    revenueDelta: effect.revenueDelta ? clamp(effect.revenueDelta, -b.maxRevenueDelta, b.maxRevenueDelta) : undefined,
    valuationDelta: effect.valuationDelta ? clamp(effect.valuationDelta, -b.maxValuationDelta, b.maxValuationDelta) : undefined,
    productProgressDelta: effect.productProgressDelta ? clamp(effect.productProgressDelta, -b.maxProductDelta, b.maxProductDelta) : undefined,
    investorScoreDelta: effect.investorScoreDelta ? clamp(effect.investorScoreDelta, -b.maxScoreDelta, b.maxScoreDelta) : undefined,
    marketScoreDelta: effect.marketScoreDelta ? clamp(effect.marketScoreDelta, -b.maxScoreDelta, b.maxScoreDelta) : undefined,
    riskScoreDelta: effect.riskScoreDelta ? clamp(effect.riskScoreDelta, -b.maxScoreDelta, b.maxScoreDelta) : undefined,
    userGrowthDelta: effect.userGrowthDelta ? clamp(effect.userGrowthDelta, -10000, 10000) : undefined,
  };
}
