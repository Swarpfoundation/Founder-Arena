import type { PitchDeck, Startup } from "@prisma/client";
import type { AIReviewInput } from "./types";

type StartupWithPitch = Pick<
  Startup,
  | "id"
  | "name"
  | "sector"
  | "region"
  | "stage"
  | "fundingAsk"
  | "monetizationModel"
  | "aiAnalysis"
> & {
  pitchDeck: Pick<
    PitchDeck,
    | "problem"
    | "solution"
    | "marketSize"
    | "product"
    | "businessModel"
    | "goToMarket"
    | "competition"
    | "team"
    | "financialPlan"
    | "ask"
    | "useOfFunds"
  > | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getClassification(aiAnalysis: unknown): string | undefined {
  if (!isRecord(aiAnalysis)) return undefined;
  const classification = aiAnalysis.classification;
  if (typeof classification === "string") return classification;
  if (isRecord(classification) && typeof classification.primary === "string") return classification.primary;
  if (isRecord(classification) && typeof classification.type === "string") return classification.type;
  return undefined;
}

export function buildAIReviewSafeInput(startup: StartupWithPitch): AIReviewInput {
  if (!startup.pitchDeck) {
    throw new Error("Pitch deck not found");
  }

  return {
    startupId: startup.id,
    startupName: startup.name,
    sector: startup.sector,
    region: startup.region,
    stage: startup.stage,
    classification: getClassification(startup.aiAnalysis),
    fundingAsk: startup.fundingAsk,
    monetizationModel: startup.monetizationModel,
    pitchDeck: {
      problem: startup.pitchDeck.problem,
      solution: startup.pitchDeck.solution,
      marketSize: startup.pitchDeck.marketSize,
      product: startup.pitchDeck.product,
      businessModel: startup.pitchDeck.businessModel,
      goToMarket: startup.pitchDeck.goToMarket,
      competition: startup.pitchDeck.competition,
      team: startup.pitchDeck.team,
      financialPlan: startup.pitchDeck.financialPlan,
      ask: startup.pitchDeck.ask,
      useOfFunds: startup.pitchDeck.useOfFunds,
    },
  };
}

export const AI_REVIEW_FORBIDDEN_PROVIDER_FIELDS = [
  "email",
  "userId",
  "auth",
  "session",
  "password",
  "apiKey",
  "secret",
  "adRewardLedger",
  "billing",
  "cash",
  "revenue",
  "valuation",
  "monthlyBurn",
  "runway",
  "investorScore",
  "marketScore",
  "riskScore",
  "rawResponse",
] as const;
