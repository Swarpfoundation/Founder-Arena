import { RawMarketSignal, NormalizedMarketSignal, SignalDirection } from "./types";

const SECTOR_KEYWORDS: Record<string, string[]> = {
  ai: ["ai", "artificial intelligence", "machine learning", "ml", "llm", "generative", "neural"],
  fintech: ["fintech", "finance", "banking", "payments", "lending", "defi", "crypto", "blockchain"],
  web3: ["web3", "crypto", "blockchain", "nft", "defi", "dao", "token"],
  gaming: ["gaming", "game", "esports", "metaverse", "play-to-earn", "player"],
  saas: ["saas", "software", "enterprise", "b2b", "cloud", "subscription"],
  healthcare: ["health", "healthcare", "biotech", "medical", "diagnostic", "pharma", "life science"],
  logistics: ["logistics", "supply chain", "shipping", "delivery", "transport", "warehouse"],
  energy: ["energy", "renewable", "solar", "wind", "clean tech", "climate", "carbon"],
  consumer: ["consumer", "b2c", "retail", "ecommerce", "marketplace", "shopping"],
  hardware: ["hardware", "robotics", "semiconductor", "chip", "iot", "device", "manufacturing"],
  marketplace: ["marketplace", "platform", "network", "exchange"],
  defense: ["defense", "security", "cybersecurity", "military", "govtech"],
};

const REGION_KEYWORDS: Record<string, string[]> = {
  global: ["global", "worldwide", "international"],
  us: ["us", "united states", "america", "federal", "washington"],
  europe: ["europe", "eu", "european", "germany", "france", "uk"],
  asia: ["asia", "china", "japan", "india", "southeast asia"],
  africa: ["africa", "african", "nigeria", "kenya", "south africa"],
  "middle east": ["middle east", "gcc", "saudi", "uae", "israel"],
  "latin america": ["latin america", "brazil", "mexico", "latam"],
};

const SIGNAL_TYPE_TO_MACRO: Record<string, string[]> = {
  macro: ["vcClimate", "inflationPressure"],
  ai: ["aiDemand", "enterpriseSpending"],
  crypto: ["cryptoSentiment", "vcClimate"],
  regulation: ["regulationPressure", "vcClimate"],
  geopolitical: ["geopoliticalRisk", "supplyChainPressure", "energyPrices"],
  inflation: ["inflationPressure", "consumerSpending", "enterpriseSpending"],
  supply_chain: ["supplyChainPressure", "energyPrices"],
  energy: ["energyPrices", "inflationPressure"],
  consumer: ["consumerSpending", "inflationPressure"],
  enterprise: ["enterpriseSpending", "aiDemand"],
  funding: ["vcClimate", "enterpriseSpending"],
};

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function mapKeywords(text: string, keywordMap: Record<string, string[]>): string[] {
  const lower = text.toLowerCase();
  const results: string[] = [];
  for (const [key, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      results.push(key);
    }
  }
  return results;
}

function boundSeverity(value: number): number {
  return Math.max(1, Math.min(100, Math.round(value)));
}

function boundConfidence(value: number): number {
  return Math.max(1, Math.min(100, Math.round(value)));
}

