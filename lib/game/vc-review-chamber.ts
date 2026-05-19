import type {
  AIReviewJobStatus,
  VCReviewDimensionAssessment,
  VCReviewDimensionKey,
  VCReviewFinalDecision,
} from "@/lib/ai-review/types";

export type VerdictTone = "emerald" | "amber" | "rose" | "cyan" | "violet" | "white";
export type InvestorSeatStance = "bullish" | "cautious" | "bearish" | "pending";

export interface VerdictPresentation {
  label: string;
  eyebrow: string;
  tone: VerdictTone;
  summary: string;
  stampClass: string;
}

export interface ReviewStatusScenePresentation extends VerdictPresentation {
  ctaLabel: string;
  canContinuePlaying: boolean;
}

export interface InvestorSeatPresentation {
  role: string;
  dimension: VCReviewDimensionKey;
  label: string;
  score: number | null;
  stance: InvestorSeatStance;
  summary: string;
}

export interface TermSheetVaultPresentation {
  label: string;
  tone: VerdictTone;
  locked: boolean;
  description: string;
  ctaLabel: string;
}

const TONE_STAMP_CLASS: Record<VerdictTone, string> = {
  emerald: "border-emerald-400/55 bg-emerald-500/10 text-emerald-300 shadow-[0_0_42px_rgba(52,211,153,0.14)]",
  amber: "border-amber-400/55 bg-amber-500/10 text-amber-300 shadow-[0_0_42px_rgba(251,191,36,0.12)]",
  rose: "border-rose-400/60 bg-rose-500/10 text-rose-300 shadow-[0_0_42px_rgba(244,63,94,0.16)]",
  cyan: "border-cyan-400/55 bg-cyan-500/10 text-cyan-300 shadow-[0_0_42px_rgba(34,211,238,0.13)]",
  violet: "border-violet-400/55 bg-violet-500/10 text-violet-300 shadow-[0_0_42px_rgba(139,92,246,0.12)]",
  white: "border-white/20 bg-white/5 text-white/60",
};

export function getVerdictPresentation(decision: VCReviewFinalDecision | "proposal" | "revise" | "reject" | string | null | undefined): VerdictPresentation {
  const normalized = normalizeDecision(decision);
  if (normalized === "accept") {
    return {
      label: "ACCEPTED",
      eyebrow: "Term Sheet Signal",
      tone: "emerald",
      summary: "The panel is willing to fund this run, but milestone discipline still matters.",
      stampClass: TONE_STAMP_CLASS.emerald,
    };
  }
  if (normalized === "conditional") {
    return {
      label: "CONDITIONAL",
      eyebrow: "Milestone Gate",
      tone: "amber",
      summary: "The pitch has fundable elements, but the panel needs stronger proof before full conviction.",
      stampClass: TONE_STAMP_CLASS.amber,
    };
  }
  return {
    label: "REJECTED",
    eyebrow: "No Term Sheet",
    tone: "rose",
    summary: "The panel is not ready to write a check. The rejection should point to specific fixable gaps.",
    stampClass: TONE_STAMP_CLASS.rose,
  };
}

export function getReviewStatusScenePresentation(status: AIReviewJobStatus | "no_review"): ReviewStatusScenePresentation {
  switch (status) {
    case "queued":
      return {
        label: "QUEUED",
        eyebrow: "Investor Chamber Queue",
        tone: "cyan",
        summary: "Your startup dossier is waiting for the private beta review pipeline.",
        ctaLabel: "Refresh Status",
        canContinuePlaying: true,
        stampClass: TONE_STAMP_CLASS.cyan,
      };
    case "running":
      return {
        label: "REVIEWING",
        eyebrow: "Partner Table Active",
        tone: "violet",
        summary: "The partners are reviewing the dossier. You can continue playing while the verdict resolves.",
        ctaLabel: "Check Again",
        canContinuePlaying: true,
        stampClass: TONE_STAMP_CLASS.violet,
      };
    case "retrying":
      return {
        label: "RETRYING",
        eyebrow: "Provider Recovery",
        tone: "amber",
        summary: "The review provider hit a transient issue. The worker will retry safely without exposing provider logs.",
        ctaLabel: "Check Again",
        canContinuePlaying: true,
        stampClass: TONE_STAMP_CLASS.amber,
      };
    case "failed":
      return {
        label: "FAILED",
        eyebrow: "Operational Failure",
        tone: "rose",
        summary: "The review could not be generated. This is a pipeline issue, not an investor rejection.",
        ctaLabel: "Return To Pitch",
        canContinuePlaying: true,
        stampClass: TONE_STAMP_CLASS.rose,
      };
    case "cancelled":
      return {
        label: "CANCELLED",
        eyebrow: "Review Job Cancelled",
        tone: "white",
        summary: "This review job was cancelled by operations. Submit again when ready.",
        ctaLabel: "Return To Pitch",
        canContinuePlaying: true,
        stampClass: TONE_STAMP_CLASS.white,
      };
    case "completed":
      return {
        label: "READY",
        eyebrow: "Verdict Available",
        tone: "emerald",
        summary: "The investor verdict is ready.",
        ctaLabel: "Open Verdict",
        canContinuePlaying: false,
        stampClass: TONE_STAMP_CLASS.emerald,
      };
    default:
      return {
        label: "NO DOSSIER",
        eyebrow: "Pitch Not Submitted",
        tone: "cyan",
        summary: "Build the pitch dossier before entering the investor chamber.",
        ctaLabel: "Build Pitch",
        canContinuePlaying: false,
        stampClass: TONE_STAMP_CLASS.cyan,
      };
  }
}

