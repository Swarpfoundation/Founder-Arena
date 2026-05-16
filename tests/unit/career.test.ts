import { describe, it, expect } from "vitest";
import {
  buildCareerUpdates,
  computeFounderRank,
  computeFounderTitle,
  computeReputationScore,
} from "@/lib/career/career-engine";
import { generateNextChallenge } from "@/lib/career/career-recommendations";
import { BADGE_CATALOG } from "@/lib/career/badge-catalog";
import type {
  CareerProfileSnapshot,
  CareerUpdateInput,
  PlaystyleCareerStat,
  FounderRankKey,
} from "@/lib/career/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeEmptySnapshot(overrides?: Partial<CareerProfileSnapshot>): CareerProfileSnapshot {
  return {
    completedStartups: 0,
    deadStartups: 0,
    totalStartups: 0,
    bestValuation: 0,
    bestScore: 0,
    reputationScore: 0,
    founderTitle: "Rookie Founder",
    founderRank: "rookie",
    totalMonthsPlayed: 0,
    totalRevenueGenerated: 0,
    bestMonthlyRevenue: 0,
    bestOutcome: null,
    bestStartupId: null,
    lastCompletedStartupId: null,
    totalAcquisitions: 0,
    totalBreakouts: 0,
    totalSeriesAReady: 0,
    totalSurvived12: 0,
    sectorStats: {},
    playstyleStats: {},
    rivalStats: {
      rivalsFaced: 0,
      rivalsDefeated: 0,
      rivalLosses: 0,
      mostDangerousRivalName: null,
      lastNemesisName: null,
    },
    legacyBadges: [],
    completedStartupIds: [],
    recentRuns: [],
    ...overrides,
  };
}

function makeInput(overrides?: Partial<CareerUpdateInput>): CareerUpdateInput {
  return {
    startupId: "startup-001",
    startupName: "TestCo",
    sector: "SaaS",
    outcome: "SEED_READY",
    score: 500,
    valuation: 2_000_000,
    revenue: 25_000,
    monthsSurvived: 10,
    isDead: false,
    isCompleted: true,
    dominantPlaystyle: "product_led",
    secondaryPlaystyle: null,
    rivalsFaced: 2,
    rivalsDefeated: 1,
    rivalLosses: 0,
    mostDangerousRivalName: "RivalCo",
    rivalSummary: "Faced 2 rivals, defeated 1",
    completedAt: new Date("2026-01-15"),
    ...overrides,
  };
}

// ─── computeFounderRank ───────────────────────────────────────────────────────

describe("computeFounderRank", () => {
  it("returns rookie with 0 completed", () => {
    expect(computeFounderRank(0, 0, 0, 0)).toBe("rookie");
  });
  it("returns builder at 3 completed", () => {
    expect(computeFounderRank(3, 5, 0, 0)).toBe("builder");
  });
  it("returns operator at 5 completed with 40%+ survival", () => {
    expect(computeFounderRank(5, 10, 0, 0)).toBe("operator");
  });
  it("returns closer when breakout >= 1", () => {
    expect(computeFounderRank(2, 4, 1, 0)).toBe("closer");
  });
  it("returns closer when acquisition >= 1", () => {
    expect(computeFounderRank(2, 4, 0, 1)).toBe("closer");
  });
  it("returns veteran at 10 completed", () => {
    expect(computeFounderRank(10, 15, 0, 0)).toBe("veteran");
  });
  it("returns arena_legend with 3 breakouts", () => {
    expect(computeFounderRank(8, 12, 3, 0)).toBe("arena_legend");
  });
  it("returns arena_legend with 2 acquisitions + 10 completed", () => {
    expect(computeFounderRank(10, 15, 0, 2)).toBe("arena_legend");
  });
  it("prioritizes arena_legend over veteran", () => {
    expect(computeFounderRank(12, 15, 3, 0)).toBe("arena_legend");
  });
});

// ─── computeFounderTitle ─────────────────────────────────────────────────────

