import { ReadinessResult, GrowthStateContext } from "./types";

function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
}

function scoreToStatus(score: number): ReadinessResult["status"] {
  if (score >= 75) return "strong";
  if (score >= 55) return "ready";
  if (score >= 35) return "borderline";
  return "not_ready";
}

function capitalEfficiency(revenue: number, burn: number): number {
  if (burn <= 0) return 2;
  return revenue / burn;
}

function hasSurvivedCriticalEvent(history: GrowthStateContext["simulationHistory"]): boolean {
  return history.some((m) => m.eventSeverity === "critical");
}

export function calculateSeriesAReadiness(ctx: GrowthStateContext): ReadinessResult {
  const reasons: string[] = [];
  const blockers: string[] = [];
  let score = 0;

  // Revenue quality
  const eff = capitalEfficiency(ctx.revenue, ctx.monthlyBurn);
  if (ctx.revenue >= 50_000) {
    score += 20;
    reasons.push("Strong monthly revenue ($50K+)");
  } else if (ctx.revenue >= 20_000) {
    score += 12;
    reasons.push("Solid monthly revenue ($20K+)");
  } else if (ctx.revenue >= 5_000) {
    score += 5;
    reasons.push("Early revenue traction ($5K+)");
  } else {
    blockers.push("Revenue too low for Series A");
  }

  // Product progress
  if (ctx.productProgress >= 80) {
    score += 15;
    reasons.push("Product near completion (80%+)");
  } else if (ctx.productProgress >= 50) {
    score += 8;
  } else {
    blockers.push("Product not mature enough");
  }

  // Valuation
  if (ctx.valuation >= 5_000_000) {
    score += 15;
    reasons.push("Valuation at or above $5M");
  } else if (ctx.valuation >= 2_000_000) {
    score += 8;
  } else {
    blockers.push("Valuation below typical Series A threshold");
  }

  // Investor score
  if (ctx.investorScore >= 70) {
    score += 15;
    reasons.push("Strong investor confidence (70+)");
  } else if (ctx.investorScore >= 50) {
    score += 8;
  } else {
    blockers.push("Investor confidence too low");
  }

  // Risk score
  if (ctx.riskScore <= 30) {
    score += 10;
    reasons.push("Low risk profile");
  } else if (ctx.riskScore <= 50) {
    score += 5;
  } else {
    blockers.push("Risk score too high for institutional round");
  }

  // Capital efficiency
  if (eff >= 1.5) {
    score += 10;
    reasons.push("Capital efficient (revenue/burn > 1.5x)");
  } else if (eff >= 1) {
    score += 5;
  } else {
    blockers.push("Burn exceeds revenue");
  }

  // Team quality
  if (ctx.teamSize >= 5) {
    score += 10;
    reasons.push("Strong team (5+ employees)");
  } else if (ctx.teamSize >= 3) {
    score += 5;
  }

  // Crisis survival bonus
  if (hasSurvivedCriticalEvent(ctx.simulationHistory)) {
    score += 5;
    reasons.push("Survived critical market event");
  }

  // Phase 24B: Mission completion modifier (bounded ±10)
  if (ctx.missionCompletionRate !== undefined) {
    const missionModifier = Math.round((ctx.missionCompletionRate - 0.5) * 20);
    score += clamp(missionModifier, -10, 10);
    if (ctx.missionCompletionRate >= 0.7) {
      reasons.push("Strong mission execution track record");
    } else if (ctx.missionCompletionRate <= 0.3 && (ctx.totalMissions ?? 0) >= 3) {
      blockers.push("Poor mission execution — investors will question operational discipline");
    }
  }

  score = clamp(score, 0, 100);

  return {
    score,
    status: scoreToStatus(score),
    reasons,
    blockers,
    recommendedNextMove:
      score >= 75
        ? "Strong Series A candidate. Prepare deck and reach out to VCs."
        : score >= 55
        ? "Ready for Series A. Polish metrics and start fundraising."
        : score >= 35
        ? "Borderline. Focus on revenue growth and product maturity first."
        : "Not ready. Build more traction before approaching Series A investors.",
  };
}

export function calculateSeriesBReadiness(ctx: GrowthStateContext): ReadinessResult {
  const reasons: string[] = [];
  const blockers: string[] = [];
  let score = 0;

  // Series B requires much stronger metrics
  if (ctx.revenue >= 200_000) {
    score += 25;
    reasons.push("Strong recurring revenue ($200K+/mo)");
  } else if (ctx.revenue >= 100_000) {
    score += 15;
    reasons.push("Solid revenue ($100K+/mo)");
  } else if (ctx.revenue >= 50_000) {
    score += 8;
  } else {
    blockers.push("Revenue too low for Series B");
  }

  if (ctx.valuation >= 20_000_000) {
    score += 20;
    reasons.push("Valuation at or above $20M");
  } else if (ctx.valuation >= 10_000_000) {
    score += 12;
  } else {
    blockers.push("Valuation below Series B threshold");
  }

  if (ctx.productProgress >= 95) {
    score += 15;
    reasons.push("Product essentially complete");
  } else if (ctx.productProgress >= 75) {
    score += 8;
  } else {
    blockers.push("Product not mature enough for Series B");
  }

  if (ctx.investorScore >= 80) {
    score += 15;
    reasons.push("Very strong investor confidence (80+)");
  } else if (ctx.investorScore >= 60) {
    score += 8;
  } else {
    blockers.push("Investor confidence insufficient");
  }

  const eff = capitalEfficiency(ctx.revenue, ctx.monthlyBurn);
  if (eff >= 2) {
    score += 15;
    reasons.push("Highly capital efficient (2x+)");
  } else if (eff >= 1.5) {
    score += 8;
  } else {
    blockers.push("Unit economics need improvement");
  }

  if (ctx.teamSize >= 10) {
    score += 10;
    reasons.push("Scale team (10+)");
  } else if (ctx.teamSize >= 7) {
    score += 5;
  }

  score = clamp(score, 0, 100);

  return {
    score,
    status: scoreToStatus(score),
    reasons,
    blockers,
    recommendedNextMove:
      score >= 75
        ? "Strong Series B candidate. Expand team and go-to-market."
        : score >= 55
        ? "Ready for Series B. Prepare expansion plan."
        : score >= 35
        ? "Borderline. Focus on revenue scale and team growth."
        : "Not ready. Build to $100K+ MRR before Series B.",
  };
}

