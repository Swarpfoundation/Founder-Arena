import { SECTORS } from "@/lib/validations";
import type { ArenaSeason } from "@/lib/seasons/types";

export type MarketTone = "cyan" | "violet" | "rose" | "amber" | "emerald" | "white";
export type MarketPressure = "tailwind" | "stable" | "pressure";

export interface MacroFactorPresentation {
  key: string;
  label: string;
  value: number;
  tone: MarketTone;
  stance: MarketPressure;
  status: string;
  explanation: string;
}

export interface MarketScenarioInput {
  key?: string | null;
  name?: string | null;
  description?: string | null;
  condition?: string | null;
}

export interface MarketScenarioPresentation {
  label: string;
  condition: "bullish" | "neutral" | "bearish";
  tone: MarketTone;
  direction: string;
  summary: string;
}

export interface MarketStateInput {
  scenarioKey?: string | null;
  condition?: string | null;
  macro?: Record<string, number> | null;
  sectorTrends?: Record<string, number> | null;
  event?: {
    name?: string | null;
    description?: string | null;
    severity?: number | null;
    affectedSectors?: string[] | null;
  } | null;
}

export interface SectorHeatPresentation {
  sector: string;
  trendValue: number;
  tone: MarketTone;
  pressure: MarketPressure;
  label: string;
  summary: string;
  opportunities: string[];
  risks: string[];
}

export interface SeasonCommandPresentation {
  name: string;
  status: string;
  tagline: string;
  challengeCount: number;
  totalEntries: number;
  tone: MarketTone;
  summary: string;
}

export interface StartupMarketContextInput {
  id?: string | null;
  name?: string | null;
  sector?: string | null;
  status?: string | null;
  currentStep?: number | null;
}

export interface StartupMarketContextPresentation {
  safeStartupId: string | null;
  name: string;
  sector: string;
  pressure: MarketPressure;
  tone: MarketTone;
  summary: string;
  ctas: Array<{ label: string; href: string; tone: MarketTone }>;
}

export const MACRO_FACTOR_CONFIGS = [
  { key: "vcClimate", label: "VC Climate", helpfulHigh: true },
  { key: "inflationPressure", label: "Inflation Pressure", helpfulHigh: false },
  { key: "geopoliticalRisk", label: "Geopolitical Risk", helpfulHigh: false },
  { key: "consumerSpending", label: "Consumer Spending", helpfulHigh: true },
  { key: "enterpriseSpending", label: "Enterprise Spending", helpfulHigh: true },
  { key: "aiDemand", label: "AI Demand", helpfulHigh: true },
  { key: "cryptoSentiment", label: "Crypto Sentiment", helpfulHigh: true },
  { key: "regulationPressure", label: "Regulation Pressure", helpfulHigh: false },
  { key: "supplyChainPressure", label: "Supply Chain", helpfulHigh: false },
  { key: "energyPrices", label: "Energy Prices", helpfulHigh: false },
] as const;

const SECTOR_COPY: Record<string, { summary: string; opportunities: string[]; risks: string[] }> = {
  SaaS: {
    summary: "Recurring revenue can compound, but buyers punish weak urgency.",
    opportunities: ["Enterprise budgets", "AI workflow demand"],
    risks: ["Long sales cycles", "Crowded categories"],
  },
  Fintech: {
    summary: "Capital is available when trust, compliance, and distribution are credible.",
    opportunities: ["Payments pressure", "Trust infrastructure"],
    risks: ["Regulation", "Security scrutiny"],
  },
  Healthtech: {
    summary: "High-value problems with slower adoption and heavier proof burden.",
    opportunities: ["Workflow automation", "Outcome evidence"],
    risks: ["Compliance", "Procurement drag"],
  },
  "AI / ML": {
    summary: "AI demand is hot, but inference bills and trust risk punish weak execution.",
    opportunities: ["Enterprise AI demand", "Automation budgets"],
    risks: ["Infra cost", "AI hype discount"],
  },
  "E-commerce": {
    summary: "Consumer spend and CAC swings can change the run quickly.",
    opportunities: ["Niche commerce", "Retention loops"],
    risks: ["Margin pressure", "Demand volatility"],
  },
  Consumer: {
    summary: "Growth can spike fast, but sentiment turns quickly.",
    opportunities: ["Viral loops", "Community trust"],
    risks: ["Retention", "Consumer spending drops"],
  },
  Enterprise: {
    summary: "Slower cycles, stronger contracts, and a heavier proof burden.",
    opportunities: ["Large contracts", "Operational pain"],
    risks: ["Procurement", "Security review"],
  },
  Climate: {
    summary: "Policy and energy costs shape the opportunity window.",
    opportunities: ["Energy transition", "Regulatory tailwinds"],
    risks: ["Hardware timelines", "Policy timing"],
  },
  EdTech: {
    summary: "Mission-driven budgets need proof, distribution, and patience.",
    opportunities: ["Skills pressure", "Institutional gaps"],
    risks: ["Budget cycles", "Slow adoption"],
  },
  Other: {
    summary: "Unmapped sectors need clearer positioning to win investor trust.",
    opportunities: ["Novel category", "Founder insight"],
    risks: ["Market ambiguity", "Investor education"],
  },
};