describe("computeFounderTitle", () => {
  it("returns Rookie Founder with no history", () => {
    expect(computeFounderTitle("rookie", 0, 0, 0, {})).toBe("Rookie Founder");
  });
  it("returns Arena Legend at arena_legend rank", () => {
    expect(computeFounderTitle("arena_legend", 0, 0, 0, {})).toBe("Arena Legend");
  });
  it("returns Breakout Founder with 2+ breakouts", () => {
    expect(computeFounderTitle("veteran", 2, 0, 0, {})).toBe("Breakout Founder");
  });
  it("returns Exit Artist with 2+ acquisitions", () => {
    expect(computeFounderTitle("closer", 0, 2, 0, {})).toBe("Exit Artist");
  });
  it("returns Product Builder when product_led dominant 2+ times", () => {
    const ps: Record<string, PlaystyleCareerStat> = {
      product_led: { playstyle: "product_led", timesDominant: 2, timesSecondary: 0, completedRuns: 2, failedRuns: 0, bestOutcome: null, bestScore: 0 },
    };
    expect(computeFounderTitle("builder", 0, 0, 0, ps)).toBe("Product Builder");
  });
  it("returns Cockroach Founder when cockroach dominant 2+ times", () => {
    const ps: Record<string, PlaystyleCareerStat> = {
      cockroach: { playstyle: "cockroach", timesDominant: 3, timesSecondary: 0, completedRuns: 3, failedRuns: 0, bestOutcome: null, bestScore: 0 },
    };
    expect(computeFounderTitle("operator", 0, 0, 0, ps)).toBe("Cockroach Founder");
  });
  it("returns Hype Machine when hype_machine dominant 2+ times", () => {
    const ps: Record<string, PlaystyleCareerStat> = {
      hype_machine: { playstyle: "hype_machine", timesDominant: 2, timesSecondary: 0, completedRuns: 2, failedRuns: 0, bestOutcome: null, bestScore: 0 },
    };
    expect(computeFounderTitle("closer", 0, 0, 0, ps)).toBe("Hype Machine");
  });
  it("Breakout Founder overrides playstyle title", () => {
    const ps: Record<string, PlaystyleCareerStat> = {
      cockroach: { playstyle: "cockroach", timesDominant: 5, timesSecondary: 0, completedRuns: 5, failedRuns: 0, bestOutcome: null, bestScore: 0 },
    };
    expect(computeFounderTitle("veteran", 2, 0, 0, ps)).toBe("Breakout Founder");
  });
});

// ─── computeReputationScore ───────────────────────────────────────────────────

describe("computeReputationScore", () => {
  it("returns 0 with no runs", () => {
    expect(computeReputationScore(0, 0, 0, 0, 0, 0, {})).toBe(0);
  });
  it("increases with completed runs", () => {
    const a = computeReputationScore(1, 2, 0, 0, 0, 0, {});
    const b = computeReputationScore(3, 5, 0, 0, 0, 0, {});
    expect(b).toBeGreaterThan(a);
  });
  it("increases with breakouts", () => {
    const a = computeReputationScore(3, 5, 0, 0, 0, 0, {});
    const b = computeReputationScore(3, 5, 1, 0, 0, 0, {});
    expect(b).toBeGreaterThan(a);
  });
  it("increases with acquisitions", () => {
    const a = computeReputationScore(3, 5, 0, 0, 0, 0, {});
    const b = computeReputationScore(3, 5, 0, 0, 1, 0, {});
    expect(b).toBeGreaterThan(a);
  });
  it("is capped at 100", () => {
    const ps: Record<string, PlaystyleCareerStat> = {};
    for (const id of ["product_led", "hype_machine", "cockroach", "enterprise_sales", "technical_builder", "regulated_operator", "trust_builder"]) {
      ps[id] = { playstyle: id, timesDominant: 5, timesSecondary: 0, completedRuns: 5, failedRuns: 0, bestOutcome: "BREAKOUT", bestScore: 2000 };
    }
    const score = computeReputationScore(20, 25, 5, 5, 5, 5000, ps);
    expect(score).toBeLessThanOrEqual(100);
  });
  it("never goes below 0", () => {
    expect(computeReputationScore(0, 0, 0, 0, 0, 0, {})).toBeGreaterThanOrEqual(0);
  });
});

// ─── buildCareerUpdates — initial state ──────────────────────────────────────