function calculateProposedEffects(
  signalType: string,
  direction: SignalDirection,
  severity: number,
  confidence: number
): NormalizedMarketSignal["proposedEffects"] {
  const weight = (severity / 100) * (confidence / 100);
  const sign = direction === "positive" ? 1 : direction === "negative" ? -1 : 0;
  const base = weight * 10 * sign;

  // Signal-type-specific effect weighting
  switch (signalType) {
    case "ai":
      return {
        demandDelta: base * 1.5,
        revenueDelta: base * 1.2,
        burnDelta: direction === "positive" ? -base * 0.3 : base * 0.2,
        valuationDelta: base * 1.5,
        investorDelta: base * 1.2,
        riskDelta: direction === "positive" ? -base * 0.3 : base * 0.4,
      };
    case "crypto":
      return {
        demandDelta: base * 1.8,
        revenueDelta: base * 1.5,
        burnDelta: 0,
        valuationDelta: base * 2.0,
        investorDelta: base * 1.5,
        riskDelta: direction === "positive" ? -base * 0.5 : base * 0.8,
      };
    case "regulation":
      return {
        demandDelta: base * 0.5,
        revenueDelta: base * 0.3,
        burnDelta: Math.abs(base) * 0.8,
        valuationDelta: base * 0.8,
        investorDelta: base * 0.6,
        riskDelta: Math.abs(base) * 1.2,
      };
    case "inflation":
      return {
        demandDelta: base * 0.8,
        revenueDelta: base * 0.5,
        burnDelta: Math.abs(base) * 0.5,
        valuationDelta: base * 0.6,
        investorDelta: base * 0.4,
        riskDelta: Math.abs(base) * 0.6,
      };
    case "geopolitical":
      return {
        demandDelta: base * 0.3,
        revenueDelta: base * 0.2,
        burnDelta: Math.abs(base) * 0.5,
        valuationDelta: base * 0.4,
        investorDelta: base * 0.5,
        riskDelta: Math.abs(base) * 1.0,
      };
    case "supply_chain":
      return {
        demandDelta: base * 0.4,
        revenueDelta: base * 0.3,
        burnDelta: Math.abs(base) * 1.0,
        valuationDelta: base * 0.5,
        investorDelta: base * 0.3,
        riskDelta: Math.abs(base) * 0.8,
      };
    case "energy":
      return {
        demandDelta: base * 0.3,
        revenueDelta: base * 0.2,
        burnDelta: Math.abs(base) * 0.8,
        valuationDelta: base * 0.3,
        investorDelta: base * 0.2,
        riskDelta: Math.abs(base) * 0.5,
      };
    case "consumer":
      return {
        demandDelta: base * 1.2,
        revenueDelta: base * 1.0,
        burnDelta: 0,
        valuationDelta: base * 0.8,
        investorDelta: base * 0.6,
        riskDelta: Math.abs(base) * 0.4,
      };
    case "enterprise":
      return {
        demandDelta: base * 1.0,
        revenueDelta: base * 0.9,
        burnDelta: direction === "positive" ? -base * 0.2 : 0,
        valuationDelta: base * 1.0,
        investorDelta: base * 0.8,
        riskDelta: Math.abs(base) * 0.3,
      };
    case "funding":
      return {
        demandDelta: base * 0.6,
        revenueDelta: base * 0.4,
        burnDelta: 0,
        valuationDelta: base * 1.2,
        investorDelta: base * 1.5,
        riskDelta: Math.abs(base) * 0.3,
      };
    default:
      return {
        demandDelta: base,
        revenueDelta: base * 0.8,
        burnDelta: 0,
        valuationDelta: base * 0.6,
        investorDelta: base * 0.5,
        riskDelta: Math.abs(base) * 0.4,
      };
  }
}

export function normalizeSignal(raw: RawMarketSignal): NormalizedMarketSignal {
  const text = `${raw.title} ${raw.summary}`;

  const mappedSectors = raw.sectors?.length
    ? raw.sectors.map((s) => s.toLowerCase())
    : mapKeywords(text, SECTOR_KEYWORDS);

  const mappedRegions = raw.regions?.length
    ? raw.regions.map((r) => r.toLowerCase())
    : mapKeywords(text, REGION_KEYWORDS);

  const macroDimensions = SIGNAL_TYPE_TO_MACRO[raw.signalType] ?? ["vcClimate"];

  const severity = boundSeverity(raw.severity);
  let confidence = boundConfidence(raw.confidence);

  // Source-type confidence caps to prevent any single source from dominating
  const SOURCE_CONFIDENCE_CAP: Record<string, number> = {
    newsapi: 60,
    fred: 85,
    crypto: 55,
    static: 70,
  };
  const cap = SOURCE_CONFIDENCE_CAP[raw.source];
  if (cap !== undefined && confidence > cap) {
    confidence = cap;
  }

  const proposedEffects = calculateProposedEffects(raw.signalType, raw.direction, severity, confidence);

  // Round effects to reasonable precision
  for (const key of Object.keys(proposedEffects) as Array<keyof typeof proposedEffects>) {
    proposedEffects[key] = Math.round(proposedEffects[key] * 10) / 10;
  }

  const hash = hashString(`${raw.source}:${raw.sourceId}:${raw.title}`);

  const explanation = `${raw.signalType} signal from ${raw.source}: ${raw.direction} direction with severity ${severity}/100 and confidence ${confidence}/100. ` +
    `Affects sectors: ${mappedSectors.slice(0, 3).join(", ") || "general"}. ` +
    `Macro dimensions: ${macroDimensions.join(", ")}.`;

  return {
    id: raw.id,
    sourceId: raw.sourceId,
    source: raw.source,
    title: raw.title,
    summary: raw.summary,
    url: raw.url,
    publishedAt: raw.publishedAt,
    signalType: raw.signalType,
    direction: raw.direction,
    severity,
    confidence,
    mappedSectors,
    mappedRegions,
    macroDimensions,
    proposedEffects,
    explanation,
    hash,
  };
}

export function deduplicateSignals(signals: NormalizedMarketSignal[]): NormalizedMarketSignal[] {
  const seen = new Set<string>();
  const result: NormalizedMarketSignal[] = [];

  for (const signal of signals) {
    if (seen.has(signal.hash)) continue;
    seen.add(signal.hash);
    result.push(signal);
  }

  return result;
}
