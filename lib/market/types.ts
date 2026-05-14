export interface MacroScores {
  vcClimate: number; // -100 to 100
  inflationPressure: number;
  geopoliticalRisk: number;
  consumerSpending: number;
  enterpriseSpending: number;
  aiDemand: number;
  cryptoSentiment: number;
  regulationPressure: number;
  supplyChainPressure: number;
  energyPrices: number;
}

export interface SectorModifier {
  demandDelta: number; // -20 to +20
  revenueDelta: number;
  burnDelta: number;
  valuationDelta: number;
  investorDelta: number;
  riskDelta: number;
  productDelta?: number;
}

export interface MarketScenario {
  key: string;
  name: string;
  description: string;
  condition: "bullish" | "neutral" | "bearish";
  macro: MacroScores;
  sectorModifiers: Record<string, SectorModifier>;
  event: {
    name: string;
    description: string;
    type: "positive" | "negative" | "neutral";
    severity: number;
    affectedSectors: string[];
    affectedRegions: string[];
  };
  gameplayEffects: {
    demandDelta: number;
    revenueDelta: number;
    burnDelta: number;
    valuationDelta: number;
    investorDelta: number;
    riskDelta: number;
    productDelta?: number;
  };
}

export interface StartupExposure {
  sector: string;
  region: string;
  macro: {
    interestRates: number;
    inflation: number;
    geopoliticalRisk: number;
    regulation: number;
    consumerDemand: number;
    enterpriseDemand: number;
    cryptoCycle: number;
    aiTrend: number;
    supplyChain: number;
    energyPrices: number;
    currencyVolatility: number;
  };
  sectorExposures: Record<string, number>;
  explanation: string;
  tailwinds: string[];
  headwinds: string[];
}

export interface MarketImpactResult {
  eventTitle: string;
  eventSummary: string;
  demandDelta: number;
  revenueDelta: number;
  burnDelta: number;
  valuationDelta: number;
  investorDelta: number;
  riskDelta: number;
  marketScoreDelta: number;
  difficultyScore: number;
  explanation: string;
  affectedBecause: string[];
}

export interface SnapshotMetadata {
  macro: MacroScores;
  scenarioKey: string;
  source: "seeded" | "manual" | "api";
}

export interface EventMetadata {
  gameplayEffects: {
    demandDelta: number;
    revenueDelta: number;
    burnDelta: number;
    valuationDelta: number;
    investorDelta: number;
    riskDelta: number;
    productDelta?: number;
  };
  affectedSectors: string[];
  affectedRegions: string[];
}
