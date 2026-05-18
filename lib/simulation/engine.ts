import { SimulationMonth, MarketSnapshot, Employee } from "@prisma/client";
import { DecisionOption } from "./decisions";
import { applyTeamEffectsToSimulation, getOfficeSetup } from "@/lib/team/effects";
import { deriveStartupMarketExposure } from "@/lib/market/exposure";
import { calculateMarketImpactForStartup } from "@/lib/market/impact-engine";
import { getScenarioByKeyOrFallback } from "@/lib/market/snapshot-service";
import { EventEffect } from "@/lib/events/types";
import { applyEventEffects } from "@/lib/events/event-effects";
import { getTotalOperatingCosts } from "@/lib/economy/operating-costs";


export interface StartupState {
  cash: number;
  monthlyBurn: number;
  revenue: number;
  valuation: number;
  productProgress: number;
  investorScore: number;
  marketScore: number;
  riskScore: number;
}

export interface MonthlyResult {
  cashStart: number;
  cashEnd: number;
  burnRate: number;
  revenue: number;
  runwayMonths: number;
  productProgressBefore: number;
  productProgressAfter: number;
  valuation: number;
  investorScoreBefore: number;
  investorScoreAfter: number;
  marketScoreBefore: number;
  marketScoreAfter: number;
  riskScoreBefore: number;
  riskScoreAfter: number;
  userGrowth: number;
  marketingSpend: number;
  productSpend: number;
  hiringSpend: number;
  marketCondition: string;
  eventTitle?: string;
  eventSummary?: string;
  status: string;
  difficultyScore?: number;
  marketImpactExplanation?: string;
  eventEffects?: EventEffect;
  costBreakdown?: {
    baseBurn: number;
    operatingCosts: number;
    missionCosts: number;
    infrastructureCosts?: number;
    grossInfrastructureCosts?: number;
    aiApiCosts?: number;
    complianceCosts?: number;
    cloudCreditsApplied?: number;
    decisionBurn: number;
    marketMultiplier: number;
    total: number;
  };
}

function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
}

export function getCurrentSimulationMonth(history: SimulationMonth[]): number {
  if (history.length === 0) return 0;
  return Math.max(...history.map((h) => h.monthNumber));
}

export function calculateRunway(cash: number, monthlyBurn: number): number {
  if (monthlyBurn <= 0) return 999;
  return Math.floor(cash / monthlyBurn);
}

export function applyMarketImpact(
  state: StartupState,
  snapshot: MarketSnapshot | null,
  sector: string
): { revenueMultiplier: number; valuationMultiplier: number; burnMultiplier: number; investorDelta: number; riskDelta: number; eventTitle?: string; eventSummary?: string } {
  if (!snapshot) {
    return { revenueMultiplier: 1, valuationMultiplier: 1, burnMultiplier: 1, investorDelta: 0, riskDelta: 0 };
  }

  const condition = snapshot.condition;
  let revenueMultiplier = condition === "bullish" ? 1.08 : condition === "bearish" ? 0.92 : 1.0;
  let valuationMultiplier = condition === "bullish" ? 1.05 : condition === "bearish" ? 0.95 : 1.0;
  const burnMultiplier = condition === "bullish" ? 1.02 : condition === "bearish" ? 0.98 : 1.0;
  let investorDelta = condition === "bullish" ? 2 : condition === "bearish" ? -3 : 0;
  let riskDelta = condition === "bearish" ? 3 : 0;

  // Sector-specific trends from snapshot
  const trends = snapshot.sectorTrends as Record<string, number> | null;
  if (trends) {
    const sectorKey = Object.keys(trends).find((k) => sector.toLowerCase().includes(k.toLowerCase()));
    if (sectorKey) {
      const trend = trends[sectorKey];
      revenueMultiplier *= trend;
      valuationMultiplier *= trend;
    }
  }

  // Market events
  const events = (snapshot as unknown as { events?: Array<{ name: string; description: string; globalImpact: number; type: string }> }).events ?? [];
  let eventTitle: string | undefined;
  let eventSummary: string | undefined;

  if (events.length > 0) {
    const event = events[0];
    eventTitle = event.name;
    eventSummary = event.description;
    revenueMultiplier += Number(event.globalImpact);
    valuationMultiplier += Number(event.globalImpact) * 0.5;
    investorDelta += event.type === "positive" ? 2 : event.type === "negative" ? -3 : 0;
    riskDelta += event.type === "negative" ? 4 : event.type === "positive" ? -2 : 0;
  }

  return {
    revenueMultiplier: clamp(revenueMultiplier, 0.5, 1.5),
    valuationMultiplier: clamp(valuationMultiplier, 0.5, 1.5),
    burnMultiplier: clamp(burnMultiplier, 0.9, 1.1),
    investorDelta: clamp(investorDelta, -10, 10),
    riskDelta: clamp(riskDelta, -5, 10),
    eventTitle,
    eventSummary,
  };
}

