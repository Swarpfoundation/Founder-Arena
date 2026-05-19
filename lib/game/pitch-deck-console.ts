export type PitchFieldId =
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
  | "useOfFunds";

export type PitchSectionStatus = "empty" | "weak" | "adequate" | "strong";
export type PitchTone = "cyan" | "violet" | "rose" | "amber" | "emerald" | "white";
export type ReviewLaunchStatus = "not_ready" | "ready" | "queued" | "running" | "retrying" | "completed" | "failed" | "blocked";

export interface PitchSectionConfig {
  id: PitchFieldId;
  label: string;
  group: "core" | "market" | "business" | "capital";
  required: boolean;
  minChars: number;
  strongChars: number;
  rows: number;
  placeholder: string;
  vcCares: string;
}

export type PitchData = Record<PitchFieldId, string>;

export interface DossierSectionCard {
  id: PitchFieldId;
  label: string;
  group: PitchSectionConfig["group"];
  required: boolean;
  status: PitchSectionStatus;
  tone: PitchTone;
  length: number;
  minChars: number;
  vcCares: string;
}

export interface DossierReadiness {
  score: number;
  label: string;
  tone: PitchTone;
  requiredComplete: number;
  requiredTotal: number;
  weakCount: number;
  missingCount: number;
}

export interface FundingAskRisk {
  risk: "missing" | "unsupported" | "high" | "clear";
  tone: PitchTone;
  label: string;
  summary: string;
}

export interface SubmissionGateInput {
  canSubmit: boolean;
  reason?: string;
  isFirstReview?: boolean;
  cooldownRemainingSeconds?: number;
  canBypassWithToken?: boolean;
  speedTokensAvailable?: number;
  weeklySubmission?: {
    planId: "free" | "pro" | "max";
    isPaid: boolean;
    freeLimit: number;
    remainingFreeSubmissions: number;
    submissionCreditsAvailable: number;
    canSubmit: boolean;
    willUseCredit: boolean;
    reason?: string;
  };
}

export interface SubmissionGatePresentation {
  status: "open" | "blocked" | "token_bypass";
  tone: PitchTone;
  label: string;
  summary: string;
  weeklyLine: string;
  creditLine: string;
}

export interface ReviewLaunchPresentation {
  status: ReviewLaunchStatus;
  tone: PitchTone;
  label: string;
  summary: string;
  ctaLabel: string;
}

export const PITCH_SECTION_CONFIGS: PitchSectionConfig[] = [
  {
    id: "problem",
    label: "Problem",
    group: "core",
    required: true,
    minChars: 20,
    strongChars: 220,
    rows: 4,
    placeholder: "What painful problem are you solving?",
    vcCares: "Is the pain urgent, specific, and worth solving?",
  },
  {
    id: "solution",
    label: "Solution",
    group: "core",
    required: true,
    minChars: 20,
    strongChars: 220,
    rows: 4,
    placeholder: "How do you solve it?",
    vcCares: "Does your product create a believable wedge?",
  },
  {
    id: "marketSize",
    label: "Market",
    group: "market",
    required: true,
    minChars: 20,
    strongChars: 180,
    rows: 3,
    placeholder: "TAM, SAM, SOM with numbers",
    vcCares: "Is the opportunity big, reachable, and timed well?",
  },
  {
    id: "product",
    label: "Product",
    group: "core",
    required: true,
    minChars: 20,
    strongChars: 220,
    rows: 4,
    placeholder: "What are you building?",
    vcCares: "Can this be built and adopted?",
  },
  {
    id: "businessModel",
    label: "Business Model",
    group: "business",
    required: true,
    minChars: 20,
    strongChars: 180,
    rows: 3,
    placeholder: "How do you make money?",
    vcCares: "Can this become revenue, not just usage?",
  },
  {
    id: "goToMarket",
    label: "Go-To-Market",
    group: "business",
    required: true,
    minChars: 20,
    strongChars: 180,
    rows: 3,
    placeholder: "How will you acquire customers?",
    vcCares: "How will customers actually find and buy this?",
  },
  {
    id: "competition",
    label: "Competition",
    group: "market",
    required: true,
    minChars: 10,
    strongChars: 150,
    rows: 3,
    placeholder: "Who else is in this space?",
    vcCares: "Why will you win despite alternatives?",
  },
  {
    id: "team",
    label: "Team",
    group: "business",
    required: false,
    minChars: 1,
    strongChars: 120,
    rows: 3,
    placeholder: "Who is on the team?",
    vcCares: "Can this founder/team execute?",
  },
  {
    id: "financialPlan",
    label: "Financial Plan",
    group: "capital",
    required: true,
    minChars: 20,
    strongChars: 180,
    rows: 3,
    placeholder: "Revenue projections, unit economics",
    vcCares: "Does the spend plan match the ambition?",
  },
  {
    id: "ask",
    label: "Funding Ask",
    group: "capital",
    required: true,
    minChars: 1,
    strongChars: 45,
    rows: 1,
    placeholder: "$500,000 seed round",
    vcCares: "Is the ask proportional to the milestone?",
  },
  {
    id: "useOfFunds",
    label: "Use Of Funds",
    group: "capital",
    required: true,
    minChars: 20,
    strongChars: 180,
    rows: 3,
    placeholder: "How will you spend the money?",
    vcCares: "Will the money unlock measurable progress?",
  },
];

