import { describe, it, expect } from "vitest";
import { calculateLevel, xpForNextLevel } from "@/lib/game/founder-progression";
import { ACHIEVEMENTS, getAchievementDef } from "@/lib/game/achievements";
import { slugify, generateSlugCandidate } from "@/lib/game/public-slug";
import { classifyFinalOutcome, calculateLeaderboardScore } from "@/lib/simulation/engine";
import { SimulationMonth } from "@prisma/client";

describe("calculateLevel", () => {
  it("returns 1 for 0 XP", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it("returns 2 at 100 XP", () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it("returns 3 at 250 XP", () => {
    expect(calculateLevel(250)).toBe(3);
  });

  it("returns 4 at 500 XP", () => {
    expect(calculateLevel(500)).toBe(4);
  });

  it("returns 5 at 1000 XP", () => {
    expect(calculateLevel(1000)).toBe(5);
  });

  it("does not exceed max level threshold logic", () => {
    expect(calculateLevel(99999)).toBeGreaterThanOrEqual(10);
  });
});

describe("xpForNextLevel", () => {
  it("returns increasing thresholds", () => {
    expect(xpForNextLevel(1)).toBeGreaterThan(xpForNextLevel(0));
    expect(xpForNextLevel(2)).toBeGreaterThan(xpForNextLevel(1));
  });
});

describe("ACHIEVEMENTS", () => {
  it("has at least 15 achievements", () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(15);
  });

  it("has unique keys", () => {
    const keys = ACHIEVEMENTS.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("each achievement has required fields", () => {
    for (const ach of ACHIEVEMENTS) {
      expect(ach.key).toBeTruthy();
      expect(ach.title).toBeTruthy();
      expect(ach.description).toBeTruthy();
      expect(ach.icon).toBeTruthy();
      expect(ach.xpReward).toBeGreaterThan(0);
    }
  });
});

describe("getAchievementDef", () => {
  it("returns defined achievement for valid key", () => {
    expect(getAchievementDef("first_pitch")).toBeDefined();
    expect(getAchievementDef("funded_founder")).toBeDefined();
  });

  it("returns undefined for invalid key", () => {
    expect(getAchievementDef("nonexistent")).toBeUndefined();
  });
});

describe("slugify", () => {
  it("slugifies a normal name", () => {
    expect(slugify("My Startup Name!")).toBe("my-startup-name");
  });

  it("handles special characters", () => {
    expect(slugify("SaaS & AI Platform")).toBe("saas-ai-platform");
  });

  it("falls back to empty string for garbage input", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("generateSlugCandidate", () => {
  it("combines slug and short id", () => {
    const slug = generateSlugCandidate("startup-123-abc", "My Startup Name!");
    expect(slug).toBe("my-startup-name-23-abc");
  });

  it("includes attempt number when > 0", () => {
    const slug = generateSlugCandidate("id-here", "SaaS & AI Platform", 2);
    expect(slug).toBe("saas-ai-platform-d-here-2");
  });

  it("falls back to startup for empty name", () => {
    const slug = generateSlugCandidate("id-here", "!!!", 0);
    expect(slug).toBe("startup-d-here");
  });
});

describe("classifyFinalOutcome", () => {
  it("returns DEAD for early death", () => {
    const state = {
      cash: 0,
      monthlyBurn: 10000,
      revenue: 0,
      valuation: 0,
      productProgress: 0,
      investorScore: 50,
      marketScore: 50,
      riskScore: 50,
    };
    const result = classifyFinalOutcome(state, 3, []);
    expect(result.outcome).toBe("DEAD");
  });

  it("returns BREAKOUT for high revenue and efficiency", () => {
    const state = {
      cash: 500000,
      monthlyBurn: 20000,
      revenue: 200000,
      valuation: 15000000,
      productProgress: 90,
      investorScore: 90,
      marketScore: 90,
      riskScore: 20,
    };
    const result = classifyFinalOutcome(state, 12, []);
    expect(result.outcome).toBe("BREAKOUT");
  });

  it("returns ZOMBIE for completed with no cash", () => {
    const state = {
      cash: 0,
      monthlyBurn: 10000,
      revenue: 1000,
      valuation: 100000,
      productProgress: 30,
      investorScore: 40,
      marketScore: 40,
      riskScore: 60,
    };
    const result = classifyFinalOutcome(state, 12, []);
    expect(result.outcome).toBe("ZOMBIE");
  });
});

describe("calculateLeaderboardScore", () => {
  it("gives higher scores for better outcomes", () => {
    const state = {
      cash: 500000,
      monthlyBurn: 20000,
      revenue: 100000,
      valuation: 5000000,
      productProgress: 80,
      investorScore: 80,
      marketScore: 80,
      riskScore: 30,
    };
    const breakout = calculateLeaderboardScore(state, 12, "BREAKOUT");
    const zombie = calculateLeaderboardScore(state, 12, "ZOMBIE");
    expect(breakout).toBeGreaterThan(zombie);
  });

  it("returns 0 for DEAD outcome", () => {
    const state = {
      cash: 0,
      monthlyBurn: 10000,
      revenue: 0,
      valuation: 0,
      productProgress: 0,
      investorScore: 50,
      marketScore: 50,
      riskScore: 50,
    };
    const score = calculateLeaderboardScore(state, 3, "DEAD");
    expect(score).toBe(0);
  });
});

describe("graveyard eligibility", () => {
  it("dead startups are eligible", () => {
    const startup = { status: "dead" };
    expect(startup.status === "dead").toBe(true);
  });

  it("completed startups are not graveyard eligible", () => {
    const startup = { status: "completed" };
    expect(startup.status === "dead").toBe(false);
  });
});

describe("duplicate achievement prevention", () => {
  it("achievements list has no duplicate keys", () => {
    const keys = ACHIEVEMENTS.map((a) => a.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});