export interface StartupProfile {
  sector: string;
  region: string;
  monetizationModel: string;
  problem: string;
  solution: string;
}

export function simulateMonth(
  state: StartupState,
  decisions: DecisionOption[],
  snapshot: MarketSnapshot | null,
  sector: string,
  employees: Employee[] = [],
  workSetup: string = "remote",
  startupProfile?: StartupProfile,
  currentMonth: number = 1,
  eventEffect?: EventEffect,
  stage: string = "seed",
  missionCostDelta: number = 0,
  infrastructureCostDelta: number = 0,
  infrastructureCostBreakdown?: {
    grossInfrastructureCosts: number;
    aiApiCosts: number;
    complianceCosts: number;
    cloudCreditsApplied: number;
  }
): MonthlyResult {
  const cashStart = state.cash;
  const productProgressBefore = state.productProgress;
  const investorScoreBefore = state.investorScore;
  const marketScoreBefore = state.marketScore;
  const riskScoreBefore = state.riskScore;

  // Apply decisions
  let totalCashCost = 0;
  let totalBurnDelta = 0;
  let totalProductDelta = 0;
  let totalRevenueDelta = 0;
  let totalInvestorDelta = 0;
  let totalMarketDelta = 0;
  let totalRiskDelta = 0;

  for (const d of decisions) {
    totalCashCost += d.cashCost;
    totalBurnDelta += d.burnDelta;
    totalProductDelta += d.productDelta;
    totalRevenueDelta += d.revenueDelta;
    totalInvestorDelta += d.investorDelta;
    totalMarketDelta += d.marketDelta;
    totalRiskDelta += d.riskDelta;
  }

  // Apply team effects (modifiers only — burn is already in state.monthlyBurn)
  const officeSetup = getOfficeSetup(workSetup);
  const runway = calculateRunway(state.cash, state.monthlyBurn);
  const teamEffects = applyTeamEffectsToSimulation(employees, officeSetup, state.cash, runway);

  // Phase 25: Do NOT add teamEffects.burnDelta — state.monthlyBurn already includes payroll+office
  totalProductDelta += teamEffects.productDelta;
  totalRevenueDelta += teamEffects.revenueDelta;
  totalRiskDelta += teamEffects.riskDelta;
  totalInvestorDelta += teamEffects.investorDelta;

  // Market impact
  let marketImpactResult: {
    revenueMultiplier: number;
    valuationMultiplier: number;
    burnMultiplier: number;
    investorDelta: number;
    riskDelta: number;
    eventTitle?: string;
    eventSummary?: string;
    marketScoreDelta?: number;
    difficultyScore?: number;
    explanation?: string;
  };

  if (startupProfile && snapshot?.scenarioKey) {
    // Phase 6: Use new market intelligence engine
    const exposure = deriveStartupMarketExposure(startupProfile);
    const scenario = getScenarioByKeyOrFallback(snapshot.scenarioKey);
    const impact = calculateMarketImpactForStartup(
      startupProfile.sector,
      startupProfile.region,
      exposure,
      scenario,
      currentMonth
    );
    marketImpactResult = {
      revenueMultiplier: 1 + impact.revenueDelta / 100,
      valuationMultiplier: 1 + impact.valuationDelta / 100,
      burnMultiplier: 1 + impact.burnDelta / 100,
      investorDelta: impact.investorDelta,
      riskDelta: impact.riskDelta,
      eventTitle: impact.eventTitle,
      eventSummary: impact.eventSummary,
      marketScoreDelta: impact.marketScoreDelta,
      difficultyScore: impact.difficultyScore,
      explanation: impact.explanation,
    };
    totalMarketDelta += impact.marketScoreDelta ?? 0;
  } else {
    // Phase 3 fallback
    const fallback = applyMarketImpact(state, snapshot, sector);
    marketImpactResult = fallback;
  }

  // Apply event effects if present
  let eventDeltas = {
    totalCashCost,
    eventCashDelta: 0,
    burnDelta: totalBurnDelta,
    revenueDelta: totalRevenueDelta,
    productDelta: totalProductDelta,
    investorDelta: totalInvestorDelta,
    marketDelta: totalMarketDelta,
    riskDelta: totalRiskDelta,
    valuation: state.valuation,
    revenueMultiplier: marketImpactResult.revenueMultiplier,
    burnMultiplier: marketImpactResult.burnMultiplier,
    valuationMultiplier: marketImpactResult.valuationMultiplier,
  };

  if (eventEffect) {
    eventDeltas = applyEventEffects(eventDeltas, eventEffect);
  }

  // Phase 25: Calculate operating costs and add mission costs
  const operatingCosts = getTotalOperatingCosts(
    sector,
    stage,
    employees.length,
    state.revenue,
    undefined,
    { excludeInfrastructureLikeCosts: infrastructureCostDelta > 0 }
  );
  const baseBurn = state.monthlyBurn + operatingCosts + missionCostDelta + infrastructureCostDelta;

  // Calculate new values
  const newRevenue = Math.round((state.revenue + eventDeltas.revenueDelta) * eventDeltas.revenueMultiplier);
  const newBurn = Math.round((baseBurn + eventDeltas.burnDelta) * eventDeltas.burnMultiplier);
  const burnRate = Math.max(0, newBurn);
  const cashEnd = cashStart - eventDeltas.totalCashCost + eventDeltas.eventCashDelta - burnRate + newRevenue;

  const productProgressAfter = clamp(productProgressBefore + eventDeltas.productDelta, 0, 100);
  const valuation = Math.round(eventDeltas.valuation * eventDeltas.valuationMultiplier + eventDeltas.investorDelta * 1000);

  const investorScoreAfter = clamp(investorScoreBefore + eventDeltas.investorDelta + marketImpactResult.investorDelta, 0, 100);
  const marketScoreAfter = clamp(marketScoreBefore + eventDeltas.marketDelta, 0, 100);
  const riskScoreAfter = clamp(riskScoreBefore + eventDeltas.riskDelta + marketImpactResult.riskDelta, 0, 100);

  const runwayMonths = calculateRunway(cashEnd, burnRate);

  return {
    cashStart,
    cashEnd,
    burnRate,
    revenue: newRevenue,
    runwayMonths,
    productProgressBefore,
    productProgressAfter,
    valuation,
    investorScoreBefore,
    investorScoreAfter,
    marketScoreBefore,
    marketScoreAfter,
    riskScoreBefore,
    riskScoreAfter,
    userGrowth: totalRevenueDelta > 0 ? Math.round(totalRevenueDelta / 10) : 0,
    marketingSpend: decisions.filter((d) => d.id === "marketing_spend").length > 0 ? 18000 : 0,
    productSpend: decisions.filter((d) => ["product_focus", "hire_engineer"].includes(d.id)).length > 0 ? 10000 : 0,
    hiringSpend: teamEffects.monthlyPayroll + teamEffects.officeCost,
    marketCondition: snapshot?.condition ?? "neutral",
    eventTitle: marketImpactResult.eventTitle,
    eventSummary: marketImpactResult.eventSummary,
    status: "active",
    eventEffects: eventEffect ?? undefined,
    costBreakdown: {
      baseBurn: state.monthlyBurn,
      operatingCosts,
      missionCosts: missionCostDelta,
      infrastructureCosts: infrastructureCostDelta,
      grossInfrastructureCosts: infrastructureCostBreakdown?.grossInfrastructureCosts ?? infrastructureCostDelta,
      aiApiCosts: infrastructureCostBreakdown?.aiApiCosts ?? 0,
      complianceCosts: infrastructureCostBreakdown?.complianceCosts ?? 0,
      cloudCreditsApplied: infrastructureCostBreakdown?.cloudCreditsApplied ?? 0,
      decisionBurn: eventDeltas.burnDelta,
      marketMultiplier: eventDeltas.burnMultiplier,
      total: newBurn,
    },
  };
}

