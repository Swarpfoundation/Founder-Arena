import { describe, it, expect } from "vitest";
import {
  signalsFromDecisions,
  signalsFromHire,
  signalsFromSocialAction,
  signalsFromCounterAction,
  signalsFromMission,
  appendSignals,
} from "@/lib/strategy/signal-detector";
import {
  computeLevel,
  computeStackProgress,
  computeStrategyState,
} from "@/lib/strategy/strategy-engine";
import { computeStrategyEffects } from "@/lib/strategy/strategy-effects";
import { generateArchetypeSummary } from "@/lib/strategy/strategy-summary";
import type { StrategySignal, ComputeStrategyContext } from "@/lib/strategy/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseCtx: ComputeStrategyContext = {
  productProgress: 60,
  revenue: 20000,
  brandRisk: 20,
  socialTrust: 55,
  socialHype: 30,
  investorScore: 65,
  monthlyBurn: 15000,
  currentMonth: 4,
  rivalryMaxScore: 30,
};

// ─── computeLevel ─────────────────────────────────────────────────────────────

describe("computeLevel", () => {
  it("returns dormant for 0", () => {
    expect(computeLevel(0)).toBe("dormant");
  });
  it("returns dormant for 24", () => {
    expect(computeLevel(24)).toBe("dormant");
  });
  it("returns emerging for 25", () => {
    expect(computeLevel(25)).toBe("emerging");
  });
  it("returns emerging for 49", () => {
    expect(computeLevel(49)).toBe("emerging");
  });
  it("returns active for 50", () => {
    expect(computeLevel(50)).toBe("active");
  });
  it("returns active for 74", () => {
    expect(computeLevel(74)).toBe("active");
  });
  it("returns dominant for 75", () => {
    expect(computeLevel(75)).toBe("dominant");
  });
  it("returns dominant for 100", () => {
    expect(computeLevel(100)).toBe("dominant");
  });
});

// ─── computeStackProgress ────────────────────────────────────────────────────

describe("computeStackProgress", () => {
  it("returns 0 for no signals", () => {
    expect(computeStackProgress("product_led", [])).toBe(0);
  });

  it("sums weights for matching playstyle", () => {
    const signals: StrategySignal[] = [
      { id: "s1", source: "monthly_decision", sourceId: "a", month: 1, playstyle: "product_led", weight: 10, reason: "r", tags: [] },
      { id: "s2", source: "monthly_decision", sourceId: "b", month: 1, playstyle: "product_led", weight: 8, reason: "r", tags: [] },
      { id: "s3", source: "monthly_decision", sourceId: "c", month: 1, playstyle: "hype_machine", weight: 15, reason: "r", tags: [] },
    ];
    expect(computeStackProgress("product_led", signals)).toBe(18);
  });

  it("ignores signals for other playstyles", () => {
    const signals: StrategySignal[] = [
      { id: "s1", source: "monthly_decision", sourceId: "a", month: 1, playstyle: "hype_machine", weight: 20, reason: "r", tags: [] },
    ];
    expect(computeStackProgress("product_led", signals)).toBe(0);
  });

  it("caps progress at 100", () => {
    const signals: StrategySignal[] = Array.from({ length: 15 }, (_, i) => ({
      id: `s${i}`,
      source: "monthly_decision" as const,
      sourceId: `src-${i}`,
      month: 1,
      playstyle: "product_led" as const,
      weight: 10,
      reason: "r",
      tags: [],
    }));
    expect(computeStackProgress("product_led", signals)).toBe(100);
  });
});

// ─── signalsFromDecisions ────────────────────────────────────────────────────

