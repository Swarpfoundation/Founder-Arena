import { describe, it, expect } from "vitest";
import {
  BETA_SEASON_1,
  getCurrentSeason,
  getSeasonBySlug,
  calculateChallengeProgress,
} from "@/lib/seasons/season-catalog";
import { generatePublicArenaFeed } from "@/lib/seasons/arena-public-feed";
import type { LeaderboardEntryDisplay } from "@/lib/seasons/types";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<LeaderboardEntryDisplay> = {}): LeaderboardEntryDisplay {
  return {
    id: "entry-1",
    rank: 1,
    startupId: "startup-abc",
    startupName: "QuantumLeap",
    founderName: "Alice",
    sector: "AI",
    score: 8500,
    valuation: 5000000,
    revenue: 45000,
    survivalMonths: 12,
    outcome: "BREAKOUT",
    publicSlug: "quantumleap-abc123",
    dominantPlaystyle: "product-visionary",
    founderTitle: "Legendary Founder",
    completedAt: new Date("2026-05-01"),
    ...overrides,
  };
}

const baseProgressInput = {
  productProgress: 90,
  survivalMonths: 12,
  rivalsDefeated: 3,
  boardroomEventsResolved: 4,
  socialTrust: 80,
  revenue: 50000,
  score: 9000,
  outcome: "BREAKOUT",
};

// ─── ArenaSeason constants ─────────────────────────────────────────────────────

describe("BETA_SEASON_1", () => {
  it("has correct slug", () => {
    expect(BETA_SEASON_1.slug).toBe("beta-season-1");
  });

  it("has active status", () => {
    expect(BETA_SEASON_1.status).toBe("active");
  });

  it("has exactly 5 challenges", () => {
    expect(BETA_SEASON_1.challenges).toHaveLength(5);
  });

  it("has expected challenge IDs", () => {
    const ids = BETA_SEASON_1.challenges.map((c) => c.id);
    expect(ids).toContain("product_led_breakout");
    expect(ids).toContain("cockroach_survival");
    expect(ids).toContain("rival_killer");
    expect(ids).toContain("boardroom_survivor");
    expect(ids).toContain("trust_moat");
  });

  it("each challenge has badge, reward, description, category", () => {
    for (const ch of BETA_SEASON_1.challenges) {
      expect(ch.badge).toBeTruthy();
      expect(ch.reward).toBeTruthy();
      expect(ch.description.length).toBeGreaterThan(10);
      expect(["product", "survival", "rivalry", "boardroom", "community"]).toContain(ch.category);
    }
  });
});

// ─── getCurrentSeason / getSeasonBySlug ────────────────────────────────────────

describe("getCurrentSeason", () => {
  it("returns BETA_SEASON_1", () => {
    const s = getCurrentSeason();
    expect(s.slug).toBe("beta-season-1");
  });
});

describe("getSeasonBySlug", () => {
  it("returns season for known slug", () => {
    const s = getSeasonBySlug("beta-season-1");
    expect(s).toBeDefined();
    expect(s?.name).toBe("Beta Season 1");
  });

  it("returns undefined for unknown slug", () => {
    expect(getSeasonBySlug("unknown-season-99")).toBeUndefined();
  });
});

// ─── calculateChallengeProgress ───────────────────────────────────────────────