export const EMPTY_PITCH_DATA: PitchData = {
  problem: "",
  solution: "",
  marketSize: "",
  product: "",
  businessModel: "",
  goToMarket: "",
  competition: "",
  team: "",
  financialPlan: "",
  ask: "",
  useOfFunds: "",
};

export function getPitchSectionStatus(value: string | null | undefined, config: PitchSectionConfig): PitchSectionStatus {
  const length = countText(value);
  if (length === 0) return "empty";
  if (length < config.minChars) return "weak";
  if (length >= config.strongChars) return "strong";
  return "adequate";
}

export function getPitchSectionCards(pitchData: Partial<Record<PitchFieldId, string>>): DossierSectionCard[] {
  return PITCH_SECTION_CONFIGS.map((config) => {
    const value = pitchData[config.id] ?? "";
    const status = getPitchSectionStatus(value, config);
    return {
      id: config.id,
      label: config.label,
      group: config.group,
      required: config.required,
      status,
      tone: statusToTone(status, config.required),
      length: countText(value),
      minChars: config.minChars,
      vcCares: config.vcCares,
    };
  });
}

export function getDossierReadiness(pitchData: Partial<Record<PitchFieldId, string>>): DossierReadiness {
  const cards = getPitchSectionCards(pitchData);
  const required = cards.filter((card) => card.required);
  const requiredComplete = required.filter((card) => card.status === "adequate" || card.status === "strong").length;
  const weakCount = cards.filter((card) => card.status === "weak").length;
  const missingCount = required.filter((card) => card.status === "empty").length;
  const completionScore = (requiredComplete / required.length) * 72;
  const strengthScore = (cards.filter((card) => card.status === "strong").length / cards.length) * 28;
  const score = Math.max(0, Math.min(100, Math.round(completionScore + strengthScore - weakCount * 3)));
  return {
    score,
    label: score >= 90 ? "Strong investor dossier" : score >= 70 ? "Submission ready" : score >= 40 ? "VC risk high" : "Dossier incomplete",
    tone: score >= 90 ? "emerald" : score >= 70 ? "cyan" : score >= 40 ? "amber" : "rose",
    requiredComplete,
    requiredTotal: required.length,
    weakCount,
    missingCount,
  };
}

export function getFundingAskRisk(pitchData: Partial<Record<PitchFieldId, string>>): FundingAskRisk {
  const ask = (pitchData.ask ?? "").trim();
  const useOfFunds = (pitchData.useOfFunds ?? "").trim();
  const financialPlan = (pitchData.financialPlan ?? "").trim();
  if (!ask || !useOfFunds) {
    return {
      risk: "missing",
      tone: "rose",
      label: "Capital Plan Missing",
      summary: "Funding ask and use of funds must be clear before investor review.",
    };
  }
  if (!/\d/.test(ask) || financialPlan.length < 20 || useOfFunds.length < 40) {
    return {
      risk: "unsupported",
      tone: "amber",
      label: "Ask Needs Support",
      summary: "The ask needs clearer numbers, milestones, and spend logic.",
    };
  }
  if (extractLargestNumber(ask) >= 1_000_000 && useOfFunds.length < 160) {
    return {
      risk: "high",
      tone: "amber",
      label: "High Ask Scrutiny",
      summary: "Large rounds need stronger use-of-funds detail and milestone proof.",
    };
  }
  return {
    risk: "clear",
    tone: "emerald",
    label: "Capital Plan Clear",
    summary: "The ask, financial plan, and use of funds are legible enough for the VC chamber.",
  };
}