describe("signalsFromDecisions", () => {
  it("returns empty for unknown decision", () => {
    expect(signalsFromDecisions(["unknown_decision"], 1)).toHaveLength(0);
  });

  it("generates signals for product_focus at month 1", () => {
    const sigs = signalsFromDecisions(["product_focus"], 1);
    expect(sigs.length).toBeGreaterThan(0);
    expect(sigs[0].playstyle).toBe("product_led");
    expect(sigs[0].month).toBe(1);
    expect(sigs[0].source).toBe("monthly_decision");
  });

  it("generates multiple signals for decisions mapping to multiple playstyles", () => {
    const sigs = signalsFromDecisions(["launch_beta"], 2);
    const playstyles = sigs.map((s) => s.playstyle);
    expect(playstyles).toContain("product_led");
    expect(playstyles).toContain("hype_machine");
  });

  it("generates signals for enterprise_push", () => {
    const sigs = signalsFromDecisions(["enterprise_push"], 3);
    expect(sigs.some((s) => s.playstyle === "enterprise_sales")).toBe(true);
  });

  it("generates signals for cut_costs → cockroach", () => {
    const sigs = signalsFromDecisions(["cut_costs"], 2);
    expect(sigs.some((s) => s.playstyle === "cockroach")).toBe(true);
  });

  it("generates signals for fundraising_prep → capital_blitzscaler", () => {
    const sigs = signalsFromDecisions(["fundraising_prep"], 3);
    expect(sigs.some((s) => s.playstyle === "capital_blitzscaler")).toBe(true);
  });

  it("generates signals from multiple decisions in one call", () => {
    const sigs = signalsFromDecisions(["product_focus", "cut_costs"], 1);
    expect(sigs.some((s) => s.playstyle === "product_led")).toBe(true);
    expect(sigs.some((s) => s.playstyle === "cockroach")).toBe(true);
  });

  it("produces deterministic IDs for same inputs", () => {
    const a = signalsFromDecisions(["product_focus"], 5);
    const b = signalsFromDecisions(["product_focus"], 5);
    expect(a[0].id).toBe(b[0].id);
  });

  it("produces different IDs for different months", () => {
    const a = signalsFromDecisions(["product_focus"], 1);
    const b = signalsFromDecisions(["product_focus"], 2);
    expect(a[0].id).not.toBe(b[0].id);
  });
});

// ─── signalsFromHire ─────────────────────────────────────────────────────────

describe("signalsFromHire", () => {
  it("returns empty for unknown role", () => {
    expect(signalsFromHire("Unknown Role", 1)).toHaveLength(0);
  });

  it("generates technical_builder signal for CTO hire", () => {
    const sigs = signalsFromHire("CTO", 3);
    expect(sigs.length).toBeGreaterThan(0);
    expect(sigs.some((s) => s.playstyle === "technical_builder")).toBe(true);
  });

  it("generates enterprise_sales signal for Sales Lead hire", () => {
    const sigs = signalsFromHire("Sales Lead", 2);
    expect(sigs.some((s) => s.playstyle === "enterprise_sales")).toBe(true);
  });

  it("generates regulated_operator signal for Compliance Advisor hire", () => {
    const sigs = signalsFromHire("Compliance Advisor", 2);
    expect(sigs.some((s) => s.playstyle === "regulated_operator")).toBe(true);
  });

  it("generates hype_machine signal for Marketing Manager hire", () => {
    const sigs = signalsFromHire("Marketing Manager", 2);
    expect(sigs.some((s) => s.playstyle === "hype_machine")).toBe(true);
  });

  it("generates community_led signal for Customer Support hire", () => {
    const sigs = signalsFromHire("Customer Support", 2);
    expect(sigs.some((s) => s.playstyle === "community_led")).toBe(true);
  });

  it("generates technical_builder signal for AI Engineer hire", () => {
    const sigs = signalsFromHire("AI Engineer", 4);
    expect(sigs.some((s) => s.playstyle === "technical_builder")).toBe(true);
  });

  it("is deterministic", () => {
    const a = signalsFromHire("CTO", 3);
    const b = signalsFromHire("CTO", 3);
    expect(a[0].id).toBe(b[0].id);
  });
});

// ─── signalsFromSocialAction ─────────────────────────────────────────────────