describe("buildCareerUpdates — first run", () => {
  it("records completed run", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput();
    const result = buildCareerUpdates(snapshot, input);
    expect(result.lastCompletedStartupId).toBe("startup-001");
    expect(result.completedStartupIds).toContain("startup-001");
  });

  it("sets bestOutcome on first run", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput({ outcome: "SEED_READY" });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.bestOutcome).toBe("SEED_READY");
  });

  it("accumulates totalMonthsPlayed", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput({ monthsSurvived: 10 });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.totalMonthsPlayed).toBe(10);
  });

  it("accumulates totalRevenueGenerated", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput({ revenue: 25_000 });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.totalRevenueGenerated).toBe(25_000);
  });

  it("records sector stats", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput({ sector: "SaaS", outcome: "SEED_READY", score: 500 });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.sectorStats["SaaS"]).toBeDefined();
    expect(result.sectorStats["SaaS"].completed).toBe(1);
    expect(result.sectorStats["SaaS"].bestScore).toBe(500);
  });

  it("records playstyle stats for dominant", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput({ dominantPlaystyle: "product_led" });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.playstyleStats["product_led"]).toBeDefined();
    expect(result.playstyleStats["product_led"].timesDominant).toBe(1);
    expect(result.playstyleStats["product_led"].completedRuns).toBe(1);
  });

  it("records rival stats", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput({ rivalsFaced: 3, rivalsDefeated: 2 });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.rivalStats.rivalsFaced).toBe(3);
    expect(result.rivalStats.rivalsDefeated).toBe(2);
  });

  it("adds run to recentRuns", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput();
    const result = buildCareerUpdates(snapshot, input);
    expect(result.recentRuns).toHaveLength(1);
    expect(result.recentRuns[0].startupId).toBe("startup-001");
  });
});

// ─── buildCareerUpdates — dead run ───────────────────────────────────────────

describe("buildCareerUpdates — dead run", () => {
  it("records dead run in sector stats", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 0, deadStartups: 1, totalStartups: 1 });
    const input = makeInput({ isDead: true, isCompleted: false, outcome: "DEAD", score: 100 });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.sectorStats["SaaS"].failed).toBe(1);
    expect(result.sectorStats["SaaS"].completed).toBe(0);
  });

  it("records dead run in playstyle stats as failedRuns", () => {
    const snapshot = makeEmptySnapshot({ deadStartups: 1, totalStartups: 1 });
    const input = makeInput({ isDead: true, isCompleted: false, outcome: "DEAD" });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.playstyleStats["product_led"]?.failedRuns).toBe(1);
  });

  it("unlocks first_death badge on first dead run", () => {
    const snapshot = makeEmptySnapshot({ deadStartups: 1, totalStartups: 1 });
    const input = makeInput({ isDead: true, isCompleted: false, outcome: "DEAD" });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.newBadges.some((b) => b.id === "first_death")).toBe(true);
  });
});

// ─── buildCareerUpdates — acquisition ────────────────────────────────────────

describe("buildCareerUpdates — acquisition run", () => {
  it("increments totalAcquisitions", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput({ outcome: "ACQUISITION_TARGET" });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.totalAcquisitions).toBe(1);
  });

  it("unlocks first_acquisition badge", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput({ outcome: "ACQUISITION_TARGET" });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.newBadges.some((b) => b.id === "first_acquisition")).toBe(true);
  });

  it("unlocks exit_artist badge at 2 acquisitions", () => {
    const snapshot = makeEmptySnapshot({
      completedStartups: 2,
      totalStartups: 2,
      totalAcquisitions: 1,
      completedStartupIds: ["startup-000"],
    });
    const input = makeInput({ startupId: "startup-002", outcome: "ACQUISITION_TARGET" });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.totalAcquisitions).toBe(2);
    expect(result.newBadges.some((b) => b.id === "exit_artist")).toBe(true);
  });
});

// ─── buildCareerUpdates — breakout ───────────────────────────────────────────

describe("buildCareerUpdates — breakout run", () => {
  it("increments totalBreakouts", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput({ outcome: "BREAKOUT" });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.totalBreakouts).toBe(1);
  });

  it("unlocks first_breakout badge", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput({ outcome: "BREAKOUT" });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.newBadges.some((b) => b.id === "first_breakout")).toBe(true);
  });

  it("BREAKOUT is better outcome than SEED_READY", () => {
    const snapshot = makeEmptySnapshot({
      completedStartups: 1,
      totalStartups: 1,
      bestOutcome: "SEED_READY",
      bestStartupId: "startup-000",
    });
    const input = makeInput({ startupId: "startup-001", outcome: "BREAKOUT" });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.bestOutcome).toBe("BREAKOUT");
    expect(result.bestStartupId).toBe("startup-001");
  });

  it("SEED_READY does NOT overwrite BREAKOUT", () => {
    const snapshot = makeEmptySnapshot({
      completedStartups: 2,
      totalStartups: 2,
      bestOutcome: "BREAKOUT",
      bestStartupId: "startup-000",
      completedStartupIds: ["startup-000"],
    });
    const input = makeInput({ startupId: "startup-001", outcome: "SEED_READY" });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.bestOutcome).toBe("BREAKOUT");
    expect(result.bestStartupId).toBe("startup-000");
  });
});