export function getSubmissionGateState(input: SubmissionGateInput | null | undefined): SubmissionGatePresentation {
  if (!input) {
    return {
      status: "open",
      tone: "cyan",
      label: "Submission Gate Loading",
      summary: "Checking review quota, cooldown, and private beta access.",
      weeklyLine: "Review allowance pending",
      creditLine: "Credits pending",
    };
  }
  const weekly = input.weeklySubmission;
  const weeklyLine = weekly?.isPaid
    ? `${weekly.planId.toUpperCase()} plan bypasses the Free weekly cap`
    : `${weekly?.remainingFreeSubmissions ?? 0}/${weekly?.freeLimit ?? 3} free weekly submissions remain`;
  const creditLine = weekly?.isPaid
    ? "Submission credits not needed on paid plan"
    : `${weekly?.submissionCreditsAvailable ?? 0} submission credit(s) available`;

  if (input.canSubmit) {
    return {
      status: "open",
      tone: weekly?.willUseCredit ? "emerald" : "cyan",
      label: weekly?.willUseCredit ? "Credit Launch Available" : input.isFirstReview ? "First Review Ready" : "VC Chamber Open",
      summary: weekly?.willUseCredit ? "Free weekly cap is spent, but a referral credit can launch this review." : "The dossier can be sent to the VC chamber.",
      weeklyLine,
      creditLine,
    };
  }
  if (input.canBypassWithToken) {
    return {
      status: "token_bypass",
      tone: "amber",
      label: "Cooldown Bypass Available",
      summary: "A speed token can bypass the current review cooldown.",
      weeklyLine,
      creditLine,
    };
  }
  return {
    status: "blocked",
    tone: "rose",
    label: "Submission Locked",
    summary: input.reason ?? weekly?.reason ?? "Review submission is not available right now.",
    weeklyLine,
    creditLine,
  };
}

export function getReviewLaunchPresentation(input: {
  latestReview?: { decision?: string | null; overallScore?: number | null } | null;
  activeJob?: { status?: string | null } | null;
  hasPitch?: boolean;
}): ReviewLaunchPresentation {
  const status = input.activeJob?.status;
  if (status === "queued" || status === "running" || status === "retrying") {
    return {
      status,
      tone: status === "retrying" ? "amber" : "cyan",
      label: status === "queued" ? "Investor Chamber Queue" : status === "running" ? "Partners Reviewing" : "Provider Retrying",
      summary: "A private beta review job is active. Open the VC Review Chamber for safe status.",
      ctaLabel: "Open Review Chamber",
    };
  }
  if (status === "failed") {
    return {
      status: "failed",
      tone: "rose",
      label: "Review Failed",
      summary: "The previous review attempt failed safely. Check the Review Chamber for next steps.",
      ctaLabel: "Inspect Failure",
    };
  }
  if (input.latestReview) {
    return {
      status: "completed",
      tone: "emerald",
      label: "Verdict Ready",
      summary: `Latest decision: ${input.latestReview.decision ?? "reviewed"}${typeof input.latestReview.overallScore === "number" ? ` · ${input.latestReview.overallScore}/100` : ""}.`,
      ctaLabel: "Open Verdict",
    };
  }
  if (input.hasPitch) {
    return {
      status: "ready",
      tone: "violet",
      label: "Ready For VC Chamber",
      summary: "A saved dossier is available for investor review.",
      ctaLabel: "Send Dossier",
    };
  }
  return {
    status: "not_ready",
    tone: "amber",
    label: "Dossier Not Saved",
    summary: "Complete and save the pitch before launching review.",
    ctaLabel: "Save Dossier",
  };
}

export function getPitchValidationPresentation(errors: Record<string, string>): {
  hasErrors: boolean;
  title: string;
  messages: string[];
} {
  const messages = Object.values(errors).filter(Boolean);
  return {
    hasErrors: messages.length > 0,
    title: messages.length > 0 ? "Dossier Blocked" : "Dossier Clear",
    messages,
  };
}

function statusToTone(status: PitchSectionStatus, required: boolean): PitchTone {
  if (status === "strong") return "emerald";
  if (status === "adequate") return "cyan";
  if (status === "weak") return "amber";
  return required ? "rose" : "white";
}

function countText(value: string | null | undefined): number {
  return (value ?? "").trim().length;
}

function extractLargestNumber(value: string): number {
  const matches = value.replace(/,/g, "").match(/\d+/g) ?? [];
  return Math.max(0, ...matches.map((match) => Number(match)).filter(Number.isFinite));
}
