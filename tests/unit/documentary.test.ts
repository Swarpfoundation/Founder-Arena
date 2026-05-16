import { describe, it, expect } from "vitest";
import {
  generateDocumentary,
  selectTone,
  selectGenre,
  buildTitle,
  buildTagline,
  displayPlaystyle,
} from "@/lib/documentary/documentary-engine";
import { buildTimeline } from "@/lib/documentary/documentary-timeline";
import { buildShareCard } from "@/lib/documentary/documentary-share-card";
import type { DocumentaryEngineInput, SimMonthSnap } from "@/lib/documentary/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeMonth(n: number, overrides?: Partial<SimMonthSnap>): SimMonthSnap {
  return {
    monthNumber: n,
    cashStart: 100000,
    cashEnd: 80000,
    burnRate: 20000,
    revenue: n * 2000,
    runwayMonths: 4,
    productProgress: Math.min(100, n * 10),
    userGrowth: n * 5,
    employeeCount: 3 + n,
    valuation: 500000 + n * 50000,
    eventsTriggered: [],
    eventTitle: null,
    eventSummary: null,
    aiSummary: null,
    marketCondition: "neutral",
    riskScoreAfter: 30,
    investorScoreAfter: 55,
    investorScoreBefore: 50,
    ...overrides,
  };
}

function makeMinimalInput(overrides?: Partial<DocumentaryEngineInput["startup"]>): DocumentaryEngineInput {
  return {
    startup: {
      id: "startup-abc123",
      name: "TestCo",
      tagline: "The fast path forward.",
      sector: "SaaS",
      region: "North America",
      status: "dead",
      problem: "Companies lose 30% of revenue to inefficient workflows.",
      solution: "Automated workflow orchestration with AI-assisted routing.",
      monetizationModel: "subscription",
      targetMarket: "SMBs",
      fundingAsk: 500000,
      revenue: 5000,
      valuation: 300000,
      productProgress: 55,
      investorScore: 45,
      riskScore: 75,
      finalScore: 320,
      finalOutcome: "DEAD",
      finalSummary: "Ran out of cash after 6 months.",
      deathReason: "Runway exhausted",
      aiAnalysis: null,
      simulationMonths: [makeMonth(1), makeMonth(2), makeMonth(3), makeMonth(4), makeMonth(5), makeMonth(6)],
      fundingRounds: [],
      employees: [{ role: "CTO", status: "active" }, { role: "Engineer", status: "active" }],
      missions: [],
      ...overrides,
    },
    socialState: undefined,
    career: undefined,
  };
}

function makeBreakoutInput(): DocumentaryEngineInput {
  const months = Array.from({ length: 12 }, (_, i) => makeMonth(i + 1, {
    revenue: (i + 1) * 5000,
    valuation: 1000000 + (i + 1) * 200000,
    runwayMonths: 10,
  }));
  return {
    startup: {
      id: "startup-breakout1",
      name: "AcmeCorp",
      tagline: "Ship fast, scale faster.",
      sector: "AI",
      region: "EMEA",
      status: "completed",
      problem: "AI models are hard to deploy at scale.",
      solution: "One-click deployment pipeline for any ML model.",
      monetizationModel: "usage-based",
      targetMarket: "Enterprise",
      fundingAsk: 2000000,
      revenue: 60000,
      valuation: 3400000,
      productProgress: 95,
      investorScore: 82,
      riskScore: 25,
      finalScore: 920,
      finalOutcome: "BREAKOUT",
      finalSummary: "Hit breakout trajectory at month 12.",
      deathReason: null,
      aiAnalysis: {
        strategyArchetype: {
          dominantPlaystyle: "product_led",
          secondaryPlaystyle: "technical_builder",
          finalRunNarrative: "This was a Product-Led run: patient, technical, and shipping constantly.",
          strengths: ["Strong product velocity", "Trust over hype"],
          weaknesses: ["Slow to monetize"],
          title: "Product Architect",
        },
      },
      simulationMonths: months,
      fundingRounds: [{ roundType: "seed", amountRaised: 500000, equitySold: 10 }],
      employees: [
        { role: "CTO", status: "active" },
        { role: "Engineer", status: "active" },
        { role: "Designer", status: "active" },
      ],
      missions: [],
    },
    socialState: {
      hype: 72,
      trust: 68,
      brandRisk: 12,
      followers: 4500,
      viralMomentum: 30,
      founderReputation: 65,
      feedItems: [
        {
          id: "feed-1",
          month: 6,
          category: "viral",
          title: "Launch thread goes viral",
          body: "The product launch thread got 10K impressions and drove 500 sign-ups.",
          severity: "positive",
          source: "founder",
        },
        {
          id: "feed-2",
          month: 10,
          category: "milestone",
          title: "1K users milestone",
          body: "Crossed 1,000 active users for the first time.",
          severity: "positive",
          source: "founder",
        },
      ],
      actionsTaken: [
        { month: 1, actionId: "launch_thread", didBackfire: false },
        { month: 4, actionId: "customer_proof_campaign", didBackfire: false },
        { month: 6, actionId: "viral_demo", didBackfire: false },
      ],
      rivalProfiles: [
        {
          id: "rival-1",
          name: "NovaStack",
          founder: { name: "Sarah Chen", archetype: "hype_founder" },
          rivalryScore: 55,
          isDefeated: true,
          monthGenerated: 3,
        },
      ],
      rivalMoveHistory: [
        {
          id: "move-1",
          rivalName: "NovaStack",
          month: 5,
          title: "NovaStack raises Series A",
          description: "Competitor raises $5M, threatening market position.",
          severity: "warning",
        },
      ],
    },
    career: {
      founderTitle: "Serial Builder",
      founderRank: "builder",
      reputationScore: 42,
      reputationDelta: 12,
      rankAdvanced: true,
      titleChanged: false,
      badgeCount: 3,
    },
  };
}

