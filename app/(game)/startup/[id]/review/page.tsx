import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Lightbulb, ThumbsDown, ThumbsUp } from "lucide-react";

import { getStartupById, getLatestVcReview } from "@/lib/actions/startup";
import { getTermSheet } from "@/lib/actions/terms";
import { getNextBestActionForStartup } from "@/lib/onboarding/progress";
import { getLatestAIReviewJobForStartup } from "@/lib/ai-review";
import type { VCReviewDimensionAssessment, VCReviewDimensionKey, VCReviewFinalDecision } from "@/lib/ai-review/types";
import {
  buildInvestorSeatCards,
  getReviewStatusScenePresentation,
  getTermSheetVaultPresentation,
  getVerdictPresentation,
} from "@/lib/game/vc-review-chamber";
import { getNextObjective, getStartupRunStep } from "@/lib/game/objectives";
import { GameScene } from "@/components/game/GameScene";
import { GameCard } from "@/components/game/GameCard";
import { GameHudBar } from "@/components/game/GameHudBar";
import { StartupRunHud } from "@/components/game/StartupRunHud";
import { ProgressBar } from "@/components/game/ProgressBar";
import { BetaFeedbackForm } from "@/components/game/BetaFeedbackForm";
import { NextBestActionInline } from "@/components/onboarding/NextBestAction";
import {
  FounderCoachingPanel,
  GuardrailNotice,
  InvestorPanel,
  RedFlagsPanel,
  ReviewStatusScene,
  ScoreDossierPanel,
  TermSheetVault,
  VerdictRationalePanel,
  VerdictStamp,
} from "@/components/game/VCReviewChamber";
import { cn } from "@/lib/utils";

type ReviewQualityDisplay = {
  modelRecommendation?: VCReviewFinalDecision;
  finalDecision?: VCReviewFinalDecision;
  decisionConfidence?: number;
  decisionSummary?: string;
  ruleReasons?: string[];
  dimensions?: Partial<Record<VCReviewDimensionKey, VCReviewDimensionAssessment>>;
  rejectionReasons?: string[];
  conditionalRequirements?: string[];
  minimumEvidenceNeeded?: string[];
  whatWouldChangeDecision?: string[];
  acceptanceRationale?: string[];
  majorRisksStillPresent?: string[];
  milestoneConditions?: string[];
  redFlags?: string[];
  missingInformation?: string[];
  noTermSheetReason?: string;
  qualityFlags?: string[];
};