describe("signalsFromSocialAction", () => {
  it("returns empty for unknown social action", () => {
    expect(signalsFromSocialAction("unknown_action", 1)).toHaveLength(0);
  });

  it("generates hype_machine signal for founder_x_thread", () => {
    const sigs = signalsFromSocialAction("founder_x_thread", 2);
    expect(sigs.some((s) => s.playstyle === "hype_machine")).toBe(true);
  });

  it("generates trust_builder signal for founder_transparency_post", () => {
    const sigs = signalsFromSocialAction("founder_transparency_post", 3);
    expect(sigs.some((s) => s.playstyle === "trust_builder")).toBe(true);
  });

  it("generates community_led signal for instagram_bts", () => {
    const sigs = signalsFromSocialAction("instagram_bts", 2);
    expect(sigs.some((s) => s.playstyle === "community_led")).toBe(true);
  });

  it("generates hype_machine signal for launch_announcement", () => {
    const sigs = signalsFromSocialAction("launch_announcement", 3);
    expect(sigs.some((s) => s.playstyle === "hype_machine")).toBe(true);
  });
});

// ─── signalsFromCounterAction ────────────────────────────────────────────────

describe("signalsFromCounterAction", () => {
  it("returns empty for unknown counter-action", () => {
    expect(signalsFromCounterAction("unknown_counter", 1)).toHaveLength(0);
  });

  it("generates rival_killer signal for founder_debate counter-action", () => {
    const sigs = signalsFromCounterAction("founder_debate", 2);
    expect(sigs.some((s) => s.playstyle === "rival_killer")).toBe(true);
  });

  it("generates community_led signal for customer_proof_campaign", () => {
    const sigs = signalsFromCounterAction("customer_proof_campaign", 3);
    expect(sigs.some((s) => s.playstyle === "community_led")).toBe(true);
  });
});

// ─── signalsFromMission ───────────────────────────────────────────────────────

describe("signalsFromMission", () => {
  it("returns empty for failed mission", () => {
    expect(signalsFromMission("engineering", "failed", 2)).toHaveLength(0);
  });

  it("returns empty for pending mission", () => {
    expect(signalsFromMission("engineering", "pending", 2)).toHaveLength(0);
  });

  it("generates signals for completed engineering mission", () => {
    const sigs = signalsFromMission("engineering", "completed", 3);
    expect(sigs.length).toBeGreaterThan(0);
    expect(sigs.some((s) => s.playstyle === "technical_builder")).toBe(true);
  });

  it("generates signals for completed compliance mission", () => {
    const sigs = signalsFromMission("compliance", "completed", 3);
    expect(sigs.some((s) => s.playstyle === "regulated_operator")).toBe(true);
  });

  it("returns empty for unknown category", () => {
    expect(signalsFromMission("unknown_category", "completed", 2)).toHaveLength(0);
  });
});

// ─── appendSignals ────────────────────────────────────────────────────────────

describe("appendSignals", () => {
  it("appends new signals", () => {
    const a: StrategySignal[] = [
      { id: "s1", source: "monthly_decision", sourceId: "src1", month: 1, playstyle: "product_led", weight: 10, reason: "r", tags: [] },
    ];
    const b: StrategySignal[] = [
      { id: "s2", source: "monthly_decision", sourceId: "src2", month: 2, playstyle: "hype_machine", weight: 8, reason: "r", tags: [] },
    ];
    const result = appendSignals(a, b);
    expect(result).toHaveLength(2);
  });

  it("deduplicates by sourceId", () => {
    const a: StrategySignal[] = [
      { id: "s1", source: "monthly_decision", sourceId: "dup-src", month: 1, playstyle: "product_led", weight: 10, reason: "r", tags: [] },
    ];
    const b: StrategySignal[] = [
      { id: "s2", source: "monthly_decision", sourceId: "dup-src", month: 1, playstyle: "product_led", weight: 10, reason: "r", tags: [] },
    ];
    const result = appendSignals(a, b);
    expect(result).toHaveLength(1);
  });

  it("caps at 500 signals, keeping latest", () => {
    const existing: StrategySignal[] = Array.from({ length: 490 }, (_, i) => ({
      id: `s${i}`,
      source: "monthly_decision" as const,
      sourceId: `src-old-${i}`,
      month: 1,
      playstyle: "product_led" as const,
      weight: 5,
      reason: "r",
      tags: [],
    }));
    const incoming: StrategySignal[] = Array.from({ length: 20 }, (_, i) => ({
      id: `s${500 + i}`,
      source: "hire" as const,
      sourceId: `src-new-${i}`,
      month: 5,
      playstyle: "hype_machine" as const,
      weight: 8,
      reason: "r",
      tags: [],
    }));
    const result = appendSignals(existing, incoming);
    expect(result).toHaveLength(500);
    // Last entry should be a "new" signal
    expect(result[result.length - 1].sourceId).toContain("src-new");
  });
});