function makeAcquisitionInput(): DocumentaryEngineInput {
  const months = Array.from({ length: 8 }, (_, i) => makeMonth(i + 1, { revenue: (i + 1) * 8000 }));
  return {
    startup: {
      id: "startup-acq1",
      name: "DataPulse",
      tagline: "The deal was earned.",
      sector: "FinTech",
      region: "North America",
      status: "completed",
      problem: "Banks lack real-time payment intelligence.",
      solution: "Real-time transaction analytics layer.",
      monetizationModel: "enterprise-license",
      targetMarket: "Tier-2 banks",
      fundingAsk: 3000000,
      revenue: 64000,
      valuation: 8000000,
      productProgress: 90,
      investorScore: 78,
      riskScore: 20,
      finalScore: 780,
      finalOutcome: "ACQUISITION",
      finalSummary: "Acquired by FinanceCo for $8M.",
      deathReason: null,
      aiAnalysis: null,
      simulationMonths: months,
      fundingRounds: [{ roundType: "seed", amountRaised: 750000, equitySold: 12 }],
      employees: [{ role: "CEO", status: "active" }, { role: "CTO", status: "active" }],
      missions: [],
    },
    socialState: undefined,
    career: undefined,
  };
}

// ─── selectTone ───────────────────────────────────────────────────────────────

describe("selectTone", () => {
  it("returns triumphant for high-score breakout", () => {
    expect(selectTone("BREAKOUT", 12, 900, null, false, false, 20)).toBe("triumphant");
  });

  it("returns underdog for low-score breakout", () => {
    expect(selectTone("BREAKOUT", 6, 500, null, false, false, 40)).toBe("underdog");
  });

  it("returns legendary for acquisition", () => {
    expect(selectTone("ACQUISITION", 8, 700, null, false, false, 15)).toBe("legendary");
  });

  it("returns legendary for acquihire", () => {
    expect(selectTone("ACQUIHIRE", 5, 400, null, false, false, 20)).toBe("legendary");
  });

  it("returns triumphant for series a ready", () => {
    expect(selectTone("SERIES_A_READY", 10, 650, null, false, false, 30)).toBe("triumphant");
  });

  it("returns cautionary for dead with high risk", () => {
    expect(selectTone("DEAD", 4, 200, null, false, false, 90)).toBe("cautionary");
  });

  it("returns gritty for dead with long survival", () => {
    expect(selectTone("DEAD", 10, 250, null, false, false, 40)).toBe("gritty");
  });

  it("returns cautionary for high risk failure", () => {
    expect(selectTone("HIGH_RISK_FAILURE", 3, 100, null, false, false, 95)).toBe("cautionary");
  });

  it("returns chaotic for hype machine playstyle", () => {
    expect(selectTone("SEED_READY", 6, 400, "hype_machine", false, false, 30)).toBe("chaotic");
  });

  it("returns satirical for regulated operator", () => {
    expect(selectTone("SMALL_PROFITABLE", 8, 350, "regulated_operator", false, false, 25)).toBe("satirical");
  });
});