export function buildInvestorSeatCards(
  dimensions: Partial<Record<VCReviewDimensionKey, VCReviewDimensionAssessment>> | undefined,
  fallbackScores: Partial<Record<VCReviewDimensionKey, number | null>> = {}
): InvestorSeatPresentation[] {
  const roles: Array<{ role: string; dimension: VCReviewDimensionKey; label: string }> = [
    { role: "Market Partner", dimension: "market", label: "Market" },
    { role: "Product Partner", dimension: "solution", label: "Solution" },
    { role: "Operator Partner", dimension: "team", label: "Team" },
    { role: "Risk Partner", dimension: "problem", label: "Problem" },
    { role: "Deal Partner", dimension: "business", label: "Business" },
  ];

  return roles.map((seat) => {
    const dimension = dimensions?.[seat.dimension];
    const score = dimension?.score ?? fallbackScores[seat.dimension] ?? null;
    const stance = getSeatStance(score);
    const concern = dimension?.concerns?.[0];
    const evidence = dimension?.evidence?.[0];
    return {
      ...seat,
      score,
      stance,
      summary:
        stance === "bullish"
          ? evidence ?? "The partner sees enough evidence to support this dimension."
          : stance === "bearish"
            ? concern ?? "The partner sees a material gap in this dimension."
            : concern ?? evidence ?? "The partner needs sharper evidence before full conviction.",
    };
  });
}

export function getTermSheetVaultPresentation({
  finalDecision,
  hasTermSheet,
  noTermSheetReason,
}: {
  finalDecision: VCReviewFinalDecision;
  hasTermSheet: boolean;
  noTermSheetReason?: string;
}): TermSheetVaultPresentation {
  if (finalDecision === "accept") {
    return {
      label: hasTermSheet ? "TERM SHEET VAULT OPEN" : "TERM SHEET UNLOCKED",
      tone: "emerald",
      locked: false,
      description: hasTermSheet
        ? "Funding terms are available. Inspect control, dilution, and runway before accepting capital."
        : "The verdict supports funding. Generate or review the term sheet from the existing funding flow.",
      ctaLabel: hasTermSheet ? "View Terms" : "Review Terms",
    };
  }

  if (finalDecision === "conditional") {
    return {
      label: hasTermSheet ? "CONDITIONAL TERMS AVAILABLE" : "TERM SHEET LOCKED",
      tone: "amber",
      locked: !hasTermSheet,
      description: hasTermSheet
        ? "Terms may be available, but the panel expects milestone discipline before full conviction."
        : "Hit the milestone requirements before treating this pitch as fundable.",
      ctaLabel: hasTermSheet ? "Review Terms" : "Milestones Required",
    };
  }

  return {
    label: "NO TERM SHEET GENERATED",
    tone: "rose",
    locked: true,
    description: noTermSheetReason ?? "The pitch does not clear the funding bar yet.",
    ctaLabel: "Revise Pitch",
  };
}

export function hasGuardrailAdjustment(modelRecommendation?: string, finalDecision?: string): boolean {
  return Boolean(modelRecommendation && finalDecision && modelRecommendation !== finalDecision);
}

function normalizeDecision(decision: string | null | undefined): VCReviewFinalDecision {
  if (decision === "accept" || decision === "proposal") return "accept";
  if (decision === "conditional" || decision === "revise") return "conditional";
  return "reject";
}

function getSeatStance(score: number | null): InvestorSeatStance {
  if (score === null) return "pending";
  if (score >= 75) return "bullish";
  if (score < 50) return "bearish";
  return "cautious";
}