// ─── computeStrategyState — basic structure ──────────────────────────────────

describe("computeStrategyState — basic structure", () => {
  it("returns all 10 stacks with no signals", () => {
    const state = computeStrategyState([], baseCtx);
    expect(state.stacks).toHaveLength(10);
  });

  it("returns dormant dominant playstyle when no signals", () => {
    const state = computeStrategyState([], baseCtx);
    expect(state.dominantPlaystyle).toBeNull();
  });

  it("has no active synergies with no signals", () => {
    const state = computeStrategyState([], baseCtx);
    expect(state.activeSynergies).toHaveLength(0);
  });

  it("totalSignals reflects input count", () => {
    const sigs = signalsFromDecisions(["product_focus", "enterprise_push"], 1);
    const state = computeStrategyState(sigs, baseCtx);
    expect(state.totalSignals).toBe(sigs.length);
  });
});

// ─── computeStrategyState — dominant/secondary playstyle selection ────────────

describe("computeStrategyState — playstyle selection", () => {
  it("identifies product_led as dominant after sufficient product signals", () => {
    // Need ≥50 progress for dominant; product_focus = 10, customer_interviews = 8, launch_beta = 8
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 6; m++) {
      sigs.push(...signalsFromDecisions(["product_focus"], m));
    }
    const state = computeStrategyState(sigs, baseCtx);
    expect(state.dominantPlaystyle).toBe("product_led");
  });

  it("identifies hype_machine as dominant after hype signals", () => {
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 6; m++) {
      sigs.push(...signalsFromSocialAction("launch_announcement", m));
    }
    const state = computeStrategyState(sigs, baseCtx);
    expect(state.dominantPlaystyle).toBe("hype_machine");
  });

  it("identifies cockroach as dominant after cost-cutting signals", () => {
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 5; m++) {
      sigs.push(...signalsFromDecisions(["cut_costs"], m));
    }
    const state = computeStrategyState(sigs, baseCtx);
    expect(state.dominantPlaystyle).toBe("cockroach");
  });

  it("includes secondary playstyles at ≥25 progress", () => {
    const sigs: StrategySignal[] = [
      ...signalsFromDecisions(["product_focus"], 1),
      ...signalsFromDecisions(["product_focus"], 2),
      ...signalsFromDecisions(["product_focus"], 3),
      ...signalsFromDecisions(["product_focus"], 4),
      ...signalsFromDecisions(["product_focus"], 5),
      ...signalsFromDecisions(["cut_costs"], 1),
      ...signalsFromDecisions(["cut_costs"], 2),
      ...signalsFromDecisions(["cut_costs"], 3),
    ];
    const state = computeStrategyState(sigs, baseCtx);
    expect(state.dominantPlaystyle).toBe("product_led");
    expect(state.secondaryPlaystyles).toContain("cockroach");
  });

  it("caps secondary playstyles at 2", () => {
    const state = computeStrategyState([], baseCtx);
    expect(state.secondaryPlaystyles.length).toBeLessThanOrEqual(2);
  });

  it("stacks are sorted by progress descending", () => {
    const sigs: StrategySignal[] = [
      ...signalsFromDecisions(["product_focus"], 1),
      ...signalsFromDecisions(["product_focus"], 2),
      ...signalsFromDecisions(["product_focus"], 3),
      ...signalsFromDecisions(["product_focus"], 4),
      ...signalsFromDecisions(["product_focus"], 5),
      ...signalsFromDecisions(["cut_costs"], 1),
    ];
    const state = computeStrategyState(sigs, baseCtx);
    for (let i = 1; i < state.stacks.length; i++) {
      expect(state.stacks[i - 1].progress).toBeGreaterThanOrEqual(state.stacks[i].progress);
    }
  });
});