describe("calculateChallengeProgress", () => {
  it("marks all challenges completed with perfect input", () => {
    const progress = calculateChallengeProgress(BETA_SEASON_1.challenges, baseProgressInput);
    expect(progress).toHaveLength(5);
    for (const p of progress) {
      expect(p.completed).toBe(true);
      expect(p.pct).toBe(100);
    }
  });

  it("product_led_breakout: incomplete at 70% product progress", () => {
    const progress = calculateChallengeProgress(BETA_SEASON_1.challenges, {
      ...baseProgressInput,
      productProgress: 70,
    });
    const p = progress.find((x) => x.challenge.id === "product_led_breakout")!;
    expect(p.completed).toBe(false);
    expect(p.pct).toBe(88); // 70/80 = 87.5 → rounds to 88
  });

  it("product_led_breakout: complete at exactly 80% product progress", () => {
    const progress = calculateChallengeProgress(BETA_SEASON_1.challenges, {
      ...baseProgressInput,
      productProgress: 80,
    });
    const p = progress.find((x) => x.challenge.id === "product_led_breakout")!;
    expect(p.completed).toBe(true);
  });

  it("cockroach_survival: incomplete at 10 months", () => {
    const progress = calculateChallengeProgress(BETA_SEASON_1.challenges, {
      ...baseProgressInput,
      survivalMonths: 10,
    });
    const p = progress.find((x) => x.challenge.id === "cockroach_survival")!;
    expect(p.completed).toBe(false);
    expect(p.current).toBe(10);
    expect(p.target).toBe(12);
  });

  it("cockroach_survival: complete at 12 months", () => {
    const progress = calculateChallengeProgress(BETA_SEASON_1.challenges, {
      ...baseProgressInput,
      survivalMonths: 12,
    });
    const p = progress.find((x) => x.challenge.id === "cockroach_survival")!;
    expect(p.completed).toBe(true);
    expect(p.pct).toBe(100);
  });

  it("rival_killer: requires 2 rivals defeated", () => {
    const p1 = calculateChallengeProgress(BETA_SEASON_1.challenges, {
      ...baseProgressInput,
      rivalsDefeated: 1,
    }).find((x) => x.challenge.id === "rival_killer")!;
    expect(p1.completed).toBe(false);
    expect(p1.pct).toBe(50);

    const p2 = calculateChallengeProgress(BETA_SEASON_1.challenges, {
      ...baseProgressInput,
      rivalsDefeated: 2,
    }).find((x) => x.challenge.id === "rival_killer")!;
    expect(p2.completed).toBe(true);
  });

  it("boardroom_survivor: requires 3 events resolved", () => {
    const p1 = calculateChallengeProgress(BETA_SEASON_1.challenges, {
      ...baseProgressInput,
      boardroomEventsResolved: 2,
    }).find((x) => x.challenge.id === "boardroom_survivor")!;
    expect(p1.completed).toBe(false);

    const p2 = calculateChallengeProgress(BETA_SEASON_1.challenges, {
      ...baseProgressInput,
      boardroomEventsResolved: 3,
    }).find((x) => x.challenge.id === "boardroom_survivor")!;
    expect(p2.completed).toBe(true);
  });

  it("trust_moat: requires social trust >= 75", () => {
    const p1 = calculateChallengeProgress(BETA_SEASON_1.challenges, {
      ...baseProgressInput,
      socialTrust: 74,
    }).find((x) => x.challenge.id === "trust_moat")!;
    expect(p1.completed).toBe(false);

    const p2 = calculateChallengeProgress(BETA_SEASON_1.challenges, {
      ...baseProgressInput,
      socialTrust: 75,
    }).find((x) => x.challenge.id === "trust_moat")!;
    expect(p2.completed).toBe(true);
  });

  it("pct is clamped to 100 when overshooting", () => {
    const progress = calculateChallengeProgress(BETA_SEASON_1.challenges, {
      ...baseProgressInput,
      productProgress: 200,
      survivalMonths: 24,
      rivalsDefeated: 99,
      boardroomEventsResolved: 99,
      socialTrust: 100,
    });
    for (const p of progress) {
      expect(p.pct).toBeLessThanOrEqual(100);
    }
  });

  it("all zeros: nothing completed, pct all 0", () => {
    const progress = calculateChallengeProgress(BETA_SEASON_1.challenges, {
      productProgress: 0,
      survivalMonths: 0,
      rivalsDefeated: 0,
      boardroomEventsResolved: 0,
      socialTrust: 0,
      revenue: 0,
      score: 0,
      outcome: null,
    });
    for (const p of progress) {
      expect(p.completed).toBe(false);
      expect(p.pct).toBe(0);
    }
  });
});

// ─── generatePublicArenaFeed ───────────────────────────────────────────────────

describe("generatePublicArenaFeed", () => {
  it("returns empty array for empty entries", () => {
    expect(generatePublicArenaFeed([])).toHaveLength(0);
  });

  it("caps at maxItems", () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      makeEntry({ rank: i + 1, startupId: `s-${i}`, startupName: `Startup${i}` })
    );
    expect(generatePublicArenaFeed(entries, 5)).toHaveLength(5);
  });

  it("top-3 entries use leaderboard_move category", () => {
    const entries = [
      makeEntry({ rank: 1, startupId: "s1" }),
      makeEntry({ rank: 2, startupId: "s2" }),
      makeEntry({ rank: 3, startupId: "s3" }),
    ];
    const feed = generatePublicArenaFeed(entries, 10);
    expect(feed[0].category).toBe("leaderboard_move");
    expect(feed[1].category).toBe("leaderboard_move");
    expect(feed[2].category).toBe("leaderboard_move");
  });

  it("BREAKOUT outcome triggers outcome_achieved category", () => {
    const entries = [
      makeEntry({ rank: 5, outcome: "BREAKOUT", startupId: "s-b" }),
    ];
    const feed = generatePublicArenaFeed(entries, 5);
    expect(feed[0].category).toBe("outcome_achieved");
  });

  it("12-month survival triggers season_milestone when no special outcome", () => {
    const entries = [
      makeEntry({ rank: 5, outcome: null, survivalMonths: 12, startupId: "s-c" }),
    ];
    const feed = generatePublicArenaFeed(entries, 5);
    expect(feed[0].category).toBe("season_milestone");
  });

  it("each feed item has required fields", () => {
    const entries = [makeEntry({ rank: 1, startupId: "s-x" })];
    const feed = generatePublicArenaFeed(entries, 5);
    const item = feed[0];
    expect(item.id).toBeTruthy();
    expect(item.title).toBeTruthy();
    expect(item.body).toBeTruthy();
    expect(item.startupName).toBe("QuantumLeap");
    expect(item.founderName).toBe("Alice");
    expect(item.sector).toBe("AI");
    expect(item.score).toBe(8500);
    expect(item.rank).toBe(1);
    expect(item.generatedAt).toBeTruthy();
  });

  it("feed item IDs are unique across entries", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ rank: i + 1, startupId: `s-${i + 1}` })
    );
    const feed = generatePublicArenaFeed(entries, 10);
    const ids = feed.map((f) => f.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("is deterministic — same entries produce same feed", () => {
    const entries = [
      makeEntry({ rank: 1, startupId: "abc" }),
      makeEntry({ rank: 2, startupId: "def" }),
    ];
    const feed1 = generatePublicArenaFeed(entries, 5);
    const feed2 = generatePublicArenaFeed(entries, 5);
    expect(feed1[0].body).toBe(feed2[0].body);
    expect(feed1[1].body).toBe(feed2[1].body);
  });
});
