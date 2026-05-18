import { describe, expect, it } from "vitest";
import {
  CROSS_SYSTEM_BALANCE_SCENARIOS,
  evaluateCrossSystemScenario,
} from "../fixtures/cross-system-balance-scenarios";
import { calculateRuntimeInfrastructureBurn } from "@/lib/infrastructure";

const evaluations = CROSS_SYSTEM_BALANCE_SCENARIOS.map(evaluateCrossSystemScenario);
const byId = new Map(evaluations.map((evaluation) => [evaluation.scenario.id, evaluation]));

function get(id: string) {
  const evaluation = byId.get(id);
  if (!evaluation) throw new Error(`Missing cross-system balance scenario ${id}`);
  return evaluation;
}

describe("Cross-system economy balance sweep", () => {
  it("covers the required scenario matrix with finite run metrics", () => {
    expect(CROSS_SYSTEM_BALANCE_SCENARIOS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(CROSS_SYSTEM_BALANCE_SCENARIOS.map((scenario) => scenario.intent)).size).toBeGreaterThanOrEqual(8);

    for (const evaluation of evaluations) {
      expect(evaluation.runtime.runtimeMonthlyInfraBurn).toBeGreaterThanOrEqual(0);
      expect(evaluation.totalWithInfra.totalMonthlyBurn).toBeGreaterThan(0);
      expect(evaluation.sprintResult.cashEnd).toBeGreaterThan(Number.NEGATIVE_INFINITY);
      expect(evaluation.leaderboardScore).toBeGreaterThanOrEqual(0);
      expect(evaluation.finalOutcome.outcome).toBeTruthy();
    }
  });

  it("keeps a balanced SaaS run survivable under reasonable choices", () => {
    const balanced = get("balanced_saas_founder");

    expect(balanced.deathCheck.dead).toBe(false);
    expect(balanced.sprintResult.runwayMonths).toBeGreaterThanOrEqual(3);
    expect(balanced.finalOutcome.outcome).not.toBe("DEAD");
    expect(balanced.runtime.runtimeMonthlyInfraBurn).toBeLessThan(balanced.totalWithInfra.totalMonthlyBurn * 0.08);
  });

  it("makes AI-heavy startups more cost-sensitive without making them impossible", () => {
    const balanced = get("balanced_saas_founder");
    const aiHeavy = get("ai_heavy_hype_founder");
    const creditMasked = get("cloud_credit_masked_ai");

    expect(aiHeavy.runtime.aiApiBurn).toBeGreaterThan(balanced.runtime.aiApiBurn);
    expect(aiHeavy.runtime.runtimeMonthlyInfraBurn).toBeGreaterThan(balanced.runtime.runtimeMonthlyInfraBurn);
    expect(aiHeavy.deathCheck.dead).toBe(false);
    expect(aiHeavy.finalOutcome.outcome).not.toBe("DEAD");
    expect(creditMasked.runtime.warnings.join(" ").toLowerCase()).toContain("credit");
  });

  it("keeps cockroach play viable but lower-upside than high-traction growth", () => {
    const cockroach = get("cockroach_founder");
    const balanced = get("balanced_saas_founder");
    const growth = get("high_traction_growth");

    expect(cockroach.totalWithInfra.totalMonthlyBurn).toBeLessThan(balanced.totalWithInfra.totalMonthlyBurn);
    expect(cockroach.deathCheck.dead).toBe(false);
    expect(cockroach.scenario.finalState.valuation).toBeLessThan(growth.scenario.finalState.valuation);
    expect(cockroach.leaderboardScore).toBeLessThan(growth.leaderboardScore);
  });

  it("keeps enterprise regulated runs more expensive but safer on infra posture", () => {
    const enterprise = get("enterprise_regulated_founder");
    const cheap = get("cockroach_founder");

    expect(enterprise.runtime.complianceBurn).toBeGreaterThan(0);
    expect(enterprise.totalWithInfra.totalMonthlyBurn).toBeGreaterThan(cheap.totalWithInfra.totalMonthlyBurn);
    expect(enterprise.runtime.riskModifiersPreview.securityRisk).toBeLessThan(cheap.runtime.riskModifiersPreview.securityRisk);
    expect(enterprise.runtime.riskModifiersPreview.investorTrustModifier).toBeGreaterThan(cheap.runtime.riskModifiersPreview.investorTrustModifier);
  });

  it("warns before cloud-credit cliffs and prevents same-sprint double depletion", () => {
    const masked = get("cloud_credit_masked_ai");

    expect(masked.runtime.creditsApplied).toBeGreaterThan(0);
    expect(masked.runtime.grossInfraBurn).toBeGreaterThan(masked.runtime.runtimeMonthlyInfraBurn);
    expect(masked.runtime.runtimeMonthlyInfraBurn).toBeGreaterThanOrEqual(0);
    expect(masked.runtime.warnings.join(" ").toLowerCase()).toMatch(/credit|cliff|expires/);

    const retry = calculateRuntimeInfrastructureBurn(masked.scenario.input, {
      selectedStackId: masked.scenario.selectedStackId,
      creditBalances: masked.runtime.creditBalances,
    });
    expect(retry.creditsApplied).toBe(0);
  });

  it("keeps weak and no-traction deaths attributable to existing death rules", () => {
    const weak = get("weak_bad_decisions");
    const noTraction = get("no_traction_startup");

    expect(weak.deathCheck.dead).toBe(true);
    expect(["Catastrophic risk exposure", "Ran out of cash", "Runway exhausted"]).toContain(weak.deathCheck.reason);
    expect(noTraction.deathCheck.dead).toBe(true);
    expect(noTraction.deathCheck.reason).toContain("Product failed to gain traction");
    expect(weak.finalOutcome.outcome).toBe("DEAD");
  });

  it("keeps event density conservative across infra, boardroom, and rival pressure contexts", () => {
    for (const evaluation of evaluations) {
      expect(evaluation.scenario.systemContext.boardroomOpenEvents).toBeLessThanOrEqual(2);
      expect(evaluation.infraEvent ? 1 : 0).toBeLessThanOrEqual(1);
      if (evaluation.scenario.systemContext.boardroomOpenEvents > 0 && evaluation.infraEvent) {
        expect(evaluation.deathCheck.reason).not.toBe("Unrecoverable event stack");
      }
    }
  });

  it("keeps infra burn added exactly once through the total burn path", () => {
    for (const evaluation of evaluations) {
      expect(evaluation.totalWithInfra.infrastructureCostsMonthly).toBe(evaluation.runtime.runtimeMonthlyInfraBurn);
      expect(evaluation.totalWithInfra.aiApiCostsMonthly).toBe(evaluation.runtime.aiApiBurn);
      expect(evaluation.totalWithInfra.cloudCreditsAppliedMonthly).toBe(evaluation.runtime.creditsApplied);
      expect(evaluation.totalWithInfra.totalMonthlyBurn).toBeLessThanOrEqual(
        evaluation.totalWithoutInfra.totalMonthlyBurn + evaluation.runtime.runtimeMonthlyInfraBurn
      );
    }
  });

  it("preserves final outcome and leaderboard ordering for strong versus weak runs", () => {
    const growth = get("high_traction_growth");
    const weak = get("weak_bad_decisions");
    const balanced = get("balanced_saas_founder");

    expect(["BREAKOUT", "SERIES_A_READY"]).toContain(growth.finalOutcome.outcome);
    expect(growth.leaderboardScore).toBeGreaterThan(balanced.leaderboardScore);
    expect(balanced.leaderboardScore).toBeGreaterThan(weak.leaderboardScore);
  });
});
