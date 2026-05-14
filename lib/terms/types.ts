export interface TermSheetInput {
  startupId: string;
  vcReviewId: string;
  proposedAmount: number;
  proposedEquity: number;
  preMoneyValuation: number;
  postMoneyValuation: number;
  boardSeat: boolean;
  boardObserver: boolean;
  liquidationPreference: number;
  proRataRights: boolean;
  founderSalaryCap?: number;
  milestoneRequirements?: string;
  investorNotes?: string;
  expiresAt?: Date;
}

export interface CounterOfferInput {
  requestedInvestmentAmount: number;
  offeredEquityPercent: number;
  founderSalaryCap: number;
  boardSeatAccepted: boolean;
  boardObserverAccepted: boolean;
  notes: string;
}

export type NegotiationOutcome = "accept_counter" | "reject_counter" | "revise_terms";

export interface NegotiationResult {
  outcome: NegotiationOutcome;
  message: string;
  revisedTerms?: Partial<TermSheetInput>;
}