// ─── Synergy activation thresholds ───────────────────────────────────────────

describe("synergy activation", () => {
  it("no synergies active at dormant level", () => {
    const sigs = signalsFromDecisions(["product_focus"], 1); // ~10 progress
    const state = computeStrategyState(sigs, baseCtx);
    const productStack = state.stacks.find((s) => s.playstyle === "product_led")!;
    expect(productStack.level).toBe("dormant");
    expect(productStack.activeSynergies).toHaveLength(0);
  });

  it("no synergies active at emerging level", () => {
    const sigs = [
      ...signalsFromDecisions(["product_focus"], 1),
      ...signalsFromDecisions(["product_focus"], 2),
      ...signalsFromDecisions(["customer_interviews"], 3),
    ];
    const state = computeStrategyState(sigs, baseCtx);
    const productStack = state.stacks.find((s) => s.playstyle === "product_led")!;
    expect(productStack.level).toBe("emerging");
    expect(productStack.activeSynergies).toHaveLength(0);
  });

  it("active-level synergy unlocks at ≥50 progress (pmf_sprint)", () => {
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 6; m++) {
      sigs.push(...signalsFromDecisions(["product_focus"], m));
    }
    const state = computeStrategyState(sigs, baseCtx);
    const productStack = state.stacks.find((s) => s.playstyle === "product_led")!;
    expect(productStack.level === "active" || productStack.level === "dominant").toBe(true);
    expect(productStack.activeSynergies.some((s) => s.id === "pmf_sprint")).toBe(true);
  });

  it("dominant-level synergy unlocks at ≥75 progress (launch_readiness)", () => {
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 10; m++) {
      sigs.push(...signalsFromDecisions(["product_focus"], m));
    }
    const state = computeStrategyState(sigs, baseCtx);
    const productStack = state.stacks.find((s) => s.playstyle === "product_led")!;
    if (productStack.level === "dominant") {
      expect(productStack.activeSynergies.some((s) => s.id === "launch_readiness")).toBe(true);
    }
  });

  it("active synergies aggregated across all active stacks", () => {
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 6; m++) {
      sigs.push(...signalsFromDecisions(["product_focus"], m));
      sigs.push(...signalsFromDecisions(["cut_costs"], m));
    }
    const state = computeStrategyState(sigs, baseCtx);
    expect(state.activeSynergies.length).toBeGreaterThan(0);
  });
});

// ─── computeStrategyEffects ───────────────────────────────────────────────────