export function getMacroFactorPresentation(key: string, value: number): MacroFactorPresentation {
  const config = MACRO_FACTOR_CONFIGS.find((factor) => factor.key === key);
  const helpfulHigh = config?.helpfulHigh ?? true;
  const strong = Math.abs(value) >= 50;
  const stance: MarketPressure =
    value === 0 ? "stable" : helpfulHigh ? (value > 0 ? "tailwind" : "pressure") : (value > 0 ? "pressure" : "tailwind");
  const tone: MarketTone = stance === "tailwind" ? "emerald" : stance === "pressure" ? (strong ? "rose" : "amber") : "cyan";
  return {
    key,
    label: config?.label ?? titleize(key),
    value,
    tone,
    stance,
    status: stance === "tailwind" ? "Tailwind" : stance === "pressure" ? "Pressure" : "Stable",
    explanation:
      stance === "tailwind"
        ? "This factor is currently helping startup conditions."
        : stance === "pressure"
          ? "This factor is adding operating or fundraising pressure."
          : "This factor is not strongly moving the arena.",
  };
}

export function getMarketScenarioPresentation(input: MarketScenarioInput): MarketScenarioPresentation {
  const condition = input.condition === "bullish" || input.condition === "bearish" ? input.condition : "neutral";
  return {
    label: input.name ?? titleize(input.key ?? "unknown_market"),
    condition,
    tone: condition === "bullish" ? "emerald" : condition === "bearish" ? "rose" : "cyan",
    direction: condition === "bullish" ? "Bullish" : condition === "bearish" ? "Bearish" : "Neutral",
    summary: input.description ?? "The market scenario is available, but no detailed brief was provided.",
  };
}

export function getSectorHeatPresentation(sector: string, marketState: MarketStateInput): SectorHeatPresentation {
  const trendValue = resolveSectorTrend(sector, marketState.sectorTrends);
  const pressure: MarketPressure = trendValue >= 1.05 ? "tailwind" : trendValue <= 0.95 ? "pressure" : "stable";
  const copy = SECTOR_COPY[sector] ?? SECTOR_COPY.Other;
  const scenario = (marketState.scenarioKey ?? "").toLowerCase();
  const macro = marketState.macro ?? {};
  const opportunities = [...copy.opportunities];
  const risks = [...copy.risks];

  if (sector === "AI / ML" && (macro.aiDemand ?? 0) > 25) opportunities.unshift("AI demand surge");
  if (sector === "Fintech" && (macro.regulationPressure ?? 0) > 25) risks.unshift("Regulatory pressure");
  if ((sector === "Consumer" || sector === "E-commerce") && (macro.consumerSpending ?? 0) < -20) risks.unshift("Consumer pullback");
  if ((sector === "SaaS" || sector === "Enterprise") && (macro.enterpriseSpending ?? 0) > 20) opportunities.unshift("Enterprise budget expansion");
  if (scenario.includes("interest") || scenario.includes("tight")) risks.unshift("Tight-money valuation pressure");

  return {
    sector,
    trendValue,
    tone: pressure === "tailwind" ? "emerald" : pressure === "pressure" ? "rose" : "cyan",
    pressure,
    label: pressure === "tailwind" ? "Momentum" : pressure === "pressure" ? "Under Pressure" : "Stable",
    summary: copy.summary,
    opportunities: unique(opportunities).slice(0, 3),
    risks: unique(risks).slice(0, 3),
  };
}

export function getSectorHeatMap(marketState: MarketStateInput): SectorHeatPresentation[] {
  return SECTORS.map((sector) => getSectorHeatPresentation(sector, marketState));
}