export function checkDeathCondition(
  result: MonthlyResult,
  monthNumber: number
): { dead: boolean; reason?: string } {
  if (result.cashEnd <= 0 && result.revenue < result.burnRate) {
    return { dead: true, reason: "Ran out of cash" };
  }
  if (result.runwayMonths <= 0) {
    return { dead: true, reason: "Runway exhausted" };
  }
  if (result.riskScoreAfter >= 95) {
    return { dead: true, reason: "Catastrophic risk exposure" };
  }
  if (result.investorScoreAfter <= 10 && result.cashEnd < result.burnRate * 2) {
    return { dead: true, reason: "Investors lost confidence with no runway" };
  }
  if (monthNumber >= 9 && result.productProgressAfter < 20 && result.revenue < 5000) {
    return { dead: true, reason: "Product failed to gain traction" };
  }
  return { dead: false };
}

export function classifyFinalOutcome(
  state: StartupState,
  monthsSurvived: number,
  _history: SimulationMonth[]
): { outcome: string; reason: string; founderScore: number } {
  const isDead = monthsSurvived < 12;

  if (isDead) {
    return {
      outcome: "DEAD",
      reason: `Startup died after ${monthsSurvived} Founder Weeks.`,
      founderScore: Math.round(state.valuation / 100000 + monthsSurvived * 10),
    };
  }

  // Revenue quality
  const finalRevenue = state.revenue;
  const capitalEfficiency = state.revenue / Math.max(state.monthlyBurn, 1);

  let outcome: string;
  let reason: string;

  if (state.cash <= 0) {
    outcome = "ZOMBIE";
    reason = "Survived 12 Founder Weeks but ran out of cash.";
  } else if (finalRevenue > 100000 && capitalEfficiency > 2) {
    outcome = "BREAKOUT";
    reason = "Strong revenue growth with healthy unit economics.";
  } else if (finalRevenue > 50000 && state.valuation > 5000000) {
    outcome = "SERIES_A_READY";
    reason = "Solid metrics ready for Series A fundraising.";
  } else if (finalRevenue > 20000 && state.productProgress >= 70) {
    outcome = "SEED_READY";
    reason = "Good product-market fit with early revenue.";
  } else if (finalRevenue > 0 && state.cash > 0) {
    outcome = "SMALL_PROFITABLE";
    reason = "Small but profitable business.";
  } else if (state.valuation > 3000000) {
    outcome = "ACQUISITION_TARGET";
    reason = "Valuable technology but limited standalone revenue.";
  } else {
    outcome = "ZOMBIE";
    reason = "Survived but with weak metrics.";
  }

  const founderScore = Math.round(
    state.valuation / 50000 +
    finalRevenue / 1000 +
    monthsSurvived * 20 +
    capitalEfficiency * 50 +
    (100 - state.riskScore) * 5
  );

  return { outcome, reason, founderScore };
}

export function calculateLeaderboardScore(
  state: StartupState,
  monthsSurvived: number,
  outcome: string
): number {
  const base = state.valuation / 10000 + state.revenue / 1000 + monthsSurvived * 50;
  const outcomeMultiplier =
    outcome === "BREAKOUT" ? 3.0 :
    outcome === "SERIES_A_READY" ? 2.5 :
    outcome === "ACQUISITION_TARGET" ? 2.0 :
    outcome === "SEED_READY" ? 1.8 :
    outcome === "SMALL_PROFITABLE" ? 1.5 :
    outcome === "ZOMBIE" ? 0.5 :
    0;
  return Math.round(base * outcomeMultiplier);
}
