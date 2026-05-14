import { BaseProvider } from "./base";
import { RawMarketSignal, ProviderConfig } from "../types";

/**
 * Static provider produces deterministic sample signals based on month index.
 * No API keys required. Always available.
 */
export class StaticProvider extends BaseProvider {
  readonly name = "static";

  async fetchSignals(config: ProviderConfig): Promise<RawMarketSignal[]> {
    const monthIndex = config.monthIndex ?? new Date().getMonth();
    const date = config.date ?? new Date();
    return generateStaticSignals(monthIndex, date);
  }
}

function generateStaticSignals(monthIndex: number, date: Date): RawMarketSignal[] {
  const signals: RawMarketSignal[] = [];

  // Deterministic variation based on month
  const cycle = Math.sin(monthIndex * 0.5) * 50 + 50; // 0-100
  const offset = monthIndex % 3;

  // AI signal
  signals.push({
    id: `static-ai-${monthIndex}`,
    sourceId: `static-ai-${monthIndex}`,
    source: "static",
    title: "AI Enterprise Adoption Trends",
    summary: cycle > 60
      ? "Enterprise AI adoption is accelerating. Large buyers are increasing procurement of AI-native tools."
      : "AI adoption remains steady but enterprise buyers are becoming more selective.",
    publishedAt: date,
    signalType: "ai",
    direction: cycle > 60 ? "positive" : cycle > 40 ? "neutral" : "negative",
    severity: Math.round(30 + cycle * 0.4),
    confidence: 70,
    sectors: ["ai", "saas", "enterprise"],
    regions: ["global"],
  });

  // Inflation signal
  signals.push({
    id: `static-inflation-${monthIndex}`,
    sourceId: `static-inflation-${monthIndex}`,
    source: "static",
    title: "Inflation Pressure Update",
    summary: offset === 0
      ? "Inflation remains elevated. Central banks signal continued caution on rate cuts."
      : offset === 1
      ? "Inflation showing signs of moderation in key economies."
      : "Core inflation sticky but headline rates declining.",
    publishedAt: date,
    signalType: "inflation",
    direction: offset === 0 ? "negative" : "neutral",
    severity: Math.round(40 + offset * 10),
    confidence: 65,
    sectors: ["fintech", "b2c", "saas"],
    regions: ["global", "us", "europe"],
  });

  // Geopolitical signal
  signals.push({
    id: `static-geo-${monthIndex}`,
    sourceId: `static-geo-${monthIndex}`,
    source: "static",
    title: "Geopolitical Risk Monitor",
    summary: "Trade tensions and regional conflicts continue to create uncertainty for global supply chains and capital flows.",
    publishedAt: date,
    signalType: "geopolitical",
    direction: "negative",
    severity: Math.round(45 + (monthIndex % 2) * 15),
    confidence: 60,
    sectors: ["logistics", "hardware", "energy"],
    regions: ["asia", "europe", "middle east"],
  });

  // Crypto signal
  signals.push({
    id: `static-crypto-${monthIndex}`,
    sourceId: `static-crypto-${monthIndex}`,
    source: "static",
    title: "Digital Asset Market Sentiment",
    summary: monthIndex % 4 === 0
      ? "Crypto markets showing renewed institutional interest. ETF flows positive."
      : monthIndex % 4 === 2
      ? "Regulatory uncertainty weighing on digital asset valuations."
      : "Crypto sentiment mixed with sideways price action.",
    publishedAt: date,
    signalType: "crypto",
    direction: monthIndex % 4 === 0 ? "positive" : monthIndex % 4 === 2 ? "negative" : "neutral",
    severity: Math.round(35 + (monthIndex % 4) * 8),
    confidence: 55,
    sectors: ["web3", "fintech", "gaming"],
    regions: ["global", "us", "asia"],
  });

  // Regulation signal
  signals.push({
    id: `static-reg-${monthIndex}`,
    sourceId: `static-reg-${monthIndex}`,
    source: "static",
    title: "Regulatory Environment Update",
    summary: "Financial regulators maintaining scrutiny on fintech, AI, and data privacy. New compliance requirements expected.",
    publishedAt: date,
    signalType: "regulation",
    direction: "negative",
    severity: Math.round(40 + (monthIndex % 3) * 10),
    confidence: 70,
    sectors: ["fintech", "ai", "healthcare"],
    regions: ["us", "europe"],
  });

  // Energy signal
  signals.push({
    id: `static-energy-${monthIndex}`,
    sourceId: `static-energy-${monthIndex}`,
    source: "static",
    title: "Energy Price Volatility",
    summary: "Energy markets experiencing seasonal volatility. Data center power costs under pressure in key regions.",
    publishedAt: date,
    signalType: "energy",
    direction: "negative",
    severity: Math.round(35 + (monthIndex % 5) * 6),
    confidence: 60,
    sectors: ["climate", "ai", "hardware"],
    regions: ["europe", "asia", "us"],
  });

  // Supply chain signal
  signals.push({
    id: `static-supply-${monthIndex}`,
    sourceId: `static-supply-${monthIndex}`,
    source: "static",
    title: "Supply Chain Pressure Index",
    summary: "Shipping costs and component lead times remain elevated. Hardware startups facing extended procurement cycles.",
    publishedAt: date,
    signalType: "supply_chain",
    direction: "negative",
    severity: Math.round(40 + (monthIndex % 4) * 5),
    confidence: 65,
    sectors: ["hardware", "logistics", "manufacturing"],
    regions: ["asia", "europe"],
  });

  // VC / Funding signal
  signals.push({
    id: `static-vc-${monthIndex}`,
    sourceId: `static-vc-${monthIndex}`,
    source: "static",
    title: "Venture Capital Climate",
    summary: cycle > 55
      ? "VC deal flow stabilizing. Selective but active investors in AI and enterprise SaaS."
      : "Venture funding remains cautious. Down rounds and extended fundraising timelines common.",
    publishedAt: date,
    signalType: "funding",
    direction: cycle > 55 ? "positive" : "negative",
    severity: Math.round(30 + Math.abs(cycle - 55)),
    confidence: 65,
    sectors: ["ai", "saas", "enterprise", "fintech"],
    regions: ["us", "europe", "asia"],
  });

  // Consumer signal
  signals.push({
    id: `static-consumer-${monthIndex}`,
    sourceId: `static-consumer-${monthIndex}`,
    source: "static",
    title: "Consumer Spending Outlook",
    summary: offset === 0
      ? "Household discretionary spending under pressure from inflation and rate hikes."
      : "Consumer confidence improving slowly. E-commerce and gaming showing resilience.",
    publishedAt: date,
    signalType: "consumer",
    direction: offset === 0 ? "negative" : "neutral",
    severity: Math.round(35 + offset * 8),
    confidence: 60,
    sectors: ["b2c", "ecommerce", "gaming", "consumer"],
    regions: ["us", "europe"],
  });

  // Enterprise signal
  signals.push({
    id: `static-enterprise-${monthIndex}`,
    sourceId: `static-enterprise-${monthIndex}`,
    source: "static",
    title: "Enterprise Software Budgets",
    summary: cycle > 50
      ? "CIOs maintaining or expanding software budgets. AI and security remain top priorities."
      : "Enterprise buyers extending procurement cycles. ROI scrutiny increasing.",
    publishedAt: date,
    signalType: "enterprise",
    direction: cycle > 50 ? "positive" : "neutral",
    severity: Math.round(30 + Math.abs(cycle - 50) * 0.5),
    confidence: 70,
    sectors: ["saas", "enterprise", "cybersecurity", "ai"],
    regions: ["us", "europe"],
  });

  return signals;
}
