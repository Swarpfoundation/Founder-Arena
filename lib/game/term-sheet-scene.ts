export type DealTone = "cyan" | "violet" | "rose" | "amber" | "emerald" | "white";
export type DealStatus = "live" | "accepted" | "declined" | "locked" | "pending";
export type DealRiskLevel = "low" | "normal" | "high" | "severe";
export type DealNumeric = number | string | { toString(): string } | null | undefined;

export interface TermSheetSceneInput {
  status?: string | null;
  proposedAmount?: number | null;
  proposedEquity?: DealNumeric;
  preMoneyValuation?: number | null;
  postMoneyValuation?: number | null;
  founderSalaryCap?: number | null;
  boardSeat?: boolean | null;
  boardObserver?: boolean | null;
  liquidationPreference?: DealNumeric;
  proRataRights?: boolean | null;
  milestoneRequirements?: string | null;
  investorNotes?: string | null;
  expiresAt?: Date | string | null;
}

export interface DealStatusPresentation {
  status: DealStatus;
  label: string;
  eyebrow: string;
  tone: DealTone;
  summary: string;
}

export interface FounderControlRisk {
  risk: DealRiskLevel;
  label: string;
  founderOwnershipAfter: number;
  equitySold: number;
  investorInfluence: string;
  warnings: string[];
}

export interface ClauseRiskCardPresentation {
  id: string;
  label: string;
  risk: DealRiskLevel;
  summary: string;
  gameMeaning: string;
}

export interface NegotiationCta {
  label: string;
  href: string;
  tone: DealTone;
}

export function getTermSheetStatusPresentation(input: {
  termSheet?: TermSheetSceneInput | null;
  error?: string | null;
}): DealStatusPresentation {
  if (!input.termSheet) {
    if (input.error?.toLowerCase().includes("no vc review")) {
      return {
        status: "pending",
        label: "INVESTOR VERDICT PENDING",
        eyebrow: "Terms Not Generated",
        tone: "cyan",
        summary: "The investor chamber must issue an investable verdict before terms can unlock.",
      };
    }
    return {
      status: "locked",
      label: "TERMS LOCKED",
      eyebrow: "No Term Sheet",
      tone: "rose",
      summary: input.error ?? "No active term sheet is available for this run.",
    };
  }

  if (input.termSheet.status === "accepted") {
    return {
      status: "accepted",
      label: "CAPITAL SECURED",
      eyebrow: "Funding Closed",
      tone: "emerald",
      summary: "The round is closed. Cash is live, the run is funded, and the operating phase is unlocked.",
    };
  }

  if (input.termSheet.status === "rejected") {
    return {
      status: "declined",
      label: "DEAL DECLINED",
      eyebrow: "Terms Rejected",
      tone: "rose",
      summary: "This term sheet is no longer active. Rework the pitch or return to the startup dossier.",
    };
  }

  if (input.termSheet.status === "countered") {
    return {
      status: "live",
      label: "COUNTER LIVE",
      eyebrow: "Negotiation Table",
      tone: "amber",
      summary: "The deal is still open, but terms have moved. Review control, runway, and investor pressure before accepting.",
    };
  }

  return {
    status: "live",
    label: "OFFER LIVE",
    eyebrow: "Negotiation Table",
    tone: "cyan",
    summary: "Survival capital is available. Accepting extends runway but trades ownership and control.",
  };
}

export function getFounderControlRisk(input: {
  equityPercent?: DealNumeric;
  boardSeat?: boolean | null;
  liquidationPreference?: DealNumeric;
}): FounderControlRisk {
  const equitySold = clampPercent(toNumber(input.equityPercent, 0));
  const liquidation = toNumber(input.liquidationPreference, 1);
  const warnings = [
    equitySold >= 20 ? "High dilution for an early round." : null,
    equitySold > 30 ? "Severe ownership transfer." : null,
    input.boardSeat ? "Investor voting power enters governance." : null,
    liquidation > 1 ? "Investor may get more than 1x before founders in an exit." : null,
  ].filter((warning): warning is string => Boolean(warning));

  const risk: DealRiskLevel =
    equitySold > 30 || (input.boardSeat && liquidation > 1)
      ? "severe"
      : equitySold >= 20 || input.boardSeat
        ? "high"
        : equitySold >= 10
          ? "normal"
          : "low";

  return {
    risk,
    label:
      risk === "severe"
        ? "Severe Control Risk"
        : risk === "high"
          ? "High Control Risk"
          : risk === "normal"
            ? "Normal Seed Dilution"
            : "Low Dilution",
    founderOwnershipAfter: Math.max(0, 100 - equitySold),
    equitySold,
    investorInfluence: input.boardSeat ? "Board vote active" : "Governance influence limited",
    warnings,
  };
}