export function getSeasonCommandPresentation(season: ArenaSeason | null | undefined, totalEntries = 0): SeasonCommandPresentation {
  if (!season) {
    return {
      name: "No Active Season",
      status: "offline",
      tagline: "Arena season data is unavailable.",
      challengeCount: 0,
      totalEntries,
      tone: "white",
      summary: "Leaderboard season data is missing, but the market map can still be read.",
    };
  }
  return {
    name: season.name,
    status: season.status,
    tagline: season.tagline,
    challengeCount: season.challenges.length,
    totalEntries,
    tone: season.status === "active" ? "emerald" : "white",
    summary: season.lore,
  };
}

export function getStartupMarketContext(startup: StartupMarketContextInput | null | undefined, marketState: MarketStateInput): StartupMarketContextPresentation | null {
  if (!startup?.id || !startup.sector) return null;
  const sector = getSectorHeatPresentation(startup.sector, marketState);
  return {
    safeStartupId: startup.id,
    name: startup.name ?? "Active startup",
    sector: startup.sector,
    pressure: sector.pressure,
    tone: sector.tone,
    summary: `${startup.sector} is currently ${sector.label.toLowerCase()}. ${sector.summary}`,
    ctas: [
      { label: "Return To Operate", href: `/startup/${startup.id}/operate`, tone: "cyan" },
      { label: "View Strategy", href: `/startup/${startup.id}/strategy`, tone: "violet" },
      { label: "Scan Rivals", href: `/startup/${startup.id}/rivals`, tone: "amber" },
    ],
  };
}

export function getMarketOpportunityFeed(marketState: MarketStateInput, startup?: StartupMarketContextInput | null): Array<{
  label: string;
  detail: string;
  tone: MarketTone;
}> {
  const macroPresentations = MACRO_FACTOR_CONFIGS.map((factor) => getMacroFactorPresentation(factor.key, marketState.macro?.[factor.key] ?? 0));
  const topTailwind = [...macroPresentations].sort((a, b) => scoreTone(b) - scoreTone(a)).find((factor) => factor.stance === "tailwind");
  const topPressure = [...macroPresentations].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).find((factor) => factor.stance === "pressure");
  const feed = [
    topTailwind ? { label: `Opportunity: ${topTailwind.label}`, detail: topTailwind.explanation, tone: topTailwind.tone } : null,
    topPressure ? { label: `Threat: ${topPressure.label}`, detail: topPressure.explanation, tone: topPressure.tone } : null,
    marketState.event?.name ? { label: `Live Event: ${marketState.event.name}`, detail: marketState.event.description ?? "Market event is active.", tone: eventTone(marketState.event.severity ?? 0) } : null,
  ].filter((item): item is { label: string; detail: string; tone: MarketTone } => Boolean(item));

  if (startup?.sector) {
    const sector = getSectorHeatPresentation(startup.sector, marketState);
    feed.unshift({
      label: `${startup.sector} Sector Read`,
      detail: sector.summary,
      tone: sector.tone,
    });
  }

  return feed.slice(0, 5);
}

export function getMarketCtas(input: { isLoggedIn: boolean; activeStartupId?: string | null }): Array<{ label: string; href: string; tone: MarketTone }> {
  if (input.activeStartupId) {
    return [
      { label: "Operate Startup", href: `/startup/${input.activeStartupId}/operate`, tone: "cyan" },
      { label: "Arena Leaderboard", href: "/leaderboard", tone: "amber" },
      { label: "Command Deck", href: "/dashboard", tone: "white" },
    ];
  }
  if (input.isLoggedIn) {
    return [
      { label: "Deploy Startup", href: "/startup/new", tone: "cyan" },
      { label: "Command Deck", href: "/dashboard", tone: "white" },
    ];
  }
  return [
    { label: "Start Founder Arena", href: "/login", tone: "cyan" },
    { label: "View Leaderboard", href: "/leaderboard", tone: "amber" },
  ];
}

function resolveSectorTrend(sector: string, trends?: Record<string, number> | null): number {
  if (!trends) return 1;
  const direct = trends[sector];
  if (typeof direct === "number") return direct;
  const normalized = normalizeSector(sector);
  const match = Object.entries(trends).find(([key]) => normalizeSector(key) === normalized);
  return typeof match?.[1] === "number" ? match[1] : 1;
}

function normalizeSector(sector: string): string {
  return sector.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function titleize(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function eventTone(severity: number): MarketTone {
  if (severity >= 70) return "rose";
  if (severity >= 40) return "amber";
  return "cyan";
}

function scoreTone(factor: MacroFactorPresentation): number {
  if (factor.stance !== "tailwind") return -Infinity;
  return Math.abs(factor.value);
}
