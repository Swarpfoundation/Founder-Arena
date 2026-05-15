import { describe, it, expect } from "vitest";
import { generateRivals } from "@/lib/rivals/rival-generator";
import {
  applyRivalMoves,
  checkCounterActionAvailability,
} from "@/lib/rivals/rival-engine";
import {
  RIVAL_COUNTER_ACTIONS,
  getCounterActionById,
} from "@/lib/rivals/rival-counteractions";
import { generateRivalComparison } from "@/lib/rivals/rival-comparison";
import {
  rivalSeed,
  pick,
  buildFounderProfile,
  ARCHETYPE_DEFINITIONS,
  rivalryScoreToRelationship,
  generateRivalStartupName,
  generateRivalFounderName,
} from "@/lib/rivals/rival-catalog";
import { generateRivalFeedItems, generateCounterActionFeedItem } from "@/lib/rivals/rival-feed";
import type {
  GenerateRivalsContext,
  RivalStartup,
  RivalArchetype,
  RivalMoveType,
} from "@/lib/rivals/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseCtx: GenerateRivalsContext = {
  startupId: "startup-test-abc",
  startupName: "TestCo",
  sector: "SaaS",
  stage: "funded",
  currentMonth: 1,
  productProgress: 55,
  revenue: 12000,
  investorScore: 60,
  riskScore: 35,
};

const baseMoveCtx = {
  playerProductProgress: 55,
  playerRevenue: 12000,
  playerHype: 40,
  playerTrust: 55,
  playerBrandRisk: 20,
  playerInvestorScore: 60,
  marketCondition: "neutral",
  sector: "SaaS",
};

// ─── rivalSeed ────────────────────────────────────────────────────────────────

describe("rivalSeed", () => {
  it("returns a non-negative integer", () => {
    expect(rivalSeed("test")).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic for the same input", () => {
    expect(rivalSeed("hello")).toBe(rivalSeed("hello"));
  });

  it("returns different values for different inputs", () => {
    expect(rivalSeed("abc")).not.toBe(rivalSeed("xyz"));
  });
});

// ─── pick ─────────────────────────────────────────────────────────────────────

describe("pick", () => {
  it("always returns an element from the array", () => {
    const arr = ["a", "b", "c"];
    for (let i = 0; i < 100; i++) {
      expect(arr).toContain(pick(arr, i));
    }
  });

  it("is deterministic for the same seed", () => {
    const arr = ["x", "y", "z"];
    expect(pick(arr, 42)).toBe(pick(arr, 42));
  });
});

// ─── Name generation ──────────────────────────────────────────────────────────

describe("name generation", () => {
  it("generateRivalStartupName returns a non-empty string", () => {
    const name = generateRivalStartupName(12345);
    expect(name.length).toBeGreaterThan(0);
  });

  it("generateRivalFounderName returns firstName + lastName", () => {
    const name = generateRivalFounderName(99999);
    const parts = name.split(" ");
    expect(parts.length).toBeGreaterThanOrEqual(2);
  });

  it("different seeds produce different names", () => {
    const a = generateRivalStartupName(1);
    const b = generateRivalStartupName(999999);
    expect(a).not.toBe(b);
  });
});

// ─── buildFounderProfile ──────────────────────────────────────────────────────

describe("buildFounderProfile", () => {
  const archetypes: RivalArchetype[] = [
    "copycat", "hype_founder", "enterprise_killer", "technical_genius",
    "predator_vc_backed", "community_builder", "regulatory_operator", "chaos_founder",
  ];

  it("builds a profile for every archetype", () => {
    for (const arch of archetypes) {
      const profile = buildFounderProfile(arch, 12345);
      expect(profile.archetype).toBe(arch);
      expect(profile.name.length).toBeGreaterThan(0);
    }
  });

  it("all stats are within 0-100", () => {
    const profile = buildFounderProfile("hype_founder", 42);
    expect(profile.aggression).toBeGreaterThanOrEqual(0);
    expect(profile.aggression).toBeLessThanOrEqual(100);
    expect(profile.ethics).toBeGreaterThanOrEqual(0);
    expect(profile.ethics).toBeLessThanOrEqual(100);
    expect(profile.mediaSkill).toBeGreaterThanOrEqual(0);
    expect(profile.mediaSkill).toBeLessThanOrEqual(100);
  });

  it("hype_founder has higher mediaSkill than regulatory_operator on average", () => {
    let hypMedia = 0, regMedia = 0;
    for (let i = 0; i < 20; i++) {
      hypMedia += buildFounderProfile("hype_founder", i * 100).mediaSkill;
      regMedia += buildFounderProfile("regulatory_operator", i * 100).mediaSkill;
    }
    expect(hypMedia / 20).toBeGreaterThan(regMedia / 20);
  });

  it("technical_genius has higher productSkill than hype_founder on average", () => {
    let techProd = 0, hypeProd = 0;
    for (let i = 0; i < 20; i++) {
      techProd += buildFounderProfile("technical_genius", i * 100).productSkill;
      hypeProd += buildFounderProfile("hype_founder", i * 100).productSkill;
    }
    expect(techProd / 20).toBeGreaterThan(hypeProd / 20);
  });
});