export function calculateAcquisitionReadiness(ctx: GrowthStateContext): ReadinessResult {
  const reasons: string[] = [];
  const blockers: string[] = [];
  let score = 0;

  // Acquisition attractiveness is different from fundraising readiness
  if (ctx.productProgress >= 70) {
    score += 20;
    reasons.push("Strong product/IP asset (70%+)");
  } else if (ctx.productProgress >= 40) {
    score += 10;
  } else {
    blockers.push("Product too early for acquisition interest");
  }

  if (ctx.valuation >= 3_000_000) {
    score += 15;
    reasons.push("Meaningful valuation ($3M+)");
  } else if (ctx.valuation >= 1_000_000) {
    score += 8;
  }

  if (ctx.revenue >= 10_000) {
    score += 15;
    reasons.push("Proven revenue stream ($10K+/mo)");
  } else if (ctx.revenue >= 0) {
    score += 5;
  }

  if (ctx.teamSize >= 3) {
    score += 15;
    reasons.push("Talent team acquihire potential (3+)");
  } else if (ctx.teamSize >= 1) {
    score += 5;
  }

  if (ctx.riskScore <= 40) {
    score += 10;
    reasons.push("Clean risk profile");
  }

  if (ctx.investorScore >= 50) {
    score += 10;
    reasons.push("Investor validation");
  }

  if (hasSurvivedCriticalEvent(ctx.simulationHistory)) {
    score += 5;
    reasons.push("Resilient team (survived crisis)");
  }

  // Phase 24B: Mission completion modifier for acquisition readiness
  if (ctx.missionCompletionRate !== undefined) {
    const missionModifier = Math.round((ctx.missionCompletionRate - 0.5) * 20);
    score += clamp(missionModifier, -10, 10);
    if (ctx.missionCompletionRate >= 0.7) {
      reasons.push("Strong mission execution builds acquirer confidence");
    }
  }

  score = clamp(score, 0, 100);

  return {
    score,
    status: scoreToStatus(score),
    reasons,
    blockers,
    recommendedNextMove:
      score >= 75
        ? "Strong acquisition target. Expect inbound interest."
        : score >= 55
        ? "Viable acquisition target. Strategic interest likely."
        : score >= 35
        ? "Possible acquihire or small acquisition. Limited interest."
        : "Too early for acquisition. Focus on product and growth first.",
  };
}

export function calculateStrategicFit(
  ctx: GrowthStateContext,
  actorId: string,
  actorSectors: string[]
): ReadinessResult {
  const reasons: string[] = [];
  const blockers: string[] = [];
  let score = 0;

  // Sector alignment
  const sectorMatch = actorSectors.some((s) => ctx.sector.toLowerCase().includes(s.toLowerCase()));
  if (sectorMatch) {
    score += 25;
    reasons.push("Sector alignment strong");
  } else {
    blockers.push("Sector mismatch with strategic actor");
  }

  // Stage alignment
  const hasRevenue = ctx.revenue > 0;
  if (hasRevenue) {
    score += 15;
    reasons.push("Revenue-generating startup");
  }

  if (ctx.productProgress >= 50) {
    score += 15;
    reasons.push("Product far enough along for integration");
  } else {
    blockers.push("Product too early for strategic partnership");
  }

  if (ctx.valuation >= 1_000_000) {
    score += 15;
    reasons.push("Meaningful valuation ($1M+)");
  }

  if (ctx.investorScore >= 40) {
    score += 10;
    reasons.push("Some investor validation");
  }

  if (ctx.riskScore <= 60) {
    score += 10;
    reasons.push("Acceptable risk profile");
  } else {
    blockers.push("Risk profile too high for corporate partner");
  }

  score = clamp(score, 0, 100);

  return {
    score,
    status: scoreToStatus(score),
    reasons,
    blockers,
    recommendedNextMove:
      score >= 75
        ? "Excellent strategic fit. Prepare partnership proposal."
        : score >= 55
        ? "Good fit. Engage with actor's corporate development team."
        : score >= 35
        ? "Possible fit. Build more traction first."
        : "Poor fit. Focus on other growth paths.",
  };
}

export function calculateGrowthEligibility(ctx: GrowthStateContext) {
  return {
    seriesA: calculateSeriesAReadiness(ctx),
    seriesB: calculateSeriesBReadiness(ctx),
    acquisition: calculateAcquisitionReadiness(ctx),
    strategicFit: Object.fromEntries(
      STRATEGIC_ACTORS.map((actor) => [
        actor.id,
        calculateStrategicFit(ctx, actor.id, actor.sectorsOfInterest),
      ])
    ),
  };
}

import { STRATEGIC_ACTORS } from "./actor-library";