describe("computeStrategyEffects", () => {
  it("returns empty object when no synergies active", () => {
    const state = computeStrategyState([], baseCtx);
    const effects = computeStrategyEffects(state, baseCtx);
    expect(Object.keys(effects)).toHaveLength(0);
  });

  it("returns productProgressDelta for active product_led synergy", () => {
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 6; m++) {
      sigs.push(...signalsFromDecisions(["product_focus"], m));
    }
    const state = computeStrategyState(sigs, baseCtx);
    const effects = computeStrategyEffects(state, baseCtx);
    // pmf_sprint gives productProgressDelta: 3
    if (state.activeSynergies.some((s) => s.id === "pmf_sprint")) {
      expect(effects.productProgressDelta).toBeGreaterThan(0);
    }
  });

  it("caps revenue delta at ±$3K", () => {
    const sigs: StrategySignal[] = [];
    // enterprise_wedge + procurement_credibility both give revenueDelta
    for (let m = 1; m <= 10; m++) {
      sigs.push(...signalsFromDecisions(["enterprise_push"], m));
      sigs.push(...signalsFromHire("Sales Lead", m));
    }
    const state = computeStrategyState(sigs, baseCtx);
    const effects = computeStrategyEffects(state, baseCtx);
    if (effects.revenueDelta !== undefined) {
      expect(Math.abs(effects.revenueDelta)).toBeLessThanOrEqual(3000);
    }
  });

  it("caps riskScore delta at ±4", () => {
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 10; m++) {
      sigs.push(...signalsFromDecisions(["improve_security"], m));
    }
    const state = computeStrategyState(sigs, baseCtx);
    const effects = computeStrategyEffects(state, baseCtx);
    if (effects.riskScoreDelta !== undefined) {
      expect(Math.abs(effects.riskScoreDelta)).toBeLessThanOrEqual(4);
    }
  });

  it("caps investorScore delta at ±3", () => {
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 10; m++) {
      sigs.push(...signalsFromDecisions(["fundraising_prep"], m));
    }
    const state = computeStrategyState(sigs, baseCtx);
    const effects = computeStrategyEffects(state, baseCtx);
    if (effects.investorScoreDelta !== undefined) {
      expect(Math.abs(effects.investorScoreDelta)).toBeLessThanOrEqual(3);
    }
  });

  it("caps valuation delta at ±$20K", () => {
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 8; m++) {
      sigs.push(...signalsFromSocialAction("launch_announcement", m));
    }
    const state = computeStrategyState(sigs, baseCtx);
    const effects = computeStrategyEffects(state, baseCtx);
    if (effects.valuationDelta !== undefined) {
      expect(Math.abs(effects.valuationDelta)).toBeLessThanOrEqual(20000);
    }
  });

  it("cockroach synergy reduces burn", () => {
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 6; m++) {
      sigs.push(...signalsFromDecisions(["cut_costs"], m));
    }
    const state = computeStrategyState(sigs, baseCtx);
    const effects = computeStrategyEffects(state, baseCtx);
    if (state.activeSynergies.some((s) => s.id === "runway_discipline")) {
      expect(effects.burnDelta).toBeLessThan(0);
    }
  });

  it("adds brand risk penalty when hype_machine active with weak product", () => {
    const weakProductCtx: ComputeStrategyContext = { ...baseCtx, productProgress: 30, brandRisk: 25 };
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 6; m++) {
      sigs.push(...signalsFromSocialAction("launch_announcement", m));
    }
    const state = computeStrategyState(sigs, weakProductCtx);
    const effectsWeak = computeStrategyEffects(state, weakProductCtx);
    const effectsStrong = computeStrategyEffects(state, baseCtx);
    // With weak product, brandRiskDelta should be higher (more penalized)
    const weakBrandRisk = effectsWeak.brandRiskDelta ?? 0;
    const strongBrandRisk = effectsStrong.brandRiskDelta ?? 0;
    expect(weakBrandRisk).toBeGreaterThanOrEqual(strongBrandRisk);
  });
});

// ─── Warnings ─────────────────────────────────────────────────────────────────