// ─── selectGenre ──────────────────────────────────────────────────────────────

describe("selectGenre", () => {
  it("returns arena_highlight for breakout with rivals", () => {
    expect(selectGenre("BREAKOUT", true, 12)).toBe("arena_highlight");
  });

  it("returns founder_memoir for breakout without rivals", () => {
    expect(selectGenre("BREAKOUT", false, 12)).toBe("founder_memoir");
  });

  it("returns investor_case_study for acquisition", () => {
    expect(selectGenre("ACQUISITION", false, 8)).toBe("investor_case_study");
  });

  it("returns investor_case_study for acquihire", () => {
    expect(selectGenre("ACQUIHIRE", false, 5)).toBe("investor_case_study");
  });

  it("returns startup_true_crime for dead with short survival", () => {
    expect(selectGenre("DEAD", false, 4)).toBe("startup_true_crime");
  });

  it("returns founder_memoir for dead with long survival", () => {
    expect(selectGenre("DEAD", false, 10)).toBe("founder_memoir");
  });

  it("returns comeback_story for win with rivals", () => {
    expect(selectGenre("SERIES_A_READY", true, 9)).toBe("arena_highlight");
  });

  it("returns cautionary_tale for zombie", () => {
    expect(selectGenre("ZOMBIE", false, 6)).toBe("cautionary_tale");
  });
});

// ─── buildTitle ───────────────────────────────────────────────────────────────

describe("buildTitle", () => {
  it("generates title for breakout", () => {
    const title = buildTitle("BREAKOUT", "TestCo", "SaaS", 12, 12345);
    expect(typeof title).toBe("string");
    expect(title.length).toBeGreaterThan(3);
  });

  it("substitutes name and months", () => {
    const title = buildTitle("DEAD", "Acme", "AI", 6, 0);
    // First entry: "The Runway Went Dark" — no substitution, still valid
    expect(typeof title).toBe("string");
    expect(title.length).toBeGreaterThan(3);
  });

  it("is deterministic for same inputs", () => {
    const t1 = buildTitle("BREAKOUT", "TestCo", "SaaS", 10, 9999);
    const t2 = buildTitle("BREAKOUT", "TestCo", "SaaS", 10, 9999);
    expect(t1).toBe(t2);
  });

  it("falls back to DEFAULT pool for unknown outcome", () => {
    const title = buildTitle("UNKNOWN_OUTCOME", "TestCo", "FinTech", 5, 0);
    expect(title).toContain("TestCo");
  });

  it("uses sector substitution where available", () => {
    const title = buildTitle("SMALL_PROFITABLE", "TestCo", "HealthTech", 8, 1);
    expect(title).toContain("HealthTech");
  });
});

// ─── buildTagline ─────────────────────────────────────────────────────────────

describe("buildTagline", () => {
  it("returns a string for each tone", () => {
    const tones = ["triumphant", "underdog", "legendary", "chaotic", "gritty", "tragic", "cautionary", "satirical"] as const;
    for (const tone of tones) {
      const tag = buildTagline(tone, 42);
      expect(typeof tag).toBe("string");
      expect(tag.length).toBeGreaterThan(5);
    }
  });

  it("is deterministic", () => {
    const t1 = buildTagline("gritty", 777);
    const t2 = buildTagline("gritty", 777);
    expect(t1).toBe(t2);
  });
});

// ─── displayPlaystyle ─────────────────────────────────────────────────────────

describe("displayPlaystyle", () => {
  it("returns null for null input", () => {
    expect(displayPlaystyle(null)).toBeNull();
  });

  it("returns display name for known key", () => {
    expect(displayPlaystyle("product_led")).toBe("Product-Led");
    expect(displayPlaystyle("hype_machine")).toBe("Hype Machine");
    expect(displayPlaystyle("enterprise_sales")).toBe("Enterprise Closer");
  });

  it("returns raw key for unknown playstyle", () => {
    expect(displayPlaystyle("unknown_playstyle")).toBe("unknown_playstyle");
  });
});

// ─── generateDocumentary — dead outcome ──────────────────────────────────────