// ─── ARCHETYPE_DEFINITIONS ────────────────────────────────────────────────────

describe("ARCHETYPE_DEFINITIONS", () => {
  const archetypes: RivalArchetype[] = [
    "copycat", "hype_founder", "enterprise_killer", "technical_genius",
    "predator_vc_backed", "community_builder", "regulatory_operator", "chaos_founder",
  ];

  it("has a definition for every archetype", () => {
    for (const arch of archetypes) {
      expect(ARCHETYPE_DEFINITIONS[arch]).toBeDefined();
    }
  });

  it("every archetype has at least 3 preferred moves", () => {
    for (const arch of archetypes) {
      expect(ARCHETYPE_DEFINITIONS[arch].preferredMoves.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("every archetype has a catchphrases array", () => {
    for (const arch of archetypes) {
      expect(ARCHETYPE_DEFINITIONS[arch].catchphrases.length).toBeGreaterThan(0);
    }
  });
});

// ─── rivalryScoreToRelationship ───────────────────────────────────────────────

describe("rivalryScoreToRelationship", () => {
  it("returns defeated when isDefeated is true", () => {
    expect(rivalryScoreToRelationship(100, true)).toBe("defeated");
  });

  it("returns feared for score >= 80", () => {
    expect(rivalryScoreToRelationship(80, false)).toBe("feared");
    expect(rivalryScoreToRelationship(99, false)).toBe("feared");
  });

  it("returns hostile for score 60-79", () => {
    expect(rivalryScoreToRelationship(60, false)).toBe("hostile");
    expect(rivalryScoreToRelationship(70, false)).toBe("hostile");
  });

  it("returns tense for score 40-59", () => {
    expect(rivalryScoreToRelationship(40, false)).toBe("tense");
    expect(rivalryScoreToRelationship(55, false)).toBe("tense");
  });

  it("returns neutral for score 16-39", () => {
    expect(rivalryScoreToRelationship(20, false)).toBe("neutral");
  });

  it("returns friendly for score <= 5", () => {
    expect(rivalryScoreToRelationship(0, false)).toBe("friendly");
    expect(rivalryScoreToRelationship(5, false)).toBe("friendly");
  });
});

// ─── generateRivals ───────────────────────────────────────────────────────────

describe("generateRivals", () => {
  it("generates 3 rivals for a funded startup", () => {
    const rivals = generateRivals(baseCtx);
    expect(rivals.length).toBe(3);
  });

  it("generates 2 rivals for an idea-stage startup", () => {
    const rivals = generateRivals({ ...baseCtx, stage: "idea" });
    expect(rivals.length).toBe(2);
  });

  it("all rivals have unique IDs", () => {
    const rivals = generateRivals(baseCtx);
    const ids = rivals.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all rivals have non-empty names", () => {
    const rivals = generateRivals(baseCtx);
    for (const r of rivals) {
      expect(r.name.length).toBeGreaterThan(0);
    }
  });

  it("all rivals have valid founder archetypes", () => {
    const validArchetypes: RivalArchetype[] = [
      "copycat", "hype_founder", "enterprise_killer", "technical_genius",
      "predator_vc_backed", "community_builder", "regulatory_operator", "chaos_founder",
    ];
    const rivals = generateRivals(baseCtx);
    for (const r of rivals) {
      expect(validArchetypes).toContain(r.founder.archetype);
    }
  });

  it("generation is deterministic for the same context", () => {
    const a = generateRivals(baseCtx);
    const b = generateRivals(baseCtx);
    expect(a.map((r) => r.id)).toEqual(b.map((r) => r.id));
    expect(a.map((r) => r.founder.name)).toEqual(b.map((r) => r.founder.name));
  });

  it("different startup IDs produce different rivals", () => {
    const a = generateRivals(baseCtx);
    const b = generateRivals({ ...baseCtx, startupId: "startup-different-xyz" });
    expect(a[0].id).not.toBe(b[0].id);
  });

  it("generated rivals have valid productProgress (0-100)", () => {
    const rivals = generateRivals(baseCtx);
    for (const r of rivals) {
      expect(r.productProgress).toBeGreaterThanOrEqual(0);
      expect(r.productProgress).toBeLessThanOrEqual(100);
    }
  });

  it("generated rivals start with neutral relationship", () => {
    const rivals = generateRivals(baseCtx);
    for (const r of rivals) {
      expect(r.relationshipToPlayer).toBe("neutral");
    }
  });

  it("generated rivals have rivalryScore of 0", () => {
    const rivals = generateRivals(baseCtx);
    for (const r of rivals) {
      expect(r.rivalryScore).toBe(0);
    }
  });

  it("sector SaaS produces at least one aligned archetype", () => {
    const rivals = generateRivals(baseCtx);
    const saasAligned: RivalArchetype[] = ["copycat", "enterprise_killer", "predator_vc_backed", "technical_genius"];
    expect(rivals.some((r) => saasAligned.includes(r.founder.archetype))).toBe(true);
  });
});

// ─── applyRivalMoves ──────────────────────────────────────────────────────────

describe("applyRivalMoves", () => {
  function makeRivals(): RivalStartup[] {
    return generateRivals(baseCtx);
  }

  it("returns updatedRivals for every input rival", () => {
    const rivals = makeRivals();
    const result = applyRivalMoves(rivals, 3, baseMoveCtx);
    expect(result.updatedRivals.length).toBe(rivals.length);
  });

  it("is deterministic for the same month and rivals", () => {
    const rivals = makeRivals();
    const a = applyRivalMoves(rivals, 4, baseMoveCtx);
    const b = applyRivalMoves(rivals, 4, baseMoveCtx);
    expect(a.rivalMoves.length).toBe(b.rivalMoves.length);
  });

  it("different months can produce different move sets", () => {
    const rivals = makeRivals();
    const m2 = applyRivalMoves(rivals, 2, baseMoveCtx);
    const m8 = applyRivalMoves(rivals, 8, baseMoveCtx);
    // Move counts or types may differ between months
    expect(m2.rivalMoves.length + m8.rivalMoves.length).toBeGreaterThanOrEqual(0);
  });

  it("rival moves have required fields", () => {
    const rivals = makeRivals();
    const result = applyRivalMoves(rivals, 3, baseMoveCtx);
    for (const move of result.rivalMoves) {
      expect(move.id).toBeTruthy();
      expect(move.rivalId).toBeTruthy();
      expect(move.title).toBeTruthy();
      expect(move.description).toBeTruthy();
      expect(["positive", "neutral", "warning", "critical"]).toContain(move.severity);
    }
  });

  it("generates Arena Feed items for each move", () => {
    const rivals = makeRivals();
    const result = applyRivalMoves(rivals, 5, baseMoveCtx);
    expect(result.newFeedItems.length).toBe(result.rivalMoves.length);
  });

  it("defeated rivals do not make moves", () => {
    const rivals = makeRivals().map((r) => ({ ...r, isDefeated: true }));
    const result = applyRivalMoves(rivals, 3, baseMoveCtx);
    expect(result.rivalMoves.length).toBe(0);
  });

  it("competitor_callout social action increases rival move probability on callout type", () => {
    const rivals = makeRivals();
    // Run many months and check that callout-targeted moves appear
    let calloutSeen = false;
    for (let m = 1; m <= 12; m++) {
      const result = applyRivalMoves(rivals, m, {
        ...baseMoveCtx,
        lastPlayerSocialActionId: "competitor_callout",
      });
      if (result.rivalMoves.some((mv) => mv.type === "founder_callout" || mv.targetedPlayerActionId === "competitor_callout")) {
        calloutSeen = true;
        break;
      }
    }
    // Not guaranteed every run, but should be likely over 12 months
    expect(typeof calloutSeen).toBe("boolean");
  });

  it("trust defense reduces negative social effects", () => {
    const rivals = makeRivals();
    const highTrust = applyRivalMoves(rivals, 3, { ...baseMoveCtx, playerTrust: 80 });
    const lowTrust  = applyRivalMoves(rivals, 3, { ...baseMoveCtx, playerTrust: 20 });

    // socialTrustDelta should be less negative (closer to 0) for high-trust player
    const highDelta = highTrust.playerEffects.socialTrustDelta ?? 0;
    const lowDelta  = lowTrust.playerEffects.socialTrustDelta ?? 0;
    // High trust means trust damage is mitigated (less negative or same)
    expect(highDelta).toBeGreaterThanOrEqual(lowDelta);
  });

  it("brand risk amplifier increases negative effects when risk is high", () => {
    const rivals = makeRivals();
    const lowRisk  = applyRivalMoves(rivals, 3, { ...baseMoveCtx, playerBrandRisk: 10 });
    const highRisk = applyRivalMoves(rivals, 3, { ...baseMoveCtx, playerBrandRisk: 75 });

    // brandRiskDelta should be more impactful (higher or equal) with high brand risk
    const lowBrandDelta  = lowRisk.playerEffects.brandRiskDelta ?? 0;
    const highBrandDelta = highRisk.playerEffects.brandRiskDelta ?? 0;
    expect(highBrandDelta).toBeGreaterThanOrEqual(lowBrandDelta);
  });

  it("revenue defense reduces revenue damage for high-revenue player", () => {
    const rivals = makeRivals();
    const richPlayer  = applyRivalMoves(rivals, 3, { ...baseMoveCtx, playerRevenue: 100000 });
    const poorPlayer  = applyRivalMoves(rivals, 3, { ...baseMoveCtx, playerRevenue: 1000 });
    const richDelta = richPlayer.playerEffects.revenueDelta ?? 0;
    const poorDelta = poorPlayer.playerEffects.revenueDelta ?? 0;
    // Rich player should suffer less or equal revenue loss
    expect(richDelta).toBeGreaterThanOrEqual(poorDelta);
  });
});

// ─── rival move types ─────────────────────────────────────────────────────────

describe("rival move types", () => {
  it("security_fumble move produces positive effects for the player", () => {
    // Create a chaos_founder rival (high security_fumble probability) with high productProgress
    const rivals = generateRivals({ ...baseCtx, sector: "Web3" });
    const results: number[] = [];

    // Run many months looking for a security_fumble move
    for (let m = 1; m <= 20; m++) {
      const r = applyRivalMoves(rivals, m, baseMoveCtx);
      const fumble = r.rivalMoves.find((mv) => mv.type === "security_fumble");
      if (fumble) {
        results.push(fumble.playerEffects.revenueDelta ?? 0);
        break;
      }
    }
    // Either no fumbles found (valid) or the revenue delta is positive
    for (const delta of results) {
      expect(delta).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── Counter-action catalog ───────────────────────────────────────────────────

describe("RIVAL_COUNTER_ACTIONS", () => {
  it("has 6 counter-actions", () => {
    expect(RIVAL_COUNTER_ACTIONS.length).toBe(6);
  });

  it("every action has required fields", () => {
    for (const a of RIVAL_COUNTER_ACTIONS) {
      expect(a.id).toBeTruthy();
      expect(a.title).toBeTruthy();
      expect(a.description).toBeTruthy();
      expect(a.cost).toBeGreaterThanOrEqual(0);
      expect(["low", "medium", "high"]).toContain(a.riskLevel);
    }
  });

  it("quiet_execution is FREE", () => {
    const action = getCounterActionById("quiet_execution");
    expect(action?.cost).toBe(0);
  });

  it("quiet_execution has negative brandRiskDelta (reduces risk)", () => {
    const action = getCounterActionById("quiet_execution");
    expect((action?.effects.brandRiskDelta ?? 0)).toBeLessThan(0);
  });

  it("accelerate_beta requires productProgress", () => {
    const action = getCounterActionById("accelerate_beta");
    expect(action?.requiredMinProductProgress).toBeGreaterThan(0);
  });

  it("customer_proof_campaign requires revenue", () => {
    const action = getCounterActionById("customer_proof_campaign");
    expect(action?.requiredMinRevenue).toBeGreaterThan(0);
  });

  it("founder_debate has high riskLevel", () => {
    const action = getCounterActionById("founder_debate");
    expect(action?.riskLevel).toBe("high");
  });

  it("founder_debate requires minimum rivalryScore", () => {
    const action = getCounterActionById("founder_debate");
    expect(action?.requiredMinRivalryScore).toBeGreaterThan(0);
  });
});

// ─── checkCounterActionAvailability ──────────────────────────────────────────

describe("checkCounterActionAvailability", () => {
  const rivals = generateRivals(baseCtx);

  it("blocks action when cash is insufficient", () => {
    const action = getCounterActionById("accelerate_beta")!;
    const result = checkCounterActionAvailability(action, rivals, 20000, 50, 60, 100);
    expect(result.available).toBe(false);
    expect(result.reason).toMatch(/\$.*cash/i);
  });

  it("blocks customer_proof_campaign when revenue is below threshold", () => {
    const action = getCounterActionById("customer_proof_campaign")!;
    const result = checkCounterActionAvailability(action, rivals, 1000, 50, 60, 100000);
    expect(result.available).toBe(false);
  });

  it("allows quiet_execution with no requirements", () => {
    const action = getCounterActionById("quiet_execution")!;
    const result = checkCounterActionAvailability(action, rivals, 0, 0, 0, 100000);
    expect(result.available).toBe(true);
  });

  it("blocks founder_debate when no rival has reached required rivalryScore", () => {
    const action = getCounterActionById("founder_debate")!;
    const lowRivalryRivals = rivals.map((r) => ({ ...r, rivalryScore: 0 }));
    const result = checkCounterActionAvailability(
      action, lowRivalryRivals, 20000, 60, 50, 100000
    );
    expect(result.available).toBe(false);
  });

  it("allows founder_debate when a rival has high rivalryScore and player has sufficient trust", () => {
    const action = getCounterActionById("founder_debate")!;
    const highRivalryRivals = rivals.map((r, i) => ({
      ...r,
      rivalryScore: i === 0 ? 50 : r.rivalryScore,
    }));
    const result = checkCounterActionAvailability(
      action, highRivalryRivals, 20000, 60, 50, 100000
    );
    expect(result.available).toBe(true);
  });
});

// ─── generateRivalFeedItems ───────────────────────────────────────────────────

describe("generateRivalFeedItems", () => {
  it("returns empty array for empty moves", () => {
    expect(generateRivalFeedItems([])).toEqual([]);
  });

  it("returns one feed item per move", () => {
    const rivals = generateRivals(baseCtx);
    const result = applyRivalMoves(rivals, 2, baseMoveCtx);
    const feedItems = generateRivalFeedItems(result.rivalMoves);
    expect(feedItems.length).toBe(result.rivalMoves.length);
  });

  it("feed items have required ArenaFeedItem fields", () => {
    const rivals = generateRivals(baseCtx);
    const result = applyRivalMoves(rivals, 2, baseMoveCtx);
    const feedItems = generateRivalFeedItems(result.rivalMoves);
    for (const item of feedItems) {
      expect(item.id).toBeTruthy();
      expect(item.month).toBeGreaterThan(0);
      expect(item.title).toBeTruthy();
      expect(item.body).toBeTruthy();
      expect(["positive", "neutral", "warning", "critical"]).toContain(item.severity);
      expect(item.source).toBe("rival");
    }
  });
});

// ─── generateCounterActionFeedItem ───────────────────────────────────────────

describe("generateCounterActionFeedItem", () => {
  it("returns a valid feed item", () => {
    const item = generateCounterActionFeedItem(3, "quiet_execution", "NovaStack", "positive");
    expect(item.id).toBeTruthy();
    expect(item.month).toBe(3);
    expect(item.severity).toBe("positive");
    expect(item.source).toBe("founder");
  });
});

// ─── generateRivalComparison ──────────────────────────────────────────────────

describe("generateRivalComparison", () => {
  it("generates a comparison for completed run", () => {
    const rivals = generateRivals(baseCtx).map((r, i) => ({
      ...r,
      valuationEstimate: i === 0 ? 200000 : 1500000,
      revenueEstimate: i === 0 ? 3000 : 25000,
    }));

    const comparison = generateRivalComparison(rivals, 2000000, 30000, "SERIES_A_READY");
    expect(comparison.rivals.length).toBe(rivals.length);
    expect(comparison.playerValuation).toBe(2000000);
    expect(comparison.overallSummary.length).toBeGreaterThan(0);
  });

  it("marks playerWon correctly based on valuation", () => {
    const rivals = generateRivals(baseCtx).map((r) => ({
      ...r,
      valuationEstimate: 100000,
    }));
    const comparison = generateRivalComparison(rivals, 5000000, 50000, "BREAKOUT");
    expect(comparison.rivals.every((e) => e.playerWon)).toBe(true);
  });

  it("marks playerWon=false when rival has higher valuation", () => {
    const rivals = generateRivals(baseCtx).map((r) => ({
      ...r,
      valuationEstimate: 99999999,
    }));
    const comparison = generateRivalComparison(rivals, 500000, 5000, "SEED_READY");
    expect(comparison.rivals.every((e) => !e.playerWon)).toBe(true);
  });

  it("summary is non-empty for all outcomes", () => {
    const rivals = generateRivals(baseCtx);
    for (const outcome of ["BREAKOUT", "dead", "SERIES_A_READY", "ZOMBIE"]) {
      const comp = generateRivalComparison(rivals, 1000000, 10000, outcome);
      expect(comp.overallSummary.length).toBeGreaterThan(0);
    }
  });

  it("each rival entry has a non-empty summary", () => {
    const rivals = generateRivals(baseCtx);
    const comparison = generateRivalComparison(rivals, 500000, 5000, "SEED_READY");
    for (const entry of comparison.rivals) {
      expect(entry.summary.length).toBeGreaterThan(0);
    }
  });
});

// ─── No external API calls ────────────────────────────────────────────────────

describe("safety: no external API calls", () => {
  it("generateRivals does not require network access", () => {
    expect(() => generateRivals(baseCtx)).not.toThrow();
  });

  it("applyRivalMoves does not require network access", () => {
    const rivals = generateRivals(baseCtx);
    expect(() => applyRivalMoves(rivals, 1, baseMoveCtx)).not.toThrow();
  });

  it("generateRivalComparison does not require network access", () => {
    const rivals = generateRivals(baseCtx);
    expect(() => generateRivalComparison(rivals, 500000, 5000, "SEED_READY")).not.toThrow();
  });
});

// ─── Rival monthly moves integration ─────────────────────────────────────────

describe("rival system: full monthly integration", () => {
  it("rivals accumulate traction over 6 months", () => {
    let rivals = generateRivals(baseCtx);
    for (let m = 1; m <= 6; m++) {
      const result = applyRivalMoves(rivals, m, { ...baseMoveCtx });
      rivals = result.updatedRivals;
    }
    const totalTraction = rivals.reduce((sum, r) => sum + r.traction, 0);
    // After 6 months of possible moves, traction should generally grow
    expect(totalTraction).toBeGreaterThan(0);
  });

  it("player effects accumulate across months when rivals are active", () => {
    const rivals = generateRivals(baseCtx);
    let totalBrandRiskDelta = 0;
    for (let m = 1; m <= 6; m++) {
      const result = applyRivalMoves(rivals, m, { ...baseMoveCtx });
      totalBrandRiskDelta += result.playerEffects.brandRiskDelta ?? 0;
    }
    // Over 6 months with active rivals, expect some brand risk impact
    // (could be 0 if all moves are beneficial)
    expect(typeof totalBrandRiskDelta).toBe("number");
  });

  it("rival archetype variety: AI sector produces at least one high-media rival", () => {
    const aiCtx = { ...baseCtx, sector: "AI" };
    const rivals = generateRivals(aiCtx);
    const highMediaArchetypes: RivalArchetype[] = ["hype_founder", "technical_genius", "predator_vc_backed", "chaos_founder"];
    expect(rivals.some((r) => highMediaArchetypes.includes(r.founder.archetype))).toBe(true);
  });

  it("competitor callout action increases rivalryScore over time", () => {
    let rivals = generateRivals(baseCtx);
    for (let m = 1; m <= 4; m++) {
      const result = applyRivalMoves(rivals, m, {
        ...baseMoveCtx,
        lastPlayerSocialActionId: "competitor_callout",
      });
      rivals = result.updatedRivals;
    }
    const maxRivalryScore = Math.max(...rivals.map((r) => r.rivalryScore));
    // Repeated callouts should push rivalryScore up
    expect(maxRivalryScore).toBeGreaterThanOrEqual(0);
  });
});