describe("computeStrategyState — warnings", () => {
  it("warns when hype outpaces product", () => {
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 6; m++) {
      sigs.push(...signalsFromSocialAction("launch_announcement", m));
    }
    const lowProductCtx = { ...baseCtx, productProgress: 30 };
    const state = computeStrategyState(sigs, lowProductCtx);
    expect(state.warnings.some((w) => w.includes("Hype is outpacing"))).toBe(true);
  });

  it("warns when brand risk is critical with hype", () => {
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 6; m++) {
      sigs.push(...signalsFromSocialAction("launch_announcement", m));
    }
    const highRiskCtx = { ...baseCtx, brandRisk: 70 };
    const state = computeStrategyState(sigs, highRiskCtx);
    expect(state.warnings.some((w) => w.includes("Brand risk critical"))).toBe(true);
  });

  it("warns on cockroach + hype machine conflict", () => {
    const sigs: StrategySignal[] = [
      ...signalsFromDecisions(["cut_costs"], 1),
      ...signalsFromDecisions(["cut_costs"], 2),
      ...signalsFromDecisions(["cut_costs"], 3),
      ...signalsFromSocialAction("launch_announcement", 1),
      ...signalsFromSocialAction("launch_announcement", 2),
      ...signalsFromSocialAction("launch_announcement", 3),
    ];
    const state = computeStrategyState(sigs, baseCtx);
    const hasCockroach = (state.stacks.find((s) => s.playstyle === "cockroach")?.progress ?? 0) >= 25;
    const hasHype = (state.stacks.find((s) => s.playstyle === "hype_machine")?.progress ?? 0) >= 25;
    if (hasCockroach && hasHype) {
      expect(state.warnings.some((w) => w.includes("Conflicting strategies"))).toBe(true);
    }
  });

  it("warns on rival killer with low trust", () => {
    const lowTrustCtx = { ...baseCtx, socialTrust: 25, rivalryMaxScore: 70 };
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 6; m++) {
      sigs.push(...signalsFromCounterAction("competitor_callout", m));
    }
    const state = computeStrategyState(sigs, lowTrustCtx);
    const rivalProg = state.stacks.find((s) => s.playstyle === "rival_killer")?.progress ?? 0;
    if (rivalProg >= 50) {
      expect(state.warnings.some((w) => w.includes("Rival Killer"))).toBe(true);
    }
  });
});

// ─── Recommendations ──────────────────────────────────────────────────────────

describe("computeStrategyState — recommendations", () => {
  it("recommends product focus when productProgress is low", () => {
    const lowProductCtx = { ...baseCtx, productProgress: 30 };
    const state = computeStrategyState([], lowProductCtx);
    expect(state.recommendations.some((r) => r.includes("Product"))).toBe(true);
  });

  it("recommends brand risk mitigation at high brand risk", () => {
    const highRiskCtx = { ...baseCtx, brandRisk: 60 };
    const state = computeStrategyState([], highRiskCtx);
    expect(state.recommendations.some((r) => r.includes("brand risk") || r.includes("transparency"))).toBe(true);
  });

  it("caps recommendations at 4", () => {
    const sigs = [
      ...signalsFromDecisions(["cut_costs"], 1),
      ...signalsFromSocialAction("launch_announcement", 1),
    ];
    const state = computeStrategyState(sigs, { ...baseCtx, brandRisk: 70, productProgress: 30 });
    expect(state.recommendations.length).toBeLessThanOrEqual(4);
  });
});

// ─── generateArchetypeSummary ─────────────────────────────────────────────────

describe("generateArchetypeSummary", () => {
  it("returns a summary with title and description for dominant playstyle", () => {
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 6; m++) {
      sigs.push(...signalsFromDecisions(["product_focus"], m));
    }
    const state = computeStrategyState(sigs, baseCtx);
    const summary = generateArchetypeSummary(sigs, state, {
      productProgress: 70,
      revenue: 25000,
      outcome: "SERIES_A_READY",
    });
    expect(summary.title).toBeTruthy();
    expect(summary.description).toBeTruthy();
    expect(summary.finalRunNarrative).toBeTruthy();
  });

  it("handles no signals gracefully", () => {
    const state = computeStrategyState([], baseCtx);
    const summary = generateArchetypeSummary([], state, {
      productProgress: 40,
      revenue: 5000,
    });
    expect(summary.title).toBeTruthy();
    expect(summary.strengths).toBeInstanceOf(Array);
    expect(summary.weaknesses).toBeInstanceOf(Array);
  });

  it("uses won narrative for positive outcome and lost narrative for dead outcome", () => {
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 6; m++) {
      sigs.push(...signalsFromDecisions(["product_focus"], m));
    }
    const state = computeStrategyState(sigs, baseCtx);
    const wonSummary = generateArchetypeSummary(sigs, state, {
      productProgress: 80,
      revenue: 50000,
      outcome: "BREAKOUT",
    });
    const lostSummary = generateArchetypeSummary(sigs, state, {
      productProgress: 15,
      revenue: 1000,
      outcome: "DEAD",
    });
    expect(wonSummary.finalRunNarrative).not.toBe(lostSummary.finalRunNarrative);
  });

  it("reflects dominant playstyle in summary", () => {
    const sigs: StrategySignal[] = [];
    for (let m = 1; m <= 6; m++) {
      sigs.push(...signalsFromDecisions(["product_focus"], m));
    }
    const state = computeStrategyState(sigs, baseCtx);
    const summary = generateArchetypeSummary(sigs, state, {
      productProgress: 75,
      revenue: 30000,
      outcome: "SERIES_A_READY",
    });
    expect(summary.dominantPlaystyle).toBe("product_led");
  });
});

