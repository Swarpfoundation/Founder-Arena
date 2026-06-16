import { describe, expect, it } from "vitest";
import {
  buildSafeMobileStartupView,
  buildStoredStartupProfileFromStartup,
  mergeStartupProfiles,
  normalizeMobileStartupInput,
} from "@/lib/startups/mobile-api";

describe("mobile startup API helpers", () => {
  it("normalizes iOS-friendly startup input into backend-compatible fields", () => {
    const result = normalizeMobileStartupInput({
      name: "VaultPay",
      sector: "FinTech",
      country: "UK",
      city: "London",
      countryCode: "gb",
      founderStyle: "Technical",
      oneLinePitch: "Compliance-aware wallet infrastructure for marketplaces.",
      targetCustomer: "marketplace operators",
      websiteURL: "https://vaultpay.example",
      socialLinks: [{ platform: "github", url: "https://github.com/example/vaultpay" }],
      realLifeStartup: true,
      fundingGoal: "$1.5M seed",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.name).toBe("VaultPay");
    expect(result.data.sector).toBe("Fintech");
    expect(result.data.region).toBe("Europe");
    expect(result.data.targetMarket).toBe("marketplace operators");
    expect(result.data.fundingAsk).toBe(500_000);
    expect(result.profile.city).toBe("London");
    expect(result.profile.countryCode).toBe("GB");
    expect(result.profile.websiteUrl).toBe("https://vaultpay.example");
    expect(result.profile.socialLinks).toEqual([{ platform: "github", url: "https://github.com/example/vaultpay" }]);
    expect(result.profile.realLifeStartup).toBe(true);
    expect(result.profile.fundingGoal).toBe("$1.5M seed");
    expect(result.data.problem.length).toBeGreaterThanOrEqual(20);
    expect(result.data.solution.length).toBeGreaterThanOrEqual(20);
  });

  it("maps unsupported or future sectors to the safe backend fallback", () => {
    const result = normalizeMobileStartupInput({
      name: "FrontierOps",
      sector: "SpaceTech",
      region: "Remote / Global",
      targetCustomer: "operations teams",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.sector).toBe("Other");
  });

  it("rejects invalid mobile startup input safely", () => {
    const result = normalizeMobileStartupInput({
      name: "A",
      sector: "",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects invalid profile URLs and country codes safely", () => {
    expect(normalizeMobileStartupInput({
      name: "VaultPay",
      sector: "FinTech",
      websiteUrl: "ftp://vaultpay.example",
    })).toMatchObject({ ok: false });

    expect(normalizeMobileStartupInput({
      name: "VaultPay",
      sector: "FinTech",
      countryCode: "GBR",
    })).toMatchObject({ ok: false });

    expect(normalizeMobileStartupInput({
      name: "VaultPay",
      sector: "FinTech",
      socialLinks: [{ platform: "github", url: "javascript:alert(1)" }],
    })).toMatchObject({ ok: false });
  });

  it("builds an enriched safe startup response without difficulty or private AI fields", () => {
    const startup = buildSafeMobileStartupView({
      id: "startup-1",
      name: "VaultPay",
      tagline: "Wallet infrastructure",
      description: "Wallet infrastructure for marketplace operators",
      sector: "Fintech",
      region: "Europe",
      stage: "prototype",
      targetMarket: "marketplace operators",
      monetizationModel: "B2B SaaS plus transaction fees",
      status: "draft",
      problem: "Marketplace operators need a clear way to manage payout and custody risk.",
      solution: "VaultPay maps payment operations into a compliance-aware workflow.",
      unfairAdvantage: "Payments founder-market fit",
      fundingAsk: 1_500_000,
      cash: 0,
      monthlyBurn: 0,
      valuation: 0,
      profile: {
        companyName: "VaultPay",
        city: "London",
        country: "United Kingdom",
        countryCode: "GB",
        websiteUrl: "https://vaultpay.example",
        logoUploadKey: "private/logo.png",
        sector: "Fintech",
        targetCustomer: "marketplace operators",
        currentStage: "prototype",
        shortDescription: "Wallet infrastructure for marketplaces.",
        realLifeStartup: true,
        socialLinks: [{ platform: "linkedin", url: "https://linkedin.com/company/vaultpay" }],
      },
      createdAt: new Date("2026-06-12T10:00:00.000Z"),
      updatedAt: new Date("2026-06-12T10:00:00.000Z"),
      _count: { simulationMonths: 0 },
    });

    expect(startup).toMatchObject({
      id: "startup-1",
      name: "VaultPay",
      sector: "Fintech",
      region: "Europe",
      founderStyle: null,
      currentMonth: 0,
      status: "draft",
      fundingStage: "prototype",
      country: "United Kingdom",
      countryCode: "GB",
      city: "London",
      stage: "prototype",
      cash: 0,
      monthlyBurn: 0,
      valuation: 0,
      profile: {
        companyName: "VaultPay",
        description: "Wallet infrastructure for marketplaces.",
        websiteUrl: "https://vaultpay.example",
        socialLinks: [{ platform: "linkedin", url: "https://linkedin.com/company/vaultpay" }],
        realLifeStartup: true,
      },
      createdAt: "2026-06-12T10:00:00.000Z",
      updatedAt: "2026-06-12T10:00:00.000Z",
    });
    expect(JSON.stringify(startup)).not.toContain("difficulty");
    expect(JSON.stringify(startup)).not.toContain("aiAnalysis");
    expect(JSON.stringify(startup)).not.toContain("logoUploadKey");
    expect(JSON.stringify(startup)).not.toContain("private/logo.png");
  });

  it("merges stored startup profiles over legacy startup columns for review context", () => {
    const profile = buildStoredStartupProfileFromStartup({
      id: "startup-1",
      name: "VaultPay",
      description: "Legacy description",
      sector: "Fintech",
      region: "Europe",
      stage: "idea",
      targetMarket: "marketplace operators",
      monetizationModel: "Subscription",
      status: "draft",
      problem: "Legacy problem statement that is long enough for review context.",
      solution: "Legacy solution statement that is long enough for review context.",
      unfairAdvantage: "Legacy unfair advantage",
      fundingAsk: 500_000,
      cash: 0,
      monthlyBurn: 0,
      valuation: 0,
      profile: {
        companyName: "VaultPay",
        city: "London",
        country: "United Kingdom",
        targetCustomer: "regulated marketplaces",
        currentStage: "prototype",
        problem: "Marketplaces need a custody path.",
        solution: "VaultPay maps custody responsibilities before launch.",
      },
      createdAt: new Date("2026-06-12T10:00:00.000Z"),
      updatedAt: new Date("2026-06-12T10:00:00.000Z"),
    });

    expect(profile.city).toBe("London");
    expect(profile.targetCustomer).toBe("regulated marketplaces");
    expect(profile.problem).toBe("Marketplaces need a custody path.");

    const merged = mergeStartupProfiles(profile, {
      ...profile,
      targetCustomer: "enterprise marketplaces",
      socialLinks: [],
    });
    expect(merged?.targetCustomer).toBe("enterprise marketplaces");
    expect(merged?.city).toBe("London");
  });
});