export function getClauseRiskCards(termSheet: TermSheetSceneInput): ClauseRiskCardPresentation[] {
  const cards: ClauseRiskCardPresentation[] = [];
  if (termSheet.boardSeat) {
    cards.push({
      id: "board-seat",
      label: "Board Seat",
      risk: "high",
      summary: "Investor gets formal governance influence.",
      gameMeaning: "Boardroom pressure can feel more dangerous because an investor has a vote.",
    });
  }
  if (termSheet.boardObserver) {
    cards.push({
      id: "board-observer",
      label: "Board Observer",
      risk: "normal",
      summary: "Investor can watch boardroom decisions without voting.",
      gameMeaning: "Your decisions are visible to capital, even when control is not transferred.",
    });
  }
  if (termSheet.proRataRights) {
    cards.push({
      id: "pro-rata",
      label: "Pro-Rata Rights",
      risk: "normal",
      summary: "Investor can maintain ownership in future rounds.",
      gameMeaning: "Future fundraising may keep this investor at the table.",
    });
  }
  const liquidation = toNumber(termSheet.liquidationPreference, 1);
  if (liquidation > 0) {
    cards.push({
      id: "liquidation",
      label: `${formatNumber(liquidation)}x Liquidation Preference`,
      risk: liquidation > 1 ? "high" : "normal",
      summary: "Investor may get paid first in an exit.",
      gameMeaning: liquidation > 1 ? "Exit upside can be meaningfully less founder-friendly." : "Standard investor downside protection.",
    });
  }
  if (termSheet.founderSalaryCap) {
    cards.push({
      id: "salary-cap",
      label: "Founder Salary Cap",
      risk: "low",
      summary: `Founder salary capped at ${formatDealAmount(termSheet.founderSalaryCap)}/year.`,
      gameMeaning: "Keeps burn disciplined while the round is active.",
    });
  }
  if (termSheet.milestoneRequirements) {
    cards.push({
      id: "milestones",
      label: "Milestone Requirements",
      risk: "normal",
      summary: "Execution conditions are attached to investor confidence.",
      gameMeaning: "The next phase must prove the story with operating results.",
    });
  }
  return cards;
}

export function getRunwayInjectionCopy(termSheet: TermSheetSceneInput): {
  title: string;
  amount: string;
  unlocks: string[];
  warning: string;
} {
  return {
    title: "Runway Injection",
    amount: formatDealAmount(termSheet.proposedAmount ?? 0),
    unlocks: ["Team hiring", "Week 1 operations", "Founder sprint loop", "Board/investor expectations"],
    warning: "Capital extends survival, but it also creates execution pressure.",
  };
}

export function getNegotiationCtas(input: {
  startupId: string;
  status: DealStatus;
}): NegotiationCta[] {
  if (input.status === "accepted") {
    return [
      { label: "Build Team", href: `/startup/${input.startupId}/team`, tone: "violet" },
      { label: "Enter Week 1", href: `/startup/${input.startupId}/operate`, tone: "emerald" },
      { label: "Command Deck", href: "/dashboard", tone: "white" },
    ];
  }
  if (input.status === "declined" || input.status === "locked") {
    return [
      { label: "Return To Review", href: `/startup/${input.startupId}/review`, tone: "cyan" },
      { label: "Revise Pitch", href: `/startup/${input.startupId}/pitch`, tone: "amber" },
      { label: "Startup Dossier", href: `/startup/${input.startupId}`, tone: "white" },
    ];
  }
  if (input.status === "pending") {
    return [
      { label: "Open VC Review", href: `/startup/${input.startupId}/review`, tone: "cyan" },
      { label: "Revise Pitch", href: `/startup/${input.startupId}/pitch`, tone: "amber" },
    ];
  }
  return [
    { label: "Review VC Verdict", href: `/startup/${input.startupId}/review`, tone: "cyan" },
    { label: "How Term Sheets Work", href: "/how-to-play", tone: "white" },
  ];
}

export function formatDealAmount(value?: number | null): string {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

export function formatEquityPercent(value?: DealNumeric): string {
  return `${formatNumber(toNumber(value, 0))}%`;
}

export function formatValuation(value?: number | null): string {
  return formatDealAmount(value ?? 0);
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function toNumber(value: DealNumeric, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}