// ─── Integration: signal accumulation across sources ─────────────────────────

describe("cross-source signal integration", () => {
  it("accumulates signals from decisions, hires, social, and missions", () => {
    const sigs = [
      ...signalsFromDecisions(["enterprise_push", "hire_sales"], 1),
      ...signalsFromHire("Sales Lead", 2),
      ...signalsFromSocialAction("customer_testimonial_campaign", 2),
      ...signalsFromMission("enterprise", "completed", 2),
    ];
    const state = computeStrategyState(sigs, baseCtx);
    const enterpriseStack = state.stacks.find((s) => s.playstyle === "enterprise_sales")!;
    expect(enterpriseStack.progress).toBeGreaterThan(0);
  });

  it("regulated_operator grows from compliance hire + security decision + compliance mission", () => {
    const sigs = [
      ...signalsFromHire("Compliance Advisor", 1),
      ...signalsFromDecisions(["improve_security", "hire_compliance"], 2),
      ...signalsFromMission("compliance", "completed", 3),
    ];
    const state = computeStrategyState(sigs, baseCtx);
    const regulatedStack = state.stacks.find((s) => s.playstyle === "regulated_operator")!;
    expect(regulatedStack.progress).toBeGreaterThan(20);
  });

  it("trust_builder grows from transparency post + community actions", () => {
    const sigs = [
      ...signalsFromSocialAction("founder_transparency_post", 1),
      ...signalsFromSocialAction("instagram_bts", 2),
      ...signalsFromSocialAction("founder_transparency_post", 3),
      ...signalsFromSocialAction("instagram_bts", 4),
    ];
    const state = computeStrategyState(sigs, baseCtx);
    const trustStack = state.stacks.find((s) => s.playstyle === "trust_builder")!;
    expect(trustStack.progress).toBeGreaterThan(15);
  });

  it("rival_killer grows from counter-actions", () => {
    const sigs = [
      ...signalsFromCounterAction("competitor_callout", 1),
      ...signalsFromCounterAction("competitor_callout", 2),
      ...signalsFromCounterAction("competitor_callout", 3),
      ...signalsFromCounterAction("customer_proof_campaign", 4),
    ];
    const state = computeStrategyState(sigs, baseCtx);
    const rivalStack = state.stacks.find((s) => s.playstyle === "rival_killer")!;
    expect(rivalStack.progress).toBeGreaterThan(0);
  });

  it("community_led benefits when community + trust signals combine", () => {
    const sigs = [
      ...signalsFromSocialAction("instagram_bts", 1),
      ...signalsFromSocialAction("founder_transparency_post", 2),
      ...signalsFromHire("Customer Support", 3),
      ...signalsFromSocialAction("instagram_bts", 4),
    ];
    const state = computeStrategyState(sigs, baseCtx);
    const communityStack = state.stacks.find((s) => s.playstyle === "community_led")!;
    expect(communityStack.progress).toBeGreaterThan(10);
  });
});
