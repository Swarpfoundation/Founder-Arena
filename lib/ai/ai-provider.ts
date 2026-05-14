import { z } from "zod";
import { StartupAnalysis, VcReviewResult, CommitteeConsensus, MarketAnalystNarrative, MonthlyBoardUpdate, FounderCoachingNote } from "./schemas";
import { OperationsAdvisorResult } from "./operations-advisor";

export interface GenerateOptions {
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  generateText(options: GenerateOptions): Promise<string>;
  generateStructured<T extends z.ZodTypeAny>(
    options: GenerateOptions & { schema: T }
  ): Promise<z.infer<T>>;

  analyzeStartupIdea(input: {
    name: string;
    description: string;
    sector: string;
    problem: string;
    solution: string;
    monetizationModel: string;
    fundingAsk: number;
  }): Promise<StartupAnalysis>;

  reviewPitch(input: {
    startupName: string;
    sector: string;
    pitchDeck: {
      problem: string;
      solution: string;
      marketSize: string;
      product: string;
      businessModel: string;
      goToMarket: string;
      competition: string;
      team?: string | null;
      financialPlan: string;
      ask: string;
      useOfFunds: string;
    };
  }): Promise<VcReviewResult>;

  generateCommitteeReview(input: {
    startupName: string;
    sector: string;
    baseScores: {
      problem: number;
      solution: number;
      market: number;
      team: number;
      business: number;
    };
    decision: string;
  }): Promise<CommitteeConsensus>;

  generateMarketAnalystNarrative(input: {
    snapshot: {
      condition: string;
      scenarioKey?: string | null;
      description: string;
      sectorTrends?: unknown;
      metadata?: unknown;
    };
    signals?: Array<{ title: string; direction: string }>;
  }): Promise<MarketAnalystNarrative>;

  generateMonthlyBoardUpdate(input: {
    startupName: string;
    month: number;
    decisions: string[];
    cashBefore: number;
    cashAfter: number;
    burnRate: number;
    revenue: number;
    productProgress: number;
    marketCondition: string;
    eventTitle?: string;
    eventSummary?: string;
    sector: string;
  }): Promise<MonthlyBoardUpdate>;

  generateFounderCoaching(input: {
    context: "pitch_review" | "term_sheet" | "monthly_simulation" | "final_outcome";
    startupName: string;
    sector: string;
    outcomeSummary: string;
  }): Promise<FounderCoachingNote>;

  generateOperationsAdvisor(input: {
    startupName: string;
    sector: string;
    stage: string;
    classification: string;
    month: number;
    cash: number;
    monthlyBurn: number;
    revenue: number;
    runwayMonths: number;
    productProgress: number;
    investorScore: number;
    marketScore: number;
    riskScore: number;
    activeMissionTitle?: string;
    activeMissionCategory?: string;
    missionProgress: number;
    roleGaps: string[];
    teamSize: number;
    recentDecisions: string[];
    marketCondition: string;
    eventHistory: string[];
  }): Promise<OperationsAdvisorResult>;
}