// ─── buildCareerUpdates — idempotency ────────────────────────────────────────

describe("buildCareerUpdates — idempotency", () => {
  it("does NOT double-count same startup", () => {
    const snapshot = makeEmptySnapshot({
      completedStartups: 1,
      totalStartups: 1,
      completedStartupIds: ["startup-001"],
      totalMonthsPlayed: 10,
    });
    const input = makeInput({ startupId: "startup-001", monthsSurvived: 10 });
    const result = buildCareerUpdates(snapshot, input);
    // totalMonthsPlayed should NOT be incremented again
    expect(result.totalMonthsPlayed).toBe(10);
  });

  it("adds different startup IDs separately", () => {
    const snapshot = makeEmptySnapshot({
      completedStartups: 1,
      totalStartups: 1,
      completedStartupIds: ["startup-001"],
      totalMonthsPlayed: 10,
    });
    const input = makeInput({ startupId: "startup-002", monthsSurvived: 8 });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.totalMonthsPlayed).toBe(18);
    expect(result.completedStartupIds).toContain("startup-002");
  });
});

// ─── buildCareerUpdates — survived 12 months ─────────────────────────────────

describe("buildCareerUpdates — survival", () => {
  it("increments totalSurvived12 when monthsSurvived >= 12", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput({ monthsSurvived: 12 });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.totalSurvived12).toBe(1);
  });

  it("does NOT increment totalSurvived12 when monthsSurvived < 12", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput({ monthsSurvived: 8 });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.totalSurvived12).toBe(0);
  });

  it("unlocks iron_will badge at first 12-month survival", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput({ monthsSurvived: 12 });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.newBadges.some((b) => b.id === "iron_will")).toBe(true);
  });
});

// ─── buildCareerUpdates — sector accumulation ────────────────────────────────

describe("buildCareerUpdates — sector stats accumulation", () => {
  it("accumulates across multiple runs in same sector", () => {
    const snapshot = makeEmptySnapshot({
      completedStartups: 1,
      totalStartups: 1,
      completedStartupIds: ["startup-001"],
      sectorStats: {
        SaaS: { sector: "SaaS", startupsCreated: 1, completed: 1, failed: 0, bestOutcome: "SEED_READY", bestScore: 300, bestRevenue: 20000, bestValuation: 1500000, breakoutCount: 0 },
      },
    });
    const input = makeInput({ startupId: "startup-002", sector: "SaaS", outcome: "SERIES_A_READY", score: 700 });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.sectorStats["SaaS"].completed).toBe(2);
    expect(result.sectorStats["SaaS"].bestScore).toBe(700);
    expect(result.sectorStats["SaaS"].bestOutcome).toBe("SERIES_A_READY");
  });

  it("tracks different sectors separately", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput({ sector: "Fintech" });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.sectorStats["Fintech"]).toBeDefined();
    expect(result.sectorStats["SaaS"]).toBeUndefined();
  });
});

// ─── buildCareerUpdates — rank and title ─────────────────────────────────────

describe("buildCareerUpdates — rank and title changes", () => {
  it("advances rank from rookie to builder at 3 completed", () => {
    // completedStartups already incremented by updateFounderStatsAfterFinalization
    const snapshot = makeEmptySnapshot({ completedStartups: 3, totalStartups: 5 });
    const input = makeInput();
    const result = buildCareerUpdates(snapshot, input);
    expect(result.founderRank).toBe("builder");
    expect(result.rankAdvanced).toBe(true);
  });

  it("advances to closer on first breakout", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 2, totalStartups: 3 });
    const input = makeInput({ outcome: "BREAKOUT" });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.founderRank).toBe("closer");
  });

  it("titleChanged is true when title changes", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 3, totalStartups: 5, founderTitle: "Rookie Founder", founderRank: "rookie" });
    const input = makeInput();
    const result = buildCareerUpdates(snapshot, input);
    expect(result.titleChanged).toBe(true);
  });
});

// ─── buildCareerUpdates — recent runs ────────────────────────────────────────

