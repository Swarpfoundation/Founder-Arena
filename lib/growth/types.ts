export type GrowthRoundType =
  | "seed_extension"
  | "series_a"
  | "series_b"
  | "strategic_round"
  | "bridge_round";

export type OfferType =
  | "strategic_investment"
  | "acquisition"
  | "partnership"
  | "distribution_deal"
  | "cloud_credits"
  | "api_partnership"
  | "platform_integration"
  | "acquihire"
  | "rejected_interest";

export type OfferStatus =
  | "proposed"
  | "accepted"
  | "rejected"
  | "countered"
  | "expired";

export type ReadinessStatus = "not_ready" | "borderline" | "ready" | "strong";

export type GrowthStage =
  | "not_started"
  | "growth_ready"
  | "raising_series_a"
  | "raising_series_b"
  | "strategic_negotiation"
  | "acquired"
  | "exited";

export interface StrategicActor {
  id: string;
  displayName: string;
  actorType: string;
  sectorsOfInterest: string[];
  preferredStages: GrowthStage[];
  investmentRange: { min: number; max: number };
  acquisitionRange: { min: number; max: number };
  partnershipTypes: OfferType[];
  strategicMotivation: string;
  riskNotes: string;
  dealStyle: "aggressive" | "standard" | "cautious";
  inspiredByCategory: string;
  disclaimer: string;
}

export interface StrategicOffer {
  offerId: string;
  actorId: string;
  actorName: string;
  actorType: string;
  offerType: OfferType;
  headline: string;
  amount: number | null;
  equityPercent: number | null;
  acquisitionPrice: number | null;
  valuation: number | null;
  terms: string[];
  benefits: string[];
  risks: string[];
  conditions: string[];
  expiresInMonths: number;
  recommendedAction: "accept" | "reject" | "counter" | "defer";
  fitScore: number;
}

export interface ReadinessResult {
  score: number;
  status: ReadinessStatus;
  reasons: string[];
  blockers: string[];
  recommendedNextMove: string;
}

export interface GrowthEligibility {
  seriesA: ReadinessResult;
  seriesB: ReadinessResult;
  acquisition: ReadinessResult;
  strategicFit: Record<string, ReadinessResult>;
}

export interface OfferResolution {
  offerId: string;
  action: "accept" | "reject" | "counter" | "defer";
  outcome: {
    cashDelta?: number;
    valuationDelta?: number;
    equityDelta?: number;
    statusChange?: GrowthStage;
    newFundingRound?: {
      roundType: string;
      amountRaised: number;
      equitySold: number;
      preMoneyValuation: number;
      postMoneyValuation: number;
      investorName: string;
      investorType: string;
    };
    acquisitionOutcome?: {
      acquisitionPrice: number;
      acquirerName: string;
      finalReturn: number;
    };
    narrative: string;
  };
}

export interface GrowthStateContext {
  startupId: string;
  cash: number;
  monthlyBurn: number;
  revenue: number;
  valuation: number;
  productProgress: number;
  investorScore: number;
  marketScore: number;
  riskScore: number;
  sector: string;
  stage: string;
  status: string;
  monthsSurvived: number;
  simulationHistory: Array<{
    monthNumber: number;
    cashEnd: number;
    revenue: number;
    burnRate: number;
    eventTitle?: string;
    eventSeverity?: string;
  }>;
  teamSize: number;
  fundingRounds: Array<{
    roundType: string;
    amountRaised: number;
    equitySold: number;
  }>;
  // Phase 24B: Mission context
  missionCompletionRate?: number;
  completedMissions?: number;
  totalMissions?: number;
  activeMissionProgress?: number;
}
