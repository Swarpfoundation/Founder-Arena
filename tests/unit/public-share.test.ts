import { describe, expect, it } from "vitest";
import {
  buildPublicFounderShareData,
  buildPublicStartupShareData,
  formatShareMoney,
  getOutcomeStampPresentation,
  getPublicShareMetadata,
  sanitizePublicShareText,
} from "@/lib/game/public-share";
import type { PublicFounderProfile } from "@/lib/public/public-profile";
import type { PublicStartupResult } from "@/lib/public/public-startup";

const startupFixture: PublicStartupResult & Record<string, unknown> = {
  name: "NovaStack",
  tagline: "AI ops for lean teams",
  sector: "AI / ML",
  status: "completed",
  finalOutcome: "BREAKOUT",
  finalScore: 1240,
  finalSummary: "Public-safe ending line",
  valuation: 15_000_000,
  revenue: 750_000,
  productProgress: 92,
  monthsSurvived: 12,
  deathReason: null,
  publicSlug: "novastack-abc123",
  founderName: "Founder One",
  founderSlug: "founder-one",
  fundingRaised: 1_500_000,
  teamSize: 8,
  workSetup: "small_office",
  leaderboardScore: 1240,
  leaderboardCategory: "overall",
  simulationHighlights: {
    biggestCrisis: "Inference bill shock",
    strongestAchievement: "Demo Day win",
    keyLesson: "Costs matter before hype scales.",
  },
  pitchText: "PRIVATE_PITCH_TEXT",
  financialPlan: "PRIVATE_FINANCIAL_PLAN",
  rawAiReview: "RAW_DEEPSEEK_PAYLOAD",
  userEmail: "secret@example.com",
  adminNotes: "ADMIN_ONLY",
  referralLedger: "PRIVATE_REFERRALS",
};

const founderFixture: PublicFounderProfile & Record<string, unknown> = {
  displayName: "Arena Founder",
  publicSlug: "arena-founder",
  level: 6,
  xp: 1200,
  totalStartups: 5,
  completedStartups: 3,
  deadStartups: 2,
  bestScore: 1240,
  bestValuation: 15_000_000,
  achievements: [
    {
      key: "first_breakout",
      title: "Breakout Moment",
      description: "Revenue exploded and capital efficiency proved the model.",
      icon: "rocket",
      unlockedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  ],
  startups: [
    {
      name: "NovaStack",
      sector: "AI / ML",
      status: "completed",
      finalOutcome: "BREAKOUT",
      finalScore: 1240,
      valuation: 15_000_000,
      revenue: 750_000,
      monthsSurvived: 12,
      publicSlug: "novastack-abc123",
    },
  ],
  leaderboardEntries: [
    {
      score: 1240,
      category: "overall",
      season: "beta-season-1",
      outcome: "BREAKOUT",
      survivalMonths: 12,
      startupName: "NovaStack",
      startupSlug: "novastack-abc123",
    },
  ],
  email: "secret@example.com",
  privatePitch: "PRIVATE_PITCH",
  adminNotes: "ADMIN_ONLY",
  adLedger: "ADS_LEDGER",
};

describe("public share presentation helpers", () => {
  it("returns only safe public startup fields", () => {
    const data = buildPublicStartupShareData(startupFixture);
    expect(data).toMatchObject({
      type: "startup",
      name: "NovaStack",
      finalScore: 1240,
      outcomeStamp: { label: "BREAKOUT", tone: "amber" },
    });
    const serialized = JSON.stringify(data);
    expect(serialized).not.toContain("PRIVATE_PITCH_TEXT");
    expect(serialized).not.toContain("PRIVATE_FINANCIAL_PLAN");
    expect(serialized).not.toContain("RAW_DEEPSEEK_PAYLOAD");
    expect(serialized).not.toContain("secret@example.com");
    expect(serialized).not.toContain("ADMIN_ONLY");
    expect(serialized).not.toContain("PRIVATE_REFERRALS");
  });

  it("returns only safe public founder fields", () => {
    const data = buildPublicFounderShareData(founderFixture);
    expect(data).toMatchObject({
      type: "founder",
      displayName: "Arena Founder",
      founderStamp: "Breakout Founder",
      achievementCount: 1,
    });
    const serialized = JSON.stringify(data);
    expect(serialized).not.toContain("secret@example.com");
    expect(serialized).not.toContain("PRIVATE_PITCH");
    expect(serialized).not.toContain("ADMIN_ONLY");
    expect(serialized).not.toContain("ADS_LEDGER");
  });

  it("maps all final outcomes to share stamps", () => {
    expect(getOutcomeStampPresentation("BREAKOUT")).toMatchObject({ label: "BREAKOUT", tone: "amber" });
    expect(getOutcomeStampPresentation("SERIES_A_READY")).toMatchObject({ label: "SERIES A READY", tone: "violet" });
    expect(getOutcomeStampPresentation("SEED_READY")).toMatchObject({ label: "SEED READY", tone: "cyan" });
    expect(getOutcomeStampPresentation("ACQUISITION_TARGET")).toMatchObject({ label: "ACQUIRED", tone: "emerald" });
    expect(getOutcomeStampPresentation("SMALL_PROFITABLE")).toMatchObject({ label: "PROFITABLE", tone: "emerald" });
    expect(getOutcomeStampPresentation("ZOMBIE")).toMatchObject({ label: "ZOMBIE", tone: "white" });
    expect(getOutcomeStampPresentation("DEAD")).toMatchObject({ label: "DEAD", tone: "rose" });
  });

  it("sanitizes share text without platform APIs", () => {
    expect(sanitizePublicShareText("<script>alert(1)</script> Build a run")).toBe("alert(1) Build a run");
    const data = buildPublicStartupShareData(startupFixture);
    expect(data.shareText).toContain("Build your own run");
    expect(data.shareText).not.toContain("<script>");
  });

  it("builds safe metadata without private values", () => {
    const startupMeta = getPublicShareMetadata(buildPublicStartupShareData(startupFixture));
    const founderMeta = getPublicShareMetadata(buildPublicFounderShareData(founderFixture));
    const serialized = JSON.stringify({ startupMeta, founderMeta });
    expect(serialized).toContain("Founder Arena");
    expect(serialized).not.toContain("secret@example.com");
    expect(serialized).not.toContain("PRIVATE_PITCH");
    expect(serialized).not.toContain("RAW_DEEPSEEK_PAYLOAD");
  });

  it("handles sparse founder profiles as safe placeholders", () => {
    const data = buildPublicFounderShareData({
      ...founderFixture,
      totalStartups: 0,
      completedStartups: 0,
      deadStartups: 0,
      bestScore: 0,
      bestValuation: 0,
      achievements: [],
      startups: [],
      leaderboardEntries: [],
    });
    expect(data.founderStamp).toBe("New Founder");
    expect(data.startups).toEqual([]);
    expect(data.achievements).toEqual([]);
  });

  it("formats money for poster stat strips", () => {
    expect(formatShareMoney(0)).toBe("$0");
    expect(formatShareMoney(900)).toBe("$900");
    expect(formatShareMoney(12_400)).toBe("$12K");
    expect(formatShareMoney(1_500_000)).toBe("$1.5M");
    expect(formatShareMoney(2_500_000_000)).toBe("$2.5B");
  });
});