describe("generateDocumentary — dead outcome", () => {
  const input = makeMinimalInput();
  const doc = generateDocumentary(input);

  it("produces a documentary", () => {
    expect(doc).toBeDefined();
    expect(doc.startupId).toBe("startup-abc123");
  });

  it("outcome is DEAD", () => {
    expect(doc.outcome).toBe("DEAD");
  });

  it("has a title string", () => {
    expect(typeof doc.title).toBe("string");
    expect(doc.title.length).toBeGreaterThan(3);
  });

  it("has a tagline string", () => {
    expect(typeof doc.tagline).toBe("string");
    expect(doc.tagline.length).toBeGreaterThan(5);
  });

  it("has at least 3 chapters", () => {
    expect(doc.chapters.length).toBeGreaterThanOrEqual(3);
  });

  it("has a verdict chapter", () => {
    expect(doc.chapters.some((c) => c.category === "verdict")).toBe(true);
  });

  it("has an origin chapter", () => {
    expect(doc.chapters.some((c) => c.category === "origin")).toBe(true);
  });

  it("has a funding chapter", () => {
    expect(doc.chapters.some((c) => c.category === "funding")).toBe(true);
  });

  it("no strategy chapter when aiAnalysis is null", () => {
    expect(doc.chapters.some((c) => c.category === "strategy")).toBe(false);
  });

  it("no social chapter when no social state", () => {
    expect(doc.chapters.some((c) => c.category === "social")).toBe(false);
  });

  it("no rival chapter when no rivals", () => {
    expect(doc.chapters.some((c) => c.category === "rival")).toBe(false);
  });

  it("rivalSummary is null", () => {
    expect(doc.rivalSummary).toBeNull();
  });

  it("socialSummary is null", () => {
    expect(doc.socialSummary).toBeNull();
  });

  it("strategySummary is null", () => {
    expect(doc.strategySummary).toBeNull();
  });

  it("careerImpactSummary is null", () => {
    expect(doc.careerImpactSummary).toBeNull();
  });

  it("hero stats match startup data", () => {
    expect(doc.heroStats.finalScore).toBe(320);
    expect(doc.heroStats.monthsSurvived).toBe(6);
    expect(doc.heroStats.finalOutcome).toBe("DEAD");
  });

  it("timeline has at least 2 moments", () => {
    expect(doc.timeline.length).toBeGreaterThanOrEqual(2);
  });

  it("timeline includes final outcome moment", () => {
    expect(doc.timeline.some((m) => m.id === "final-outcome")).toBe(true);
  });

  it("share card has required fields", () => {
    expect(doc.shareCard.startupName).toBe("TestCo");
    expect(doc.shareCard.sector).toBe("SaaS");
    expect(typeof doc.shareCard.shareText).toBe("string");
    expect(doc.shareCard.shareText.length).toBeGreaterThan(20);
  });

  it("share text includes key info", () => {
    expect(doc.shareCard.shareText).toContain("TestCo");
    expect(doc.shareCard.shareText).toContain("FOUNDER ARENA");
  });

  it("tags array is not empty", () => {
    expect(doc.tags.length).toBeGreaterThan(0);
  });
});

// ─── generateDocumentary — breakout outcome ──────────────────────────────────

