import { describe, expect, it } from "vitest";
import {
  formatCareerMoney,
  getBadgeWallPresentation,
  getCareerEmptyStatePresentation,
  getCareerStatCards,
  getFounderLegacyHero,
  getNextChallengePresentation,
  getPlaystyleMasteryPresentation,
  getRivalLegacyPresentation,
  getRunArchivePresentation,
  getSectorMasteryPresentation,
} from "@/lib/game/career-scene";
import { BADGE_CATALOG } from "@/lib/career/badge-catalog";

describe("career scene presentation helpers", () => {
  it("maps founder title, rank, reputation, and XP safely", () => {
    const hero = getFounderLegacyHero({
      founderTitle: "Exit Artist",
      founderRank: "closer",
      reputationScore: 72,
      level: 5,
      xp: 250,
      xpForNextLevel: 500,
      nextRankLabel: "Veteran",
      nextRankRequirement: "Complete 10 startup runs",
      totalBreakouts: 0,
      totalAcquisitions: 2,
      rivalStats: { rivalsFaced: 3, rivalsDefeated: 1, rivalLosses: 1, mostDangerousRivalName: null, lastNemesisName: null },
    });
    expect(hero).toMatchObject({ title: "Exit Artist", rankLabel: "Closer", reputationScore: 72, xpProgress: 50 });
    expect(hero.identityStamp).toBe("Exit Artist");
  });

  it("formats career stat cards and handles zero values", () => {
    const cards = getCareerStatCards({
      totalStartups: 0,
      completedStartups: 0,
      deadStartups: 0,
      totalAcquisitions: 0,
      totalBreakouts: 0,
      bestScore: 0,
      bestValuation: 0,
      totalRevenueGenerated: 0,
      totalMonthsPlayed: 0,
      survivalRate: 0,
      bestMonthlyRevenue: 0,
      totalSurvived12: 0,
    });
    expect(cards.some((card) => card.label === "Runs Created" && card.value === "0")).toBe(true);
    expect(cards.some((card) => card.label === "Best Valuation" && card.value === "$0")).toBe(true);
  });

  it("separates unlocked and locked badges without fake unlocks", () => {
    const wall = getBadgeWallPresentation([
      {
        id: "first_run_completed",
        title: "First Run Completed",
        description: "Completed your first funded startup run.",
        icon: "✓",
        category: "milestone",
        rarity: "common",
        unlockedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    const unlocked = wall.filter((badge) => badge.unlocked);
    const locked = wall.filter((badge) => !badge.unlocked);
    expect(unlocked).toHaveLength(1);
    expect(locked.length).toBe(BADGE_CATALOG.length - 1);
    expect(locked.every((badge) => badge.unlocked === false)).toBe(true);
  });

  it("maps run archive outcomes to stamps and tones", () => {
    const runs = getRunArchivePresentation([
      {
        startupId: "run-1",
        startupName: "Acme AI",
        sector: "AI / ML",
        outcome: "BREAKOUT",
        score: 1200,
        valuation: 12_500_000,
        revenue: 600_000,
        monthsSurvived: 12,
        dominantPlaystyle: "product_led",
        rivalSummary: "Defeated one rival",
        completedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        startupId: "run-2",
        startupName: "BurnCo",
        sector: "Consumer",
        outcome: "DEAD",
        score: 100,
        valuation: 0,
        revenue: 0,
        monthsSurvived: 4,
        dominantPlaystyle: null,
        rivalSummary: null,
        completedAt: "2026-02-01T00:00:00.000Z",
      },
    ]);
    expect(runs[0]).toMatchObject({ stamp: "BREAKOUT", tone: "amber", playstyleLabel: "Product-Led" });
    expect(runs[1]).toMatchObject({ stamp: "DEAD", tone: "rose" });
  });

  it("maps playstyle mastery for empty and populated playstyles", () => {
    expect(getPlaystyleMasteryPresentation({})).toEqual([]);
    const entries = getPlaystyleMasteryPresentation({
      product_led: { playstyle: "product_led", timesDominant: 3, timesSecondary: 0, completedRuns: 2, failedRuns: 1, bestOutcome: "SEED_READY", bestScore: 900 },
      hype_machine: { playstyle: "hype_machine", timesDominant: 1, timesSecondary: 2, completedRuns: 1, failedRuns: 1, bestOutcome: null, bestScore: 200 },
    });
    expect(entries[0]).toMatchObject({ id: "product_led", status: "strong", tone: "amber" });
    expect(entries[1]).toMatchObject({ id: "hype_machine", status: "partial" });
  });

  it("maps sector mastery for empty and multiple sectors", () => {
    expect(getSectorMasteryPresentation({})).toEqual([]);
    const entries = getSectorMasteryPresentation({
      SaaS: { sector: "SaaS", startupsCreated: 2, completed: 2, failed: 0, bestOutcome: "SEED_READY", bestScore: 800, bestRevenue: 50_000, bestValuation: 4_000_000, breakoutCount: 0 },
      Fintech: { sector: "Fintech", startupsCreated: 1, completed: 0, failed: 1, bestOutcome: "DEAD", bestScore: 100, bestRevenue: 0, bestValuation: 0, breakoutCount: 0 },
    });
    expect(entries[0]).toMatchObject({ id: "SaaS", status: "partial", tone: "emerald" });
    expect(entries[1]).toMatchObject({ id: "Fintech", tone: "rose" });
  });

  it("uses the sector stat key when older career JSON lacks a sector field", () => {
    const entries = getSectorMasteryPresentation({
      SaaS: { startupsCreated: 2, completed: 1, failed: 0, bestOutcome: "SEED_READY", bestScore: 700, bestRevenue: 25_000, bestValuation: 2_000_000, breakoutCount: 0 } as never,
    });

    expect(entries[0]).toMatchObject({ id: "SaaS", label: "SaaS" });
  });

  it("handles rival legacy with and without stats", () => {
    expect(getRivalLegacyPresentation({ rivalsFaced: 0, rivalsDefeated: 0, rivalLosses: 0, mostDangerousRivalName: null, lastNemesisName: null })).toMatchObject({ winRate: 0, tone: "white" });
    expect(getRivalLegacyPresentation({ rivalsFaced: 5, rivalsDefeated: 4, rivalLosses: 1, mostDangerousRivalName: "Nemesis Labs", lastNemesisName: "Nemesis Labs" })).toMatchObject({ winRate: 80, tone: "emerald" });
  });

  it("returns next challenge and empty-state CTAs", () => {
    const next = getNextChallengePresentation("Try a harder market.");
    const empty = getCareerEmptyStatePresentation();
    expect(next.ctas.map((cta) => cta.href)).toContain("/market");
    expect(empty.ctas.map((cta) => cta.href)).toContain("/startup/new");
    expect(empty.description).toContain("Death still counts");
  });

  it("formats money without changing career math", () => {
    expect(formatCareerMoney(0)).toBe("$0");
    expect(formatCareerMoney(12_500)).toBe("$13K");
    expect(formatCareerMoney(2_500_000)).toBe("$2.5M");
  });
});
