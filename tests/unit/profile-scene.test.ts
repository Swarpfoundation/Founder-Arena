import { describe, expect, it } from "vitest";
import {
  getAdminAccessPresentation,
  getFounderProfileHero,
  getPlanAccessPresentation,
  getProfileLegacyPresentation,
  getProfileReferralPresentation,
  getProfileSettingsLinks,
  maskPrivateIdentifier,
} from "@/lib/game/profile-scene";

describe("profile scene presentation helpers", () => {
  it("handles missing display name safely", () => {
    const hero = getFounderProfileHero({
      displayName: null,
      email: "founder@example.com",
      founderTitle: "Rookie Founder",
      founderRank: "rookie",
      level: 1,
      totalStartups: 0,
      planId: "free",
      appEnv: "beta",
    });
    expect(hero).toMatchObject({
      displayName: "Founder",
      planLabel: "Free",
      betaStamp: "Private Beta Access",
    });
    expect(hero.maskedEmail).toBe("fo***@e***.com");
  });

  it("maps Free, Pro, and Max plan access", () => {
    const weekly = {
      isPaid: false,
      remainingFreeSubmissions: 2,
      submissionCreditsAvailable: 1,
      windowEnd: new Date("2026-05-25T00:00:00.000Z"),
    };
    expect(getPlanAccessPresentation({ planId: "free", weekly })).toMatchObject({
      planName: "Free",
      remainingWeeklyReviews: "2",
      creditsAvailable: 1,
    });
    expect(getPlanAccessPresentation({ planId: "pro", weekly: { ...weekly, isPaid: true } })).toMatchObject({
      planName: "Pro",
      remainingWeeklyReviews: "Unlimited",
    });
    expect(getPlanAccessPresentation({ planId: "max", weekly: { ...weekly, isPaid: true } })).toMatchObject({
      planName: "Max",
      priceLabel: "$19/mo",
    });
  });

  it("presents referral rewards with no-cash-value disclaimer", () => {
    const referral = getProfileReferralPresentation({
      code: "FOUNDER123",
      link: "https://founderarena.xyz/r/FOUNDER123",
      founderPoints: 200,
      submissionCreditsAvailable: 2,
      signups: 1,
    });
    expect(referral).toMatchObject({ code: "FOUNDER123", founderPoints: 200, submissionCredits: 2 });
    expect(referral.disclaimer).toContain("no cash value");
    expect(referral.disclaimer).toContain("do not improve score");
  });

  it("presents legacy links even when public slug is missing", () => {
    const legacy = getProfileLegacyPresentation({
      founderTitle: "Operator",
      founderRank: "operator",
      bestScore: 900,
      bestValuation: 5_000_000,
      completedStartups: 2,
      deadStartups: 1,
      publicSlug: null,
    });
    expect(legacy.publicHref).toBeNull();
    expect(legacy.ctas.map((cta) => cta.href)).toContain("/career");
    expect(legacy.ctas.map((cta) => cta.href)).not.toContain("/f/null");
  });

  it("hides admin panel for non-admin and shows it for admin state", () => {
    expect(getAdminAccessPresentation(false)).toBeNull();
    expect(getAdminAccessPresentation(true)).toMatchObject({
      label: "Private Beta Ops",
      href: "/admin/private-beta",
    });
  });

  it("masks private identifiers", () => {
    expect(maskPrivateIdentifier("founder@example.com")).toBe("fo***@e***.com");
    expect(maskPrivateIdentifier("ab@example.com")).toBe("a*@e***.com");
    expect(maskPrivateIdentifier("opaque-token-value")).toBe("op***ue");
    expect(maskPrivateIdentifier("abc")).toBe("****");
  });

  it("keeps settings links and logout-adjacent destinations available", () => {
    const hrefs = getProfileSettingsLinks().map((link) => link.href);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/referrals");
    expect(hrefs).toContain("/settings/ads");
    expect(hrefs).toContain("/billing");
  });

  it("does not carry forbidden secret-like fields in helper output", () => {
    const hero = getFounderProfileHero({
      displayName: "<b>Founder</b>",
      email: "secret@example.com",
      founderTitle: "Operator",
      founderRank: "operator",
      level: 4,
      totalStartups: 3,
      planId: "pro",
      appEnv: "beta",
    });
    const serialized = JSON.stringify({
      hero,
      admin: getAdminAccessPresentation(false),
      settings: getProfileSettingsLinks(),
    });
    expect(serialized).not.toContain("<b>");
    expect(serialized).not.toContain("DEEPSEEK_API_KEY");
    expect(serialized).not.toContain("AUTH_SECRET");
    expect(serialized).not.toContain("admin internals");
  });
});
