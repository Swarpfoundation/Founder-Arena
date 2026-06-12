import { describe, expect, it } from "vitest";
import {
  buildSafeMobileStartupView,
  normalizeMobileStartupInput,
} from "@/lib/startups/mobile-api";

describe("mobile startup API helpers", () => {
  it("normalizes iOS-friendly startup input into backend-compatible fields", () => {
    const result = normalizeMobileStartupInput({
      name: "VaultPay",
      sector: "FinTech",
      country: "UK",
      founderStyle: "Technical",
      targetCustomer: "marketplace operators",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.name).toBe("VaultPay");
    expect(result.data.sector).toBe("Fintech");
    expect(result.data.region).toBe("Europe");
    expect(result.data.targetMarket).toBe("marketplace operators");
    expect(result.data.fundingAsk).toBe(500_000);
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

  it("builds a narrow safe startup response without difficulty or private AI fields", () => {
    const startup = buildSafeMobileStartupView({
      id: "startup-1",
      name: "VaultPay",
      sector: "Fintech",
      region: "Europe",
      stage: "idea",
      status: "draft",
      cash: 0,
      monthlyBurn: 0,
      valuation: 0,
      createdAt: new Date("2026-06-12T10:00:00.000Z"),
      updatedAt: new Date("2026-06-12T10:00:00.000Z"),
      _count: { simulationMonths: 0 },
    });

    expect(startup).toEqual({
      id: "startup-1",
      name: "VaultPay",
      sector: "Fintech",
      region: "Europe",
      founderStyle: null,
      currentMonth: 0,
      status: "draft",
      fundingStage: "idea",
      cash: 0,
      monthlyBurn: 0,
      valuation: 0,
      createdAt: "2026-06-12T10:00:00.000Z",
      updatedAt: "2026-06-12T10:00:00.000Z",
    });
    expect(JSON.stringify(startup)).not.toContain("difficulty");
    expect(JSON.stringify(startup)).not.toContain("aiAnalysis");
    expect(JSON.stringify(startup)).not.toContain("problem");
    expect(JSON.stringify(startup)).not.toContain("solution");
  });
});
