import { describe, it, expect } from "vitest";
import {
  applyActionToMetrics,
  applyMonthlyDecay,
  applyPassiveBrandRiskRules,
  checkActionAvailability,
  deriveSocialSimModifiers,
} from "@/lib/social/metrics-engine";
import { getSocialActionById, SOCIAL_ACTION_CATALOG } from "@/lib/social/social-actions";
import { generatePostContent } from "@/lib/social/post-content";
import {
  generateActionFeedItems,
  generateMonthlyPassiveFeedItems,
} from "@/lib/social/feed-generator";
import {
  DEFAULT_SOCIAL_METRICS,
  SocialContext,
  SocialMetrics,
} from "@/lib/social/types";

const baseMetrics: SocialMetrics = { ...DEFAULT_SOCIAL_METRICS };

const baseCtx: SocialContext = {
  startupId: "startup-test-001",
  startupName: "TestCo",
  sector: "SaaS",
  month: 3,
  productProgress: 60,
  revenue: 15000,
  investorScore: 55,
  riskScore: 40,
  status: "active",
  founderName: "Alex Founder",
};

// ─── DEFAULT_SOCIAL_METRICS ───────────────────────────────────────────────────

describe("DEFAULT_SOCIAL_METRICS", () => {
  it("has expected defaults", () => {
    expect(DEFAULT_SOCIAL_METRICS.followers).toBe(0);
    expect(DEFAULT_SOCIAL_METRICS.hype).toBe(20);
    expect(DEFAULT_SOCIAL_METRICS.trust).toBe(50);
    expect(DEFAULT_SOCIAL_METRICS.brandRisk).toBe(0);
    expect(DEFAULT_SOCIAL_METRICS.viralMomentum).toBe(0);
  });

  it("all non-follower values are within 0-100", () => {
    for (const [k, v] of Object.entries(DEFAULT_SOCIAL_METRICS)) {
      if (k === "followers") continue;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

// ─── Action catalog ───────────────────────────────────────────────────────────

describe("SOCIAL_ACTION_CATALOG", () => {
  it("has 10 actions", () => {
    expect(SOCIAL_ACTION_CATALOG.length).toBe(10);
  });

  it("every action has required fields", () => {
    for (const a of SOCIAL_ACTION_CATALOG) {
      expect(a.id).toBeTruthy();
      expect(a.title).toBeTruthy();
      expect(a.description).toBeTruthy();
      expect(a.channel).toBeTruthy();
      expect(a.channelLabel).toBeTruthy();
      expect(a.cost).toBeGreaterThanOrEqual(0);
      expect(["low", "medium", "high"]).toContain(a.riskLevel);
      expect(Array.isArray(a.tags)).toBe(true);
    }
  });

  it("getSocialActionById returns correct action", () => {
    const a = getSocialActionById("founder_x_thread");
    expect(a).toBeDefined();
    expect(a!.id).toBe("founder_x_thread");
  });

  it("getSocialActionById returns undefined for unknown id", () => {
    expect(getSocialActionById("does_not_exist")).toBeUndefined();
  });

  it("crisis_response requires brandRisk >= 40", () => {
    const crisis = getSocialActionById("crisis_response")!;
    expect(crisis.requiredBrandRiskAbove).toBe(40);
  });

  it("launch_announcement requires productProgress >= 50", () => {
    const launch = getSocialActionById("launch_announcement")!;
    expect(launch.requiredProductProgress).toBe(50);
  });

  it("customer_testimonial requires revenue >= 5000", () => {
    const ct = getSocialActionById("customer_testimonial")!;
    expect(ct.requiredMinRevenue).toBe(5000);
  });
});

// ─── applyActionToMetrics ────────────────────────────────────────────────────

describe("applyActionToMetrics", () => {
  it("founder_x_thread increases hype and followers", () => {
    const action = getSocialActionById("founder_x_thread")!;
    const { updatedMetrics } = applyActionToMetrics(baseMetrics, action, baseCtx);
    expect(updatedMetrics.hype).toBeGreaterThan(baseMetrics.hype);
    expect(updatedMetrics.followers).toBeGreaterThan(baseMetrics.followers);
  });

  it("instagram_bts increases trust", () => {
    const action = getSocialActionById("instagram_bts")!;
    const { updatedMetrics } = applyActionToMetrics(baseMetrics, action, baseCtx);
    expect(updatedMetrics.trust).toBeGreaterThan(baseMetrics.trust);
  });

  it("crisis_response reduces brandRisk", () => {
    const crisis = getSocialActionById("crisis_response")!;
    const highRiskMetrics: SocialMetrics = { ...baseMetrics, brandRisk: 65 };
    const { updatedMetrics } = applyActionToMetrics(highRiskMetrics, crisis, baseCtx);
    expect(updatedMetrics.brandRisk).toBeLessThan(highRiskMetrics.brandRisk);
  });

  it("all output metrics stay within 0-100", () => {
    for (const action of SOCIAL_ACTION_CATALOG) {
      const { updatedMetrics } = applyActionToMetrics(baseMetrics, action, baseCtx);
      for (const [k, v] of Object.entries(updatedMetrics)) {
        if (k === "followers") continue;
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });

  it("launch announcement backfires when product < 70", () => {
    const launch = getSocialActionById("launch_announcement")!;
    const lowCtx: SocialContext = { ...baseCtx, productProgress: 55 };
    const { updatedMetrics, didBackfire } = applyActionToMetrics(baseMetrics, launch, lowCtx);
    expect(didBackfire).toBe(true);
    expect(updatedMetrics.brandRisk).toBeGreaterThan(baseMetrics.brandRisk);
    expect(updatedMetrics.trust).toBeLessThan(baseMetrics.trust);
  });

  it("launch announcement does NOT backfire when product >= 70", () => {
    const launch = getSocialActionById("launch_announcement")!;
    const strongCtx: SocialContext = { ...baseCtx, productProgress: 75 };
    const { didBackfire } = applyActionToMetrics(baseMetrics, launch, strongCtx);
    expect(didBackfire).toBe(false);
  });

  it("competitor_callout backfires when brandRisk >= 50", () => {
    const callout = getSocialActionById("competitor_callout")!;
    const highRisk: SocialMetrics = { ...baseMetrics, brandRisk: 55 };
    const { didBackfire, updatedMetrics } = applyActionToMetrics(highRisk, callout, baseCtx);
    expect(didBackfire).toBe(true);
    expect(updatedMetrics.brandRisk).toBeGreaterThan(highRisk.brandRisk);
  });

  it("founder_transparency_post increases trust", () => {
    const tp = getSocialActionById("founder_transparency_post")!;
    const { updatedMetrics } = applyActionToMetrics(baseMetrics, tp, baseCtx);
    expect(updatedMetrics.trust).toBeGreaterThan(baseMetrics.trust);
  });

  it("result is deterministic for same inputs", () => {
    const action = getSocialActionById("product_demo_tiktok")!;
    const r1 = applyActionToMetrics(baseMetrics, action, baseCtx);
    const r2 = applyActionToMetrics(baseMetrics, action, baseCtx);
    expect(r1.updatedMetrics).toEqual(r2.updatedMetrics);
    expect(r1.didBackfire).toBe(r2.didBackfire);
  });
});

// ─── checkActionAvailability ─────────────────────────────────────────────────

describe("checkActionAvailability", () => {
  it("blocks when lastActionMonth equals current month", () => {
    const action = getSocialActionById("founder_x_thread")!;
    const result = checkActionAvailability(action, baseMetrics, baseCtx, 3);
    expect(result.available).toBe(false);
    expect(result.reason).toContain("Already used");
  });

  it("allows when lastActionMonth < current month", () => {
    const action = getSocialActionById("founder_x_thread")!;
    const result = checkActionAvailability(action, baseMetrics, baseCtx, 2);
    expect(result.available).toBe(true);
  });

  it("blocks product_demo_tiktok when productProgress < 30", () => {
    const action = getSocialActionById("product_demo_tiktok")!;
    const lowCtx: SocialContext = { ...baseCtx, productProgress: 20 };
    const result = checkActionAvailability(action, baseMetrics, lowCtx, 0);
    expect(result.available).toBe(false);
    expect(result.reason).toContain("product progress");
  });

  it("allows product_demo_tiktok when productProgress >= 30", () => {
    const action = getSocialActionById("product_demo_tiktok")!;
    const okCtx: SocialContext = { ...baseCtx, productProgress: 35 };
    const result = checkActionAvailability(action, baseMetrics, okCtx, 0);
    expect(result.available).toBe(true);
  });

  it("blocks crisis_response when brandRisk < 40", () => {
    const action = getSocialActionById("crisis_response")!;
    const lowRisk: SocialMetrics = { ...baseMetrics, brandRisk: 20 };
    const result = checkActionAvailability(action, lowRisk, baseCtx, 0);
    expect(result.available).toBe(false);
  });

  it("allows crisis_response when brandRisk >= 40", () => {
    const action = getSocialActionById("crisis_response")!;
    const highRisk: SocialMetrics = { ...baseMetrics, brandRisk: 45 };
    const result = checkActionAvailability(action, highRisk, baseCtx, 0);
    expect(result.available).toBe(true);
  });

  it("blocks customer_testimonial when revenue < 5000", () => {
    const action = getSocialActionById("customer_testimonial")!;
    const poorCtx: SocialContext = { ...baseCtx, revenue: 1000 };
    const result = checkActionAvailability(action, baseMetrics, poorCtx, 0);
    expect(result.available).toBe(false);
  });

  it("provides backfireWarning for launch_announcement with low product", () => {
    const action = getSocialActionById("launch_announcement")!;
    const lowCtx: SocialContext = { ...baseCtx, productProgress: 55 };
    const result = checkActionAvailability(action, baseMetrics, lowCtx, 0);
    expect(result.available).toBe(true);
    expect(result.backfireWarning).toBeDefined();
  });

  it("no backfireWarning for safe launch", () => {
    const action = getSocialActionById("launch_announcement")!;
    const strongCtx: SocialContext = { ...baseCtx, productProgress: 80 };
    const result = checkActionAvailability(action, baseMetrics, strongCtx, 0);
    expect(result.available).toBe(true);
    expect(result.backfireWarning).toBeUndefined();
  });
});

// ─── applyMonthlyDecay ────────────────────────────────────────────────────────

describe("applyMonthlyDecay", () => {
  it("decays hype", () => {
    const m: SocialMetrics = { ...baseMetrics, hype: 80 };
    expect(applyMonthlyDecay(m).hype).toBeLessThan(m.hype);
  });

  it("decays viralMomentum faster than hype", () => {
    const m: SocialMetrics = { ...baseMetrics, hype: 80, viralMomentum: 80 };
    const d = applyMonthlyDecay(m);
    expect(m.viralMomentum - d.viralMomentum).toBeGreaterThan(m.hype - d.hype);
  });

  it("does not decrease followers", () => {
    const m: SocialMetrics = { ...baseMetrics, followers: 5000 };
    expect(applyMonthlyDecay(m).followers).toBe(m.followers);
  });

  it("heals brandRisk slowly", () => {
    const m: SocialMetrics = { ...baseMetrics, brandRisk: 30 };
    expect(applyMonthlyDecay(m).brandRisk).toBeLessThan(m.brandRisk);
  });

  it("all decayed values stay within 0-100", () => {
    const maxed: SocialMetrics = {
      followers: 10000, hype: 100, trust: 100, sentiment: 100,
      brandRisk: 100, viralMomentum: 100, founderReputation: 100, communityStrength: 100,
    };
    const d = applyMonthlyDecay(maxed);
    for (const [k, v] of Object.entries(d)) {
      if (k === "followers") continue;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

// ─── applyPassiveBrandRiskRules ───────────────────────────────────────────────

describe("applyPassiveBrandRiskRules", () => {
  it("escalates brandRisk when hype > 70 and trust < 35", () => {
    const m: SocialMetrics = { ...baseMetrics, hype: 75, trust: 25, brandRisk: 20 };
    expect(applyPassiveBrandRiskRules(m).brandRisk).toBeGreaterThan(m.brandRisk);
  });

  it("does not escalate when trust is healthy", () => {
    const m: SocialMetrics = { ...baseMetrics, hype: 75, trust: 60, brandRisk: 20 };
    expect(applyPassiveBrandRiskRules(m).brandRisk).toBe(m.brandRisk);
  });
});

// ─── deriveSocialSimModifiers ─────────────────────────────────────────────────

describe("deriveSocialSimModifiers", () => {
  it("high viralMomentum boosts revenue and userGrowth", () => {
    const m: SocialMetrics = { ...baseMetrics, viralMomentum: 60 };
    const mods = deriveSocialSimModifiers(m);
    expect(mods.revenueDelta).toBeGreaterThan(0);
    expect(mods.userGrowthDelta).toBeGreaterThan(0);
  });

  it("high trust reduces riskDelta", () => {
    const m: SocialMetrics = { ...baseMetrics, trust: 80 };
    expect(deriveSocialSimModifiers(m).riskDelta).toBeLessThan(0);
  });

  it("high brandRisk worsens riskDelta", () => {
    const m: SocialMetrics = { ...baseMetrics, brandRisk: 70 };
    expect(deriveSocialSimModifiers(m).riskDelta).toBeGreaterThan(0);
  });

  it("high founderReputation boosts investorDelta", () => {
    const m: SocialMetrics = { ...baseMetrics, founderReputation: 70 };
    expect(deriveSocialSimModifiers(m).investorDelta).toBeGreaterThan(0);
  });

  it("default metrics produce zero modifiers", () => {
    const mods = deriveSocialSimModifiers(DEFAULT_SOCIAL_METRICS);
    expect(mods.revenueDelta).toBe(0);
    expect(mods.userGrowthDelta).toBe(0);
    expect(mods.riskDelta).toBe(0);
  });

  it("results are deterministic for same input", () => {
    const m: SocialMetrics = { ...baseMetrics, viralMomentum: 60, trust: 75 };
    expect(deriveSocialSimModifiers(m)).toEqual(deriveSocialSimModifiers(m));
  });
});

// ─── generatePostContent ──────────────────────────────────────────────────────

describe("generatePostContent", () => {
  it("returns non-empty content for every action", () => {
    for (const action of SOCIAL_ACTION_CATALOG) {
      const { content, tone } = generatePostContent(action.id, {
        startupName: "TestCo", sector: "SaaS", month: 3,
        productProgress: 60, founderName: "Alex",
      });
      expect(content.length).toBeGreaterThan(10);
      expect(tone).toBeTruthy();
    }
  });

  it("is deterministic for same inputs", () => {
    const ctx = { startupName: "TestCo", sector: "SaaS", month: 3, productProgress: 60, founderName: "Alex" };
    const r1 = generatePostContent("founder_x_thread", ctx);
    const r2 = generatePostContent("founder_x_thread", ctx);
    expect(r1.content).toBe(r2.content);
    expect(r1.tone).toBe(r2.tone);
  });

  it("is pure — no async, no external calls", () => {
    const { content } = generatePostContent("launch_announcement", {
      startupName: "LaunchCo", sector: "Fintech", month: 5,
      productProgress: 80, founderName: "Sam",
    });
    expect(typeof content).toBe("string");
  });
});

// ─── generateActionFeedItems ──────────────────────────────────────────────────

describe("generateActionFeedItems", () => {
  function makePost(actionId: string) {
    const { content, tone } = generatePostContent(actionId, {
      startupName: "TestCo", sector: "SaaS", month: 3,
      productProgress: 60, founderName: "Alex",
    });
    return {
      id: `post-${actionId}`,
      month: 3,
      actionId,
      channel: "x" as const,
      actorType: "founder" as const,
      actorName: "Alex",
      content,
      tone,
      engagement: 50,
      sentiment: 10,
      tags: [],
    };
  }

  it("returns at least one item (the post itself)", () => {
    const action = getSocialActionById("founder_x_thread")!;
    const items = generateActionFeedItems(action, makePost(action.id), baseMetrics, baseCtx, false, action.effects);
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0].category).toBe("post");
  });

  it("includes crisis item when post backfired", () => {
    const action = getSocialActionById("launch_announcement")!;
    const items = generateActionFeedItems(action, makePost(action.id), baseMetrics, baseCtx, true, action.effects);
    expect(items.some((i) => i.category === "crisis")).toBe(true);
  });

  it("all feed items have required fields", () => {
    const action = getSocialActionById("instagram_bts")!;
    const items = generateActionFeedItems(action, makePost(action.id), baseMetrics, baseCtx, false, action.effects);
    for (const item of items) {
      expect(item.id).toBeTruthy();
      expect(item.month).toBe(3);
      expect(item.title).toBeTruthy();
      expect(item.body).toBeTruthy();
      expect(["positive", "neutral", "warning", "critical"]).toContain(item.severity);
    }
  });
});

// ─── generateMonthlyPassiveFeedItems ─────────────────────────────────────────

describe("generateMonthlyPassiveFeedItems", () => {
  it("returns critical item when brandRisk > 70", () => {
    const m: SocialMetrics = { ...baseMetrics, brandRisk: 75 };
    const items = generateMonthlyPassiveFeedItems(m, baseCtx);
    expect(items.some((i) => i.severity === "critical")).toBe(true);
  });

  it("no crisis item for default metrics in early game", () => {
    const earlyCtx: SocialContext = { ...baseCtx, month: 1 };
    const items = generateMonthlyPassiveFeedItems(DEFAULT_SOCIAL_METRICS, earlyCtx);
    expect(items.some((i) => i.category === "crisis")).toBe(false);
  });
});
