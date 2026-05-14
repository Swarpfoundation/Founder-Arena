import { CounterOfferInput, NegotiationResult, TermSheetInput } from "./types";

export interface EvaluateCounterParams {
  counter: CounterOfferInput;
  currentTerms: TermSheetInput;
  overallScore: number;
  riskScore: number | null;
}

export function evaluateCounterOffer(params: EvaluateCounterParams): NegotiationResult {
  const { counter, currentTerms, overallScore } = params;

  const currentAmount = currentTerms.proposedAmount;
  const currentEquity = currentTerms.proposedEquity;

  const amountDiff = (counter.requestedInvestmentAmount - currentAmount) / currentAmount;
  const equityDiff = (counter.offeredEquityPercent - currentEquity) / currentEquity;

  // Founder asking for more money AND less equity = aggressive
  const isAggressive = amountDiff > 0.1 && equityDiff < -0.1;
  // Founder asking for slightly more money or slightly less equity = reasonable
  const isReasonable = Math.abs(amountDiff) <= 0.15 && Math.abs(equityDiff) <= 0.15;
  // Founder accepting worse terms = very favorable
  const isFavorable = amountDiff <= 0 && equityDiff >= 0;

  // High-score startups get more flexibility
  const scoreFlexibility = overallScore > 75 ? 0.2 : overallScore > 60 ? 0.1 : 0.05;

  if (isFavorable || (isReasonable && amountDiff <= scoreFlexibility && equityDiff >= -scoreFlexibility)) {
    return {
      outcome: "accept_counter",
      message: "We appreciate your pragmatism. Your counter-offer is accepted.",
    };
  }

  if (isAggressive && overallScore < 70) {
    return {
      outcome: "reject_counter",
      message: "Your counter is too far from our proposal given current risk profile and scores. We are passing.",
    };
  }

  // Revise terms: meet in the middle
  const revisedAmount = Math.round((currentAmount + counter.requestedInvestmentAmount) / 2);
  const revisedEquity = Number(((currentEquity + counter.offeredEquityPercent) / 2).toFixed(2));
  const revisedPostMoney = Math.round(revisedAmount / (revisedEquity / 100));
  const revisedPreMoney = Math.round(revisedPostMoney - revisedAmount);

  return {
    outcome: "revise_terms",
    message: "We cannot accept your counter as-is, but we are willing to revise our terms.",
    revisedTerms: {
      proposedAmount: revisedAmount,
      proposedEquity: revisedEquity,
      preMoneyValuation: Math.max(revisedPreMoney, 1),
      postMoneyValuation: revisedPostMoney,
      founderSalaryCap: counter.founderSalaryCap,
      boardSeat: currentTerms.boardSeat && !counter.boardSeatAccepted ? true : currentTerms.boardSeat,
      boardObserver: counter.boardObserverAccepted,
      investorNotes: `Revised terms after counter-offer. Founder requested $${counter.requestedInvestmentAmount.toLocaleString()} at ${counter.offeredEquityPercent}% equity.`,
    },
  };
}
