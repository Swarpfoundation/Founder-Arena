/**
 * Market Data Adapter Types
 *
 * Raw signals → Normalized signals → Market interpretation → Snapshot
 */

export type SignalType =
  | "macro"
  | "ai"
  | "crypto"
  | "regulation"
  | "geopolitical"
  | "inflation"
  | "supply_chain"
  | "energy"
  | "consumer"
  | "enterprise"
  | "funding";

export type SignalDirection = "positive" | "negative" | "neutral";

export interface RawMarketSignal {
  id: string;
  sourceId: string;
  source: string;
  title: string;
  summary: string;
  url?: string;
  publishedAt: Date;
  regions?: string[];
  sectors?: string[];
  signalType: SignalType;
  direction: SignalDirection;
  severity: number; // 1-100
  confidence: number; // 1-100
  metadata?: Record<string, unknown>;
}

export interface NormalizedMarketSignal {
  id: string;
  sourceId: string;
  source: string;
  title: string;
  summary: string;
  url?: string;
  publishedAt: Date;
  signalType: SignalType;
  direction: SignalDirection;
  severity: number; // bounded 1-100
  confidence: number; // bounded 1-100
  mappedSectors: string[];
  mappedRegions: string[];
  macroDimensions: string[];
  proposedEffects: {
    demandDelta: number;
    revenueDelta: number;
    burnDelta: number;
    valuationDelta: number;
    investorDelta: number;
    riskDelta: number;
  };
  explanation: string;
  hash: string; // deduplication key
}

export interface InterpretedMarketState {
  macroScores: {
    vcClimate: number;
    inflationPressure: number;
    geopoliticalRisk: number;
    consumerSpending: number;
    enterpriseSpending: number;
    aiDemand: number;
    cryptoSentiment: number;
    regulationPressure: number;
    supplyChainPressure: number;
    energyPrices: number;
  };
  sectorModifiers: Record<string, {
    demandDelta: number;
    revenueDelta: number;
    burnDelta: number;
    valuationDelta: number;
    investorDelta: number;
    riskDelta: number;
  }>;
  condition: "bullish" | "neutral" | "bearish";
  overallConfidence: number;
  signalCount: number;
  topSignals: Array<{ title: string; direction: string; severity: number }>;
  explanation: string;
}

export interface BuildSnapshotResult {
  snapshotId?: string;
  runId: string;
  success: boolean;
  error?: string;
  signalsUsed: number;
  scenarioKey: string;
}

export type ProviderMode = "static" | "seeded" | "external" | "hybrid";

export interface ProviderConfig {
  mode: ProviderMode;
  monthIndex?: number;
  date?: Date;
}

export interface ProviderFetchResult {
  signals: RawMarketSignal[];
  source: string;
  error?: string;
}