describe("buildCareerUpdates — recent runs", () => {
  it("stores run data in recentRuns", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput({ startupName: "AcmeCo", sector: "Fintech" });
    const result = buildCareerUpdates(snapshot, input);
    const run = result.recentRuns[result.recentRuns.length - 1];
    expect(run.startupName).toBe("AcmeCo");
    expect(run.sector).toBe("Fintech");
  });

  it("caps recentRuns at 10", () => {
    const existingRuns = Array.from({ length: 10 }, (_, i) => ({
      startupId: `old-${i}`,
      startupName: `OldCo ${i}`,
      sector: "SaaS",
      outcome: "DEAD",
      score: 100,
      valuation: 500_000,
      revenue: 5_000,
      monthsSurvived: 5,
      dominantPlaystyle: null,
      rivalSummary: null,
      completedAt: new Date().toISOString(),
    }));
    const snapshot = makeEmptySnapshot({
      completedStartups: 10,
      totalStartups: 10,
      recentRuns: existingRuns,
      completedStartupIds: existingRuns.map((r) => r.startupId),
    });
    const input = makeInput({ startupId: "startup-new" });
    const result = buildCareerUpdates(snapshot, input);
    expect(result.recentRuns).toHaveLength(10);
    // last entry should be the new run
    expect(result.recentRuns[result.recentRuns.length - 1].startupId).toBe("startup-new");
  });
});

// ─── Badge catalog ────────────────────────────────────────────────────────────

describe("badge catalog", () => {
  it("has at least 12 badges", () => {
    expect(BADGE_CATALOG.length).toBeGreaterThanOrEqual(12);
  });

  it("all badges have required fields", () => {
    for (const badge of BADGE_CATALOG) {
      expect(badge.id).toBeTruthy();
      expect(badge.title).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(badge.icon).toBeTruthy();
      expect(["common", "rare", "legendary"]).toContain(badge.rarity);
      expect(badge.requirement).toBeTruthy();
    }
  });

  it("badge IDs are unique", () => {
    const ids = BADGE_CATALOG.map((b) => b.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("does not unlock badges already unlocked (no double-unlock)", () => {
    const snapshot = makeEmptySnapshot({
      completedStartups: 1,
      totalStartups: 1,
      legacyBadges: [{
        id: "first_run_completed",
        title: "First Run Completed",
        description: "done",
        icon: "✓",
        category: "milestone",
        rarity: "common",
        unlockedAt: new Date().toISOString(),
      }],
    });
    const input = makeInput();
    const result = buildCareerUpdates(snapshot, input);
    const allFirstRun = result.newBadges.filter((b) => b.id === "first_run_completed");
    expect(allFirstRun).toHaveLength(0);
  });

  it("unlocks first_run_completed on first completed run", () => {
    const snapshot = makeEmptySnapshot({ completedStartups: 1, totalStartups: 1 });
    const input = makeInput();
    const result = buildCareerUpdates(snapshot, input);
    expect(result.newBadges.some((b) => b.id === "first_run_completed")).toBe(true);
  });

  it("unlocks serial_founder after 5 completed runs", () => {
    const snapshot = makeEmptySnapshot({
      completedStartups: 5,
      totalStartups: 7,
      completedStartupIds: ["a", "b", "c", "d", "startup-000"],
    });
    const input = makeInput({ startupId: "startup-new" });
    // completedStartups is already 5 (from updateFounderStatsAfterFinalization)
    const result = buildCareerUpdates(snapshot, input);
    expect(result.newBadges.some((b) => b.id === "serial_founder")).toBe(true);
  });
});

// ─── generateNextChallenge ────────────────────────────────────────────────────

describe("generateNextChallenge", () => {
  it("returns a non-empty string for empty profile", () => {
    const snap = makeEmptySnapshot();
    expect(generateNextChallenge(snap).length).toBeGreaterThan(10);
  });

  it("suggests first startup for brand-new profile", () => {
    const snap = makeEmptySnapshot();
    const result = generateNextChallenge(snap);
    expect(result).toContain("first startup");
  });

  it("suggests surviving 12 months if never done", () => {
    const snap = makeEmptySnapshot({ completedStartups: 2, totalStartups: 3 });
    const result = generateNextChallenge(snap);
    expect(result.toLowerCase()).toContain("12");
  });

  it("suggests rival defeats if never defeated one", () => {
    const snap = makeEmptySnapshot({
      completedStartups: 3,
      totalStartups: 4,
      totalSurvived12: 1,
    });
    const result = generateNextChallenge(snap);
    expect(result.toLowerCase()).toContain("rival");
  });

  it("returns a deterministic result for same input", () => {
    const snap = makeEmptySnapshot({ completedStartups: 2, totalStartups: 3 });
    expect(generateNextChallenge(snap)).toBe(generateNextChallenge(snap));
  });
});