describe("generateDocumentary — breakout outcome", () => {
  const input = makeBreakoutInput();
  const doc = generateDocumentary(input);

  it("outcome is BREAKOUT", () => {
    expect(doc.outcome).toBe("BREAKOUT");
  });

  it("tone is triumphant (score >= 700)", () => {
    expect(doc.tone).toBe("triumphant");
  });

  it("genre is arena_highlight (has rivals)", () => {
    expect(doc.genre).toBe("arena_highlight");
  });

  it("has 6 chapters including strategy, social, rival", () => {
    const cats = doc.chapters.map((c) => c.category);
    expect(cats).toContain("strategy");
    expect(cats).toContain("social");
    expect(cats).toContain("rival");
    expect(cats).toContain("origin");
    expect(cats).toContain("funding");
    expect(cats).toContain("verdict");
  });

  it("chapter count is at most 6", () => {
    expect(doc.chapters.length).toBeLessThanOrEqual(6);
  });

  it("strategySummary is populated", () => {
    expect(doc.strategySummary).not.toBeNull();
    expect(doc.strategySummary?.dominantPlaystyle).toBe("product_led");
    expect(doc.strategySummary?.finalRunNarrative.length).toBeGreaterThan(5);
  });

  it("rivalSummary is populated", () => {
    expect(doc.rivalSummary).not.toBeNull();
    expect(doc.rivalSummary?.totalRivals).toBe(1);
    expect(doc.rivalSummary?.defeated).toBe(1);
    expect(doc.rivalSummary?.strongestRivalName).toBe("NovaStack");
  });

  it("socialSummary is populated", () => {
    expect(doc.socialSummary).not.toBeNull();
    expect(doc.socialSummary?.totalActions).toBe(3);
    expect(doc.socialSummary?.followers).toBe(4500);
  });

  it("careerImpactSummary is populated", () => {
    expect(doc.careerImpactSummary).not.toBeNull();
    expect(doc.careerImpactSummary?.reputationDelta).toBe(12);
    expect(doc.careerImpactSummary?.newRank).toBe("builder");
  });

  it("hero stats reflect breakout data", () => {
    expect(doc.heroStats.finalScore).toBe(920);
    expect(doc.heroStats.monthsSurvived).toBe(12);
    expect(doc.heroStats.dominantPlaystyle).toBe("Product-Led");
    expect(doc.heroStats.strongestRival).toBe("NovaStack");
  });

  it("timeline has launch and final outcome", () => {
    const ids = doc.timeline.map((m) => m.id);
    expect(ids).toContain("launch");
    expect(ids).toContain("final-outcome");
  });

  it("final outcome timeline moment is positive", () => {
    const final = doc.timeline.find((m) => m.id === "final-outcome");
    expect(final?.impact).toBe("positive");
  });
});

// ─── generateDocumentary — acquisition outcome ───────────────────────────────

describe("generateDocumentary — acquisition outcome", () => {
  const input = makeAcquisitionInput();
  const doc = generateDocumentary(input);

  it("outcome is ACQUISITION", () => {
    expect(doc.outcome).toBe("ACQUISITION");
  });

  it("tone is legendary", () => {
    expect(doc.tone).toBe("legendary");
  });

  it("genre is investor_case_study", () => {
    expect(doc.genre).toBe("investor_case_study");
  });

  it("verdict chapter contains acquired language", () => {
    const verdict = doc.chapters.find((c) => c.category === "verdict");
    expect(verdict?.body.toLowerCase()).toContain("acquired");
  });

  it("funding chapter mentions the seed round", () => {
    const funding = doc.chapters.find((c) => c.category === "funding");
    expect(funding?.body).toContain("750,000");
  });
});

// ─── Determinism ─────────────────────────────────────────────────────────────

describe("determinism", () => {
  it("same input always produces same documentary title", () => {
    const input = makeMinimalInput();
    const d1 = generateDocumentary(input);
    const d2 = generateDocumentary(input);
    expect(d1.title).toBe(d2.title);
  });

  it("same input always produces same tagline", () => {
    const input = makeBreakoutInput();
    const d1 = generateDocumentary(input);
    const d2 = generateDocumentary(input);
    expect(d1.tagline).toBe(d2.tagline);
  });

  it("same input always produces same tone", () => {
    const input = makeAcquisitionInput();
    const d1 = generateDocumentary(input);
    const d2 = generateDocumentary(input);
    expect(d1.tone).toBe(d2.tone);
  });

  it("same input always produces same chapter count", () => {
    const input = makeBreakoutInput();
    const d1 = generateDocumentary(input);
    const d2 = generateDocumentary(input);
    expect(d1.chapters.length).toBe(d2.chapters.length);
  });

  it("same input always produces same share text", () => {
    const input = makeBreakoutInput();
    const d1 = generateDocumentary(input);
    const d2 = generateDocumentary(input);
    expect(d1.shareCard.shareText).toBe(d2.shareCard.shareText);
  });
});

// ─── Missing optional data does not crash ────────────────────────────────────

