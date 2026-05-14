/**
 * Founder Arena — Next Move System
 *
 * AI-assisted but deterministic-safe next move options.
 */

import { NextMove, MissionInstance, MissionEffect, RequiredRole } from "./types";
import { calculateRoleCoverage } from "./role-requirements";

export interface NextMoveContext {
  startupId: string;
  startupName: string;
  sector: string;
  stage: string;
  cash: number;
  monthlyBurn: number;
  revenue: number;
  runwayMonths: number;
  productProgress: number;
  investorScore: number;
  marketScore: number;
  riskScore: number;
  employees: { role: string; seniority: string; skill: string }[];
  activeMission: MissionInstance | null;
  pendingMissions: MissionInstance[];
  monthlyDecisions: string[];
  marketCondition: string;
  classification: string;
}

export function generateNextMoves(ctx: NextMoveContext): NextMove[] {
  const moves: NextMove[] = [];

  // 1. Mission-required moves
  if (ctx.activeMission) {
    const coverage = calculateRoleCoverage((ctx.activeMission.requiredRoles as RequiredRole[]) ?? [], ctx.employees);
    const missingRoles = coverage.filter((c) => c.coverage < 1);

    for (const missing of missingRoles) {
      moves.push({
        id: `hire-${missing.role}`,
        title: `Hire ${missing.role}`,
        type: "hire",
        whyItMatters: `Required for active mission: ${ctx.activeMission.title}`,
        estimatedCost: 15000,
        expectedImpact: "Unlocks mission progress and improves role coverage.",
        relatedMissionId: ctx.activeMission.id,
        requiredRole: missing.role,
        urgency: "high",
        riskIfIgnored: "Mission delays, product progress stalls.",
        deterministicEffectPreview: { productProgressDelta: 5, riskScoreDelta: -1 },
      });
    }

    moves.push({
      id: `complete-mission-${ctx.activeMission.id}`,
      title: `Complete: ${ctx.activeMission.title}`,
      type: "complete_mission",
      whyItMatters: "Active mission is the highest priority objective.",
      estimatedCost: 0,
      expectedImpact: "Unlocks next mission and applies completion bonuses.",
      relatedMissionId: ctx.activeMission.id,
      urgency: "high",
      riskIfIgnored: "Roadmap falls behind, investor confidence drops.",
      deterministicEffectPreview: ((ctx.activeMission.metadata as Record<string, unknown> | null)?.effectsOnComplete as MissionEffect) ?? {},
    });
  }

  // 2. Cash/runway warnings
  if (ctx.runwayMonths < 3) {
    moves.push({
      id: "reduce-burn",
      title: "Reduce Burn Immediately",
      type: "reduce_burn",
      whyItMatters: `Runway is only ${ctx.runwayMonths} months. Critical.`,
      estimatedCost: 0,
      expectedImpact: "Extends runway by cutting non-essential spend.",
      urgency: "critical",
      riskIfIgnored: "Startup death within months.",
      deterministicEffectPreview: { burnDelta: -8000, productProgressDelta: -3, investorScoreDelta: -2 },
    });
  }

  if (ctx.runwayMonths < 6 && ctx.stage !== "series_a") {
    moves.push({
      id: "fundraising-prep",
      title: "Prepare for Fundraising",
      type: "fundraising_prep",
      whyItMatters: "Low runway requires capital injection.",
      estimatedCost: 5000,
      expectedImpact: "Improves investor readiness and deck quality.",
      urgency: "high",
      riskIfIgnored: "Run out of cash before next round.",
      deterministicEffectPreview: { investorScoreDelta: 8, cashDelta: -5000 },
    });
  }

  // 3. Sector-specific moves
  if (ctx.sector.toLowerCase().includes("ai")) {
    moves.push({
      id: "reduce-ai-costs",
      title: "Optimize AI Inference Costs",
      type: "reduce_ai_costs",
      whyItMatters: "AI inference is a major burn driver for AI startups.",
      estimatedCost: 10000,
      expectedImpact: "Reduces monthly burn by 15-30% without quality loss.",
      urgency: ctx.monthlyBurn > 50000 ? "high" : "medium",
      riskIfIgnored: "Burn grows faster than revenue.",
      deterministicEffectPreview: { burnDelta: -5000, productProgressDelta: 3 },
    });
  }

  if (ctx.sector.toLowerCase().includes("fintech") || ctx.sector.toLowerCase().includes("web3")) {
    moves.push({
      id: "complete-audit",
      title: "Complete Security Audit",
      type: "complete_audit",
      whyItMatters: "Regulated sectors require audit readiness.",
      estimatedCost: 25000,
      expectedImpact: "Reduces risk score and unlocks enterprise deals.",
      urgency: ctx.riskScore > 60 ? "high" : "medium",
      riskIfIgnored: "Regulatory penalty or enterprise deal blockage.",
      deterministicEffectPreview: { riskScoreDelta: -8, investorScoreDelta: 5, cashDelta: -25000 },
    });
  }

  // 4. Product stage moves
  if (ctx.productProgress < 40 && ctx.stage === "pre_seed") {
    moves.push({
      id: "product-focus",
      title: "Increase Product Focus",
      type: "product_focus",
      whyItMatters: "Product progress is too low for the current stage.",
      estimatedCost: 5000,
      expectedImpact: "Accelerates product development.",
      urgency: "high",
      riskIfIgnored: "Unable to launch beta or raise next round.",
      deterministicEffectPreview: { productProgressDelta: 12, burnDelta: 5000 },
    });
  }

  if (ctx.productProgress >= 40 && ctx.productProgress < 70) {
    moves.push({
      id: "launch-beta",
      title: "Launch Beta",
      type: "launch_beta",
      whyItMatters: "Product is ready for user feedback and validation.",
      estimatedCost: 10000,
      expectedImpact: "Generates early revenue and market validation.",
      urgency: "medium",
      riskIfIgnored: "Competitor gets to market first.",
      deterministicEffectPreview: { productProgressDelta: 8, revenueDelta: 3000, marketScoreDelta: 5 },
    });
  }

  // 5. Growth moves
  if (ctx.revenue > 0 && ctx.revenue < 20000) {
    moves.push({
      id: "focus-sales",
      title: "Focus on Sales",
      type: "focus_sales",
      whyItMatters: "Early revenue needs to grow to justify valuation.",
      estimatedCost: 12000,
      expectedImpact: "Revenue growth and pipeline development.",
      urgency: "medium",
      riskIfIgnored: "Stagnant revenue hurts fundraising.",
      deterministicEffectPreview: { revenueDelta: 10000, investorScoreDelta: 3 },
    });
  }

  // 6. Generic strategic moves
  moves.push({
    id: "customer-interviews",
    title: "Run Customer Interviews",
    type: "customer_interviews",
    whyItMatters: "Continuous customer insight reduces risk and improves product-market fit.",
    estimatedCost: 2000,
    expectedImpact: "Improves product direction and market score.",
    urgency: "low",
    riskIfIgnored: "Build something nobody wants.",
    deterministicEffectPreview: { productProgressDelta: 6, marketScoreDelta: 3, riskScoreDelta: -3 },
  });

  // Deduplicate by ID
  const seen = new Set<string>();
  const unique: NextMove[] = [];
  for (const m of moves) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      unique.push(m);
    }
  }

  // Sort by urgency
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  unique.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return unique.slice(0, 8);
}