type CommitteeDisplay = {
  supportLevel: number;
  mainObjections: string[];
  whatWouldChangeTheirMind: string[];
  termsStance: string;
  strongestSupportQuote: string;
  strongestObjectionQuote: string;
  personaReviews: Array<{
    personaId: string;
    personaName: string;
    score: number;
    note: string;
    stance: string;
    focusArea: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function VcReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let startup: Awaited<ReturnType<typeof getStartupById>>;
  try {
    startup = await getStartupById(id);
  } catch {
    notFound();
  }

  const runStep = getStartupRunStep(startup);
  const objective = getNextObjective(startup);
  const review = await getLatestVcReview(id);

  if (!review) {
    const pendingJob = await getLatestAIReviewJobForStartup(id);
    const statusPresentation = getReviewStatusScenePresentation(pendingJob?.status ?? "no_review");

    return (
      <GameScene
        eyebrow="VC Review Chamber"
        title="Investor Verdict"
        subtitle={`${startup.name} is awaiting an investor panel decision.`}
        accent={statusPresentation.tone === "white" ? "neutral" : statusPresentation.tone}
      >
        <Link href={`/startup/${id}`} className="inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to startup
        </Link>
        <StartupRunHud startupId={id} status={startup.status} finalOutcome={startup.finalOutcome} />
        <GameHudBar
          startupId={id}
          startupName={startup.name}
          currentStep={runStep}
          cash={startup.cash}
          monthlyBurn={startup.monthlyBurn}
          objective={objective}
        />
        <ReviewStatusScene
          presentation={statusPresentation}
          provider={pendingJob?.provider}
          mode={pendingJob?.mode}
          attempts={pendingJob?.attempts}
          maxAttempts={pendingJob?.maxAttempts}
          lastError={pendingJob?.lastError}
          pitchHref={`/startup/${id}/pitch`}
          reviewHref={`/startup/${id}/review`}
          startupHref={`/startup/${id}`}
        />
      </GameScene>
    );
  }

  const existingTermSheet = await getTermSheet(id);
  const hasTermSheet = !!existingTermSheet;
  const nextAction = getNextBestActionForStartup(startup);
  const raw = review.rawResponse as Record<string, unknown> | null;
  const privateBetaAIReview = raw?.privateBetaAIReview as
    | { provider?: string; mode?: string; usedFallback?: boolean; model?: string }
    | undefined;
  const reviewQuality = raw?.reviewQuality as ReviewQualityDisplay | undefined;
  const committee = raw?.committee as CommitteeDisplay | undefined;
  const coaching = raw?.coaching && typeof raw.coaching === "object" ? raw.coaching as Record<string, string> : null;

  const finalDecision = reviewQuality?.finalDecision ?? storageDecisionToFinal(review.decision);
  const verdict = getVerdictPresentation(finalDecision);
  const investorSeats = buildInvestorSeatCards(reviewQuality?.dimensions, {
    problem: review.scoreProblem,
    solution: review.scoreSolution,
    market: review.scoreMarket,
    business: review.scoreBusiness,
  });
  const vault = getTermSheetVaultPresentation({
    finalDecision,
    hasTermSheet,
    noTermSheetReason: reviewQuality?.noTermSheetReason,
  });
  const hasCommittee = !!committee && committee.personaReviews?.length > 0;

  return (
    <GameScene
      eyebrow="VC Review Chamber"
      title="Investor Verdict"
      subtitle={`${startup.name} · ${startup.sector} · startup dossier reviewed by the private beta investor panel.`}
      accent={verdict.tone === "white" ? "neutral" : verdict.tone}
    >
      <Link href={`/startup/${id}`} className="inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to startup
      </Link>

      <StartupRunHud startupId={id} status={startup.status} finalOutcome={startup.finalOutcome} />
      <GameHudBar
        startupId={id}
        startupName={startup.name}
        currentStep={runStep}
        cash={startup.cash}
        monthlyBurn={startup.monthlyBurn}
        objective={objective}
      />

      {privateBetaAIReview && (
        <div className="border border-cyan-500/20 bg-cyan-500/[0.06] p-4 hud-corner">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300/65">Private Beta AI Review</p>
          <p className="mt-1 text-sm text-white/58">
            Generated server-side with <span className="text-white">{privateBetaAIReview.provider ?? "mock"}</span>
            {privateBetaAIReview.usedFallback ? " fallback" : ""}. API keys, prompts, raw provider payloads, and provider internals are not exposed.
          </p>
        </div>
      )}

      {nextAction && <NextBestActionInline action={nextAction} />}

      <VerdictStamp verdict={verdict} score={review.overallScore} confidence={reviewQuality?.decisionConfidence} />

      {reviewQuality?.decisionSummary && (
        <GameCard glow={verdict.tone} className="hud-corner">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Panel Summary</p>
          <p className="mt-2 text-lg font-black uppercase tracking-wider text-white">{reviewQuality.decisionSummary}</p>
        </GameCard>
      )}

      <GuardrailNotice
        modelRecommendation={reviewQuality?.modelRecommendation}
        finalDecision={reviewQuality?.finalDecision}
        ruleReasons={reviewQuality?.ruleReasons}
      />

      <InvestorPanel seats={investorSeats} />
      <ScoreDossierPanel dimensions={reviewQuality?.dimensions} />

      <VerdictRationalePanel
        finalDecision={finalDecision}
        rejectionReasons={reviewQuality?.rejectionReasons}
        conditionalRequirements={reviewQuality?.conditionalRequirements}
        acceptanceRationale={reviewQuality?.acceptanceRationale}
        whatWouldChangeDecision={reviewQuality?.whatWouldChangeDecision}
        noTermSheetReason={reviewQuality?.noTermSheetReason}
        majorRisksStillPresent={reviewQuality?.majorRisksStillPresent}
        milestoneConditions={reviewQuality?.milestoneConditions}
        missingInformation={reviewQuality?.missingInformation}
        minimumEvidenceNeeded={reviewQuality?.minimumEvidenceNeeded}
      />

      <RedFlagsPanel redFlags={reviewQuality?.redFlags} qualityFlags={reviewQuality?.qualityFlags} />

      <TermSheetVault vault={vault} href={`/startup/${id}/terms`} />

      {hasCommittee && <CommitteeArchive committee={committee} />}

      <GameCard className="hud-corner">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Investor Memo</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/68">{review.memo}</p>
      </GameCard>

      {(review.strengths || review.weaknesses || review.marketTiming || review.milestones) && (
        <GameCard className="hud-corner">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Legacy Review Notes</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {review.strengths && <LegacyNote title="Strengths" value={review.strengths} tone="emerald" />}
            {review.weaknesses && <LegacyNote title="Weaknesses" value={review.weaknesses} tone="rose" />}
            {review.marketTiming && <LegacyNote title="Market Timing" value={review.marketTiming} tone="cyan" />}
            {review.milestones && <LegacyNote title="Required Milestones" value={review.milestones} tone="amber" />}
          </div>
        </GameCard>
      )}

      <FounderCoachingPanel coaching={coaching} />

      <BetaFeedbackForm
        startupId={id}
        reviewId={review.id}
        decision={finalDecision}
        score={review.overallScore}
        provider={privateBetaAIReview?.provider ?? "legacy"}
        route={`/startup/${id}/review`}
        buttonLabel="Flag this verdict for beta QA"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/startup/${id}/pitch`} className="border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-300 transition-colors hover:bg-cyan-500/20">
          Revise Pitch
        </Link>
        <Link href={`/startup/${id}`} className="border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-wider text-white/55 transition-colors hover:text-white">
          Back To Dossier
        </Link>
        {!vault.locked && (
          <Link href={`/startup/${id}/terms`} className="ml-auto border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-300 transition-colors hover:bg-emerald-500/20">
            {vault.ctaLabel}
          </Link>
        )}
      </div>
    </GameScene>
  );
}

function storageDecisionToFinal(decision: string): VCReviewFinalDecision {
  if (decision === "proposal" || decision === "accept") return "accept";
  if (decision === "revise" || decision === "conditional") return "conditional";
  return "reject";
}

function CommitteeArchive({ committee }: { committee: CommitteeDisplay }) {
  return (
    <GameCard glow="violet" className="hud-corner">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-300/65">Committee Archive</p>
          <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-white">Specialist Partner Notes</h2>
        </div>
        <div className="border border-violet-500/20 bg-violet-500/10 px-4 py-3">
          <p className="text-[9px] font-black uppercase tracking-wider text-violet-300/70">Support Level</p>
          <p className="text-2xl font-black text-white">{committee.supportLevel}%</p>
        </div>
      </div>
      <ProgressBar value={committee.supportLevel} size="sm" />
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {committee.personaReviews.map((partner) => (
          <div key={partner.personaId} className="border border-white/10 bg-white/[0.025] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white">{partner.personaName}</p>
                <p className="text-[10px] uppercase tracking-wider text-white/35">{partner.focusArea}</p>
              </div>
              <span className="text-lg font-black text-violet-300">{partner.score}</span>
            </div>
            <p className="line-clamp-3 text-xs leading-relaxed text-white/58">{partner.note}</p>
            <span className={cn("mt-3 inline-flex border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider", stanceClass(partner.stance))}>
              {partner.stance.replace(/_/g, " ")}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <QuoteBlock icon="support" title="Strongest Support" quote={committee.strongestSupportQuote} />
        <QuoteBlock icon="objection" title="Strongest Objection" quote={committee.strongestObjectionQuote} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <CommitteeList title="Main Objections" items={committee.mainObjections} icon={<AlertTriangle className="h-4 w-4 text-amber-300" />} />
        <CommitteeList title="What Would Change Their Mind" items={committee.whatWouldChangeTheirMind} icon={<Lightbulb className="h-4 w-4 text-cyan-300" />} />
      </div>
    </GameCard>
  );
}

function QuoteBlock({ icon, title, quote }: { icon: "support" | "objection"; title: string; quote: string }) {
  const Icon = icon === "support" ? ThumbsUp : ThumbsDown;
  const tone = icon === "support"
    ? "border-emerald-500/15 bg-emerald-500/5 text-emerald-300"
    : "border-rose-500/15 bg-rose-500/5 text-rose-300";
  return (
    <div className={cn("border p-3", tone)}>
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-black uppercase tracking-wider">{title}</p>
      </div>
      <p className="text-xs leading-relaxed text-white/68">{quote}</p>
    </div>
  );
}

function CommitteeList({ title, items, icon }: { title: string; items: string[]; icon: ReactNode }) {
  if (!items.length) return null;
  return (
    <div className="border border-white/10 bg-white/[0.025] p-3">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <p className="text-xs font-black uppercase tracking-wider text-white/65">{title}</p>
      </div>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="text-xs leading-relaxed text-white/50">- {item}</li>
        ))}
      </ul>
    </div>
  );
}

function LegacyNote({ title, value, tone }: { title: string; value: string; tone: "emerald" | "rose" | "cyan" | "amber" }) {
  const classes = {
    emerald: "border-emerald-500/15 bg-emerald-500/5 text-emerald-300",
    rose: "border-rose-500/15 bg-rose-500/5 text-rose-300",
    cyan: "border-cyan-500/15 bg-cyan-500/5 text-cyan-300",
    amber: "border-amber-500/15 bg-amber-500/5 text-amber-300",
  }[tone];
  return (
    <div className={cn("border p-3", classes)}>
      <p className="mb-1 text-xs font-black uppercase tracking-wider">{title}</p>
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-white/65">{value}</p>
    </div>
  );
}

function stanceClass(stance: string): string {
  switch (stance) {
    case "strong_support":
    case "support":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
    case "concerned":
      return "border-amber-500/25 bg-amber-500/10 text-amber-300";
    case "oppose":
      return "border-rose-500/25 bg-rose-500/10 text-rose-300";
    default:
      return "border-white/10 bg-white/5 text-white/50";
  }
}