describe("resilience to missing optional data", () => {
  it("no socialState", () => {
    const input = makeMinimalInput();
    input.socialState = undefined;
    expect(() => generateDocumentary(input)).not.toThrow();
  });

  it("no career", () => {
    const input = makeBreakoutInput();
    input.career = undefined;
    expect(() => generateDocumentary(input)).not.toThrow();
  });

  it("null aiAnalysis", () => {
    const input = makeBreakoutInput();
    input.startup.aiAnalysis = null;
    expect(() => generateDocumentary(input)).not.toThrow();
  });

  it("empty simulationMonths", () => {
    const input = makeMinimalInput();
    input.startup.simulationMonths = [];
    expect(() => generateDocumentary(input)).not.toThrow();
  });

  it("empty feedItems in socialState", () => {
    const input = makeBreakoutInput();
    input.socialState!.feedItems = [];
    expect(() => generateDocumentary(input)).not.toThrow();
  });

  it("empty rivalProfiles in socialState", () => {
    const input = makeBreakoutInput();
    input.socialState!.rivalProfiles = [];
    const doc = generateDocumentary(input);
    expect(doc.rivalSummary).toBeNull();
  });

  it("empty actionsTaken — no social chapter generated", () => {
    const input = makeBreakoutInput();
    input.socialState!.actionsTaken = [];
    const doc = generateDocumentary(input);
    expect(doc.chapters.some((c) => c.category === "social")).toBe(false);
  });
});

// ─── buildTimeline ────────────────────────────────────────────────────────────

describe("buildTimeline", () => {
  it("always includes launch and final-outcome", () => {
    const input = makeBreakoutInput();
    const timeline = buildTimeline(input);
    const ids = timeline.map((m) => m.id);
    expect(ids).toContain("launch");
    expect(ids).toContain("final-outcome");
  });

  it("returns at most 10 moments", () => {
    const input = makeBreakoutInput();
    const timeline = buildTimeline(input);
    expect(timeline.length).toBeLessThanOrEqual(10);
  });

  it("returns at least 2 moments", () => {
    const input = makeMinimalInput();
    const timeline = buildTimeline(input);
    expect(timeline.length).toBeGreaterThanOrEqual(2);
  });

  it("moments are sorted by month", () => {
    const input = makeBreakoutInput();
    const timeline = buildTimeline(input);
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].month).toBeGreaterThanOrEqual(timeline[i - 1].month);
    }
  });

  it("includes funding moment when funding rounds exist", () => {
    const input = makeBreakoutInput();
    const timeline = buildTimeline(input);
    expect(timeline.some((m) => m.source === "funding")).toBe(true);
  });

  it("final-outcome is positive for breakout", () => {
    const input = makeBreakoutInput();
    const timeline = buildTimeline(input);
    const final = timeline.find((m) => m.id === "final-outcome");
    expect(final?.impact).toBe("positive");
  });

  it("final-outcome is negative for DEAD", () => {
    const input = makeMinimalInput();
    const timeline = buildTimeline(input);
    const final = timeline.find((m) => m.id === "final-outcome");
    expect(final?.impact).toBe("negative");
  });
});

// ─── buildShareCard ───────────────────────────────────────────────────────────

describe("buildShareCard", () => {
  it("produces share card with required fields", () => {
    const input = makeBreakoutInput();
    const doc = generateDocumentary(input);
    const card = doc.shareCard;

    expect(card.startupName).toBe("AcmeCorp");
    expect(card.sector).toBe("AI");
    expect(card.finalScore).toBe(920);
    expect(card.monthsSurvived).toBe(12);
    expect(typeof card.shareText).toBe("string");
    expect(card.shareText.length).toBeGreaterThan(30);
  });

  it("share text contains outcome label", () => {
    const input = makeBreakoutInput();
    const doc = generateDocumentary(input);
    expect(doc.shareCard.shareText).toContain("BREAKOUT");
  });

  it("share text contains startup name", () => {
    const input = makeBreakoutInput();
    const doc = generateDocumentary(input);
    expect(doc.shareCard.shareText).toContain("AcmeCorp");
  });

  it("share text contains FOUNDER ARENA header", () => {
    const input = makeMinimalInput();
    const doc = generateDocumentary(input);
    expect(doc.shareCard.shareText).toContain("FOUNDER ARENA");
  });

  it("outcomeLabel is DEAD for dead outcome", () => {
    const input = makeMinimalInput();
    const doc = generateDocumentary(input);
    expect(doc.shareCard.outcomeLabel).toBe("DEAD");
  });

  it("dominantPlaystyle is displayed nicely", () => {
    const input = makeBreakoutInput();
    const doc = generateDocumentary(input);
    expect(doc.shareCard.dominantPlaystyle).toBe("Product-Led");
  });

  it("badgeLine shows reputation delta if no badges", () => {
    const input = makeBreakoutInput();
    const doc = generateDocumentary(input);
    // career has reputationDelta: 12, newBadges: []
    expect(doc.shareCard.badgeLine).toBe("+12 reputation");
  });
});
