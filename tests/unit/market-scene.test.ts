import { describe, expect, it } from "vitest";
import {
  getMacroFactorPresentation,
  getMarketCtas,
  getMarketOpportunityFeed,
  getMarketScenarioPresentation,
  getSeasonCommandPresentation,
  getSectorHeatMap,
  getSectorHeatPresentation,
  getStartupMarketContext,
} from "@/lib/game/market-scene";
import { SECTORS } from "@/lib/validations";
import { BETA_SEASON_1 } from "@/lib/seasons/season-catalog";

describe("market scene presentation helpers", () => {
  it("maps macro high and low values into tactical labels", () => {
    expect(getMacroFactorPresentation("vcClimate", 60)).toMatchObject({ stance: "tailwind", tone: "emerald" });
    expect(getMacroFactorPresentation("inflationPressure", 60)).toMatchObject({ stance: "pressure", tone: "rose" });
    expect(getMacroFactorPresentation("consumerSpending", -30)).toMatchObject({ stance: "pressure" });
  });

  it("maps scenario conditions to bullish, bearish, and neutral presentations", () => {
    expect(getMarketScenarioPresentation({ key: "ai_boom", condition: "bullish" })).toMatchObject({ condition: "bullish", tone: "emerald" });
    expect(getMarketScenarioPresentation({ key: "tight_money", condition: "bearish" })).toMatchObject({ condition: "bearish", tone: "rose" });
    expect(getMarketScenarioPresentation({ key: "neutral_market", condition: "neutral" })).toMatchObject({ condition: "neutral", tone: "cyan" });
  });

  it("returns safe sector heat copy for all supported sectors", () => {
    const sectors = getSectorHeatMap({
      scenarioKey: "ai_boom",
      macro: { aiDemand: 80, enterpriseSpending: 50 },
      sectorTrends: { "AI / ML": 1.12, Fintech: 0.92 },
    });
    expect(sectors).toHaveLength(SECTORS.length);
    for (const sector of SECTORS) {
      const card = sectors.find((entry) => entry.sector === sector);
      expect(card?.summary).toBeTruthy();
      expect(card?.opportunities.length).toBeGreaterThan(0);
      expect(card?.risks.length).toBeGreaterThan(0);
    }
  });

  it("maps active startup sector to relevant context", () => {
    const context = getStartupMarketContext(
      { id: "startup-1", name: "OrbitAI", sector: "AI / ML", status: "active" },
      { macro: { aiDemand: 80 }, sectorTrends: { "AI / ML": 1.1 } }
    );
    expect(context).toMatchObject({ safeStartupId: "startup-1", sector: "AI / ML", pressure: "tailwind" });
  });

  it("does not expose private startup details without an authenticated startup context", () => {
    expect(getStartupMarketContext(null, { macro: {}, sectorTrends: {} })).toBeNull();
    const ctas = getMarketCtas({ isLoggedIn: false });
    expect(ctas.map((cta) => cta.href)).not.toContain("/dashboard");
    expect(ctas.map((cta) => cta.href)).toContain("/login");
  });

  it("handles missing season gracefully", () => {
    expect(getSeasonCommandPresentation(null)).toMatchObject({ name: "No Active Season", challengeCount: 0 });
    expect(getSeasonCommandPresentation(BETA_SEASON_1, 12)).toMatchObject({ name: "Beta Season 1", totalEntries: 12 });
  });

  it("builds market opportunity feed from macro and startup context", () => {
    const feed = getMarketOpportunityFeed(
      {
        macro: { vcClimate: 50, inflationPressure: 70 },
        event: { name: "Rate Shock", description: "Capital pressure rises.", severity: 80 },
      },
      { id: "startup-1", sector: "SaaS" }
    );
    expect(feed[0].label).toContain("SaaS");
    expect(feed.some((item) => item.label.includes("Threat"))).toBe(true);
  });

  it("produces stable, pressure, and momentum sector states", () => {
    expect(getSectorHeatPresentation("SaaS", { sectorTrends: { SaaS: 1 } })).toMatchObject({ pressure: "stable" });
    expect(getSectorHeatPresentation("SaaS", { sectorTrends: { SaaS: 1.1 } })).toMatchObject({ pressure: "tailwind" });
    expect(getSectorHeatPresentation("SaaS", { sectorTrends: { SaaS: 0.9 } })).toMatchObject({ pressure: "pressure" });
  });
});
