import { TermSheetInput } from "./types";

export interface GenerateTermSheetParams {
  startupId: string;
  vcReviewId: string;
  vcDecision: string;
  overallScore: number;
  riskScore: number | null;
  marketScore: number | null;
  investorScore: number | null;
  proposedAmount: number | null;
  proposedEquity: number | null;
  fundingAsk: number;
  sector: string;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
}

export function generateTermSheet(params: GenerateTermSheetParams): TermSheetInput {
  const {
    startupId,
    vcReviewId,
    overallScore,
    riskScore,
    marketScore,
    proposedAmount,
    proposedEquity,
    fundingAsk,
    sector,
  } = params;

  // Base equity request: higher score = lower equity, higher risk = higher equity
  const scoreFactor = clamp((overallScore - 50) / 50, -1, 1); // -1 to 1
  const riskFactor = clamp((riskScore ?? 50) / 100, 0, 1); // 0 to 1
  const marketFactor = clamp((marketScore ?? 50) / 100, 0, 1); // 0 to 1
  // Base equity between 10% and 30%
  let baseEquity = 20 - scoreFactor * 5 + riskFactor * 8 - marketFactor * 3;
  baseEquity = clamp(baseEquity, 10, 35);

  // Use VC proposed equity if available, otherwise use calculated
  let equity = proposedEquity ?? baseEquity;
  equity = clamp(equity, 5, 49);

  // Amount: use proposed if available, otherwise scale by market score and funding ask
  let amount = proposedAmount ?? Math.round(fundingAsk * (0.6 + marketFactor * 0.4));
  amount = clamp(amount, 25000, 10000000);

  // Valuation: post-money = amount / equity%
  const postMoney = Math.round(amount / (equity / 100));
  const preMoney = Math.round(postMoney - amount);

  // Board terms: higher equity or higher score = more likely board seat
  const boardSeat = equity > 15 || overallScore > 75;
  const boardObserver = !boardSeat && overallScore > 60;

  // Liquidation preference: higher risk = higher multiple
  let liqPref = 1.0;
  if (riskFactor > 0.7) liqPref = 2.0;
  else if (riskFactor > 0.5) liqPref = 1.5;

  // Pro-rata: default true for most deals
  const proRataRights = overallScore > 55;

  // Salary cap: deterministic based on sector + hash
  const sectorHash = hashString(sector);
  const baseSalaryCap = 80000 + (sectorHash % 70000);
  const founderSalaryCap = Math.round(baseSalaryCap / 1000) * 1000;

  // Milestones for risky or deep-tech sectors
  const deepTechSectors = ["AI / ML", "Healthtech", "Climate", "EdTech"];
  const needsMilestones = deepTechSectors.includes(sector) || (riskScore ?? 50) > 60;
  const milestoneRequirements = needsMilestones
    ? "1. Launch MVP within 6 months.\n2. Acquire 100 paying customers.\n3. Achieve $10K MRR."
    : undefined;

  // Investor notes
  const investorNotes = `Initial proposal based on ${overallScore > 70 ? "strong" : "moderate"} review scores. ${needsMilestones ? "Milestone-based tranche release applies." : ""}`;

  // Expiration: 14 days from now
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  return {
    startupId,
    vcReviewId,
    proposedAmount: amount,
    proposedEquity: Number(equity.toFixed(2)),
    preMoneyValuation: Math.max(preMoney, 1),
    postMoneyValuation: postMoney,
    boardSeat,
    boardObserver,
    liquidationPreference: liqPref,
    proRataRights,
    founderSalaryCap,
    milestoneRequirements,
    investorNotes,
    expiresAt,
  };
}
