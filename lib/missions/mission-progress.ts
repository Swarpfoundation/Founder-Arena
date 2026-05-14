/**
 * Founder Arena — Mission Progress Engine
 *
 * Deterministic mission progress calculation.
 */

import { MissionInstance, MissionProgressInput, MissionProgressResult, MissionStatus, RequiredRole } from "./types";
import { calculateRoleCoverage } from "./role-requirements";

function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(num, max));
}

export function calculateMissionProgress(input: MissionProgressInput): MissionProgressResult {
  const { mission, employees, monthlyDecisions, marketTailwind, marketHeadwind, cash, runwayMonths, riskScore, teamProductivity, teamMorale } = input;

  // 1. Role coverage (0-1)
  const roleCoverage = calculateRoleCoverage((mission.requiredRoles as RequiredRole[]) ?? [], employees);
  const overallRoleCoverage = roleCoverage.length > 0
    ? roleCoverage.reduce((sum, r) => sum + r.coverage, 0) / roleCoverage.length
    : 1.0;

  // 2. Cash readiness (0-1)
  const cashReadiness = cash >= mission.estimatedCost ? 1.0 : clamp(cash / Math.max(mission.estimatedCost, 1), 0, 1);

  // 3. Team productivity & morale (0-1)
  const teamReadiness = clamp((teamProductivity * 0.6 + (teamMorale / 100) * 0.4), 0, 1.5);

  // 4. Market impact (-0.5 to +0.5)
  const marketImpact = (marketTailwind * 0.1) - (marketHeadwind * 0.15);

  // 5. Decision alignment (0-1)
  const decisionAlignment = calculateDecisionAlignment(mission.category, monthlyDecisions);

  // 6. Risk penalty (0-1)
  const riskPenalty = clamp(riskScore / 100, 0, 1);

  // 7. Runway penalty if very low
  const runwayPenalty = runwayMonths < 2 ? 0.3 : runwayMonths < 4 ? 0.7 : 1.0;

  // Weighted mission score (0-100 base)
  const rawScore =
    overallRoleCoverage * 40 +
    cashReadiness * 15 +
    teamReadiness * 15 +
    marketImpact * 10 +
    decisionAlignment * 10 +
    (1 - riskPenalty) * 10;

  const score = clamp(rawScore * runwayPenalty, 0, 100);

  // Progress delta per month (scaled by complexity)
  const meta = (mission.metadata as Record<string, unknown> | null) ?? {};
  const complexity = mission.complexity ?? (meta.complexity as number) ?? 5;
  const complexityFactor = 1 / Math.max(complexity, 1);
  const progressDelta = Math.round(score * complexityFactor * 0.8);
  const newProgress = clamp(mission.progress + progressDelta, 0, 100);

  // Determine status
  let status: MissionStatus | string = mission.status;
  if (newProgress >= 100) {
    status = score >= 80 ? "completed" : score >= 60 ? "completed" : "delayed";
  } else if (score < 30 && mission.progress > 20) {
    status = "failed";
  } else if (status === "pending" && score > 20) {
    status = "active";
  }

  const explanation = buildExplanation(score, overallRoleCoverage, cashReadiness, teamReadiness, decisionAlignment, riskPenalty, runwayPenalty);

  return {
    progressDelta,
    newProgress,
    status,
    roleCoverage,
    cashReadiness,
    teamReadiness,
    marketImpact,
    decisionAlignment,
    riskPenalty,
    runwayPenalty,
    score,
    explanation,
  };
}

function calculateDecisionAlignment(missionCategory: string, decisions: string[]): number {
  const alignmentMap: Record<string, string[]> = {
    product: ["product_focus", "launch_beta", "delay_launch", "customer_interviews"],
    engineering: ["hire_engineer", "product_focus", "improve_security"],
    ai_model: ["hire_engineer", "product_focus", "improve_security"],
    compliance: ["hire_compliance", "improve_security", "customer_interviews"],
    security: ["improve_security", "hire_engineer", "cut_costs"],
    sales: ["hire_sales", "enterprise_push", "marketing_spend"],
    marketing: ["marketing_spend", "launch_beta", "customer_interviews"],
    operations: ["cut_costs", "customer_interviews", "fundraising_prep"],
    fundraising: ["fundraising_prep", "customer_interviews", "improve_security"],
    growth: ["marketing_spend", "launch_beta", "enterprise_push"],
    partnership: ["enterprise_push", "customer_interviews", "fundraising_prep"],
    infrastructure: ["hire_engineer", "improve_security", "product_focus"],
    research: ["customer_interviews", "product_focus", "delay_launch"],
    launch: ["launch_beta", "marketing_spend", "customer_interviews"],
  };

  const aligned = alignmentMap[missionCategory] ?? [];
  if (aligned.length === 0) return 0.5;

  const matches = decisions.filter((d) => aligned.includes(d)).length;
  return clamp(matches / 2, 0, 1); // 2 aligned decisions = full alignment
}

function buildExplanation(
  score: number,
  roleCoverage: number,
  cashReadiness: number,
  teamReadiness: number,
  decisionAlignment: number,
  riskPenalty: number,
  runwayPenalty: number
): string {
  const parts: string[] = [];
  if (roleCoverage < 0.5) parts.push("Missing key roles.");
  if (cashReadiness < 0.5) parts.push("Insufficient cash for mission.");
  if (teamReadiness < 0.6) parts.push("Team productivity or morale low.");
  if (decisionAlignment < 0.5) parts.push("Monthly decisions not aligned with mission.");
  if (riskPenalty > 0.6) parts.push("High risk score hurting progress.");
  if (runwayPenalty < 0.8) parts.push("Low runway forcing slowdown.");

  if (parts.length === 0) {
    if (score >= 80) return "Excellent execution across all factors.";
    if (score >= 60) return "Solid progress. Minor gaps in role coverage or alignment.";
    return "Progressing steadily.";
  }

  return parts.join(" ");
}

export function getActiveMission(missions: MissionInstance[]): MissionInstance | null {
  const active = missions.find((m) => m.status === "active");
  if (active) return active;
  // If no active, return first pending
  const pending = missions.filter((m) => m.status === "pending");
  return pending.length > 0 ? pending[0] : null;
}

export function getCompletedMissions(missions: MissionInstance[]): MissionInstance[] {
  return missions.filter((m) => m.status === "completed");
}

export function getMissionCompletionRate(missions: MissionInstance[]): number {
  if (missions.length === 0) return 0;
  const completed = missions.filter((m) => m.status === "completed").length;
  return completed / missions.length;
}
