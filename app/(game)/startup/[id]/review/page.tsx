import Link from "next/link";
import { notFound } from "next/navigation";
import { getStartupById, getLatestVcReview } from "@/lib/actions/startup";
import { getTermSheet } from "@/lib/actions/terms";
import { getNextBestActionForStartup } from "@/lib/onboarding/progress";
import { getAIReviewStatusPresentation, getLatestAIReviewJobForStartup } from "@/lib/ai-review";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/game/ProgressBar";
import { GameCard } from "@/components/game/GameCard";
import { StartupRunHud } from "@/components/game/StartupRunHud";
import { BetaFeedbackForm } from "@/components/game/BetaFeedbackForm";
import { NextBestActionInline } from "@/components/onboarding/NextBestAction";
import { cn } from "@/lib/utils";
import {
  Users,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

function stanceBadge(stance: string) {
  switch (stance) {
    case "strong_support":
      return { label: "Strong Support", classes: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" };
    case "support":
      return { label: "Support", classes: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" };
    case "neutral":
      return { label: "Neutral", classes: "bg-slate-500/10 text-slate-300 border-slate-500/30" };
    case "concerned":
      return { label: "Concerned", classes: "bg-amber-500/10 text-amber-300 border-amber-500/30" };
    case "oppose":
      return { label: "Oppose", classes: "bg-rose-500/10 text-rose-300 border-rose-500/30" };
    default:
      return { label: stance, classes: "bg-slate-500/10 text-slate-300 border-slate-500/30" };
  }
}

function termsStanceBadge(stance: string) {
  switch (stance) {
    case "aggressive":
      return { label: "Aggressive", classes: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" };
    case "standard":
      return { label: "Standard", classes: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30" };
    case "cautious":
      return { label: "Cautious", classes: "bg-amber-500/10 text-amber-300 border-amber-500/30" };
    case "pass":
      return { label: "Pass", classes: "bg-rose-500/10 text-rose-300 border-rose-500/30" };
    default:
      return { label: stance, classes: "bg-slate-500/10 text-slate-300 border-slate-500/30" };
  }
}

function ReviewList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="space-y-1">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="text-xs text-white/55">
          - {item}
        </li>
      ))}
    </ul>
  );
}

export const dynamic = "force-dynamic";

export default async function VcReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let startup: Awaited<ReturnType<typeof getStartupById>>;
  try {
    startup = await getStartupById(id);
  } catch {
    notFound();
  }

  const review = await getLatestVcReview(id);

  if (!review) {
    const pendingJob = await getLatestAIReviewJobForStartup(id);
    const pendingPresentation = pendingJob ? getAIReviewStatusPresentation(pendingJob.status) : null;

    return (
      <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 md:px-8 max-w-3xl">
        <div className="mb-6">
          <Link href={`/startup/${id}`} className="text-sm text-white/40 hover:text-white">
            ← Back to Startup
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{pendingJob ? "Private Beta AI Review" : "No Review Yet"}</CardTitle>
            <CardDescription>
              {pendingJob && pendingPresentation
                ? pendingPresentation.description
                : "You haven't submitted your pitch for review yet."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingJob && pendingPresentation ? (
              <div className="space-y-4">
                <div className="border border-cyan-500/20 bg-cyan-500/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300/70">
                    {pendingPresentation.label}
                  </p>
                  <p className="mt-2 text-sm text-white/60">
                    Provider: <span className="text-white">{pendingJob.provider}</span> · Mode:{" "}
                    <span className="text-white">{pendingJob.mode.replace(/_/g, " ")}</span> · Attempts:{" "}
                    <span className="text-white">{pendingJob.attempts}/{pendingJob.maxAttempts}</span>
                  </p>
                  {pendingJob.lastError && (
                    <p className="mt-2 text-xs text-amber-300">
                      The private beta queue hit a provider issue. It will retry if attempts remain.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/startup/${id}/review`}>
                    <Button variant="secondary">{pendingPresentation.cta}</Button>
                  </Link>
                  <Link href={`/startup/${id}`}>
                    <Button variant="outline">Continue Playing</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <Link href={`/startup/${id}/pitch`}>
                <Button>Build Pitch & Submit</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const decisionVariant: "default" | "destructive" | "secondary" =
    review.decision === "proposal"
      ? "default"
      : review.decision === "reject"
      ? "destructive"
      : "secondary";
  const decisionClasses =
    review.decision === "proposal"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : review.decision === "reject"
        ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
        : "border-amber-500/40 bg-amber-500/10 text-amber-300";

  const investableDecisions = ["proposal", "accept"];
  const isInvestable = investableDecisions.includes(review.decision);

  const existingTermSheet = await getTermSheet(id);
  const hasTermSheet = !!existingTermSheet;

  const nextAction = getNextBestActionForStartup(startup);

  // Phase 14: Parse committee from rawResponse
  const raw = review.rawResponse as Record<string, unknown> | null;
  const privateBetaAIReview = raw?.privateBetaAIReview as
    | { provider?: string; mode?: string; usedFallback?: boolean; model?: string }
    | undefined;
  const reviewQuality = raw?.reviewQuality as
    | {
        modelRecommendation?: "accept" | "conditional" | "reject";
        finalDecision?: "accept" | "conditional" | "reject";
        decisionConfidence?: number;
        decisionSummary?: string;
        ruleReasons?: string[];
        dimensions?: Record<
          string,
          { score: number; evidence: string[]; concerns: string[]; confidence: string }
        >;
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
      }
    | undefined;
  const committee = raw?.committee as
    | {
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
      }
    | undefined;

  const hasCommittee = !!committee && committee.personaReviews && committee.personaReviews.length > 0;

  return (
    <div className="max-w-4xl mx-auto pt-24 pb-12 px-4 md:px-8">
      <div className="mb-6">
        <Link href={`/startup/${id}`} className="text-sm text-white/40 hover:text-white">
          ← Back to Startup
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] text-violet-400/60 font-bold tracking-[0.35em] uppercase mb-1">VC Review Chamber</p>
          <h1 className="text-3xl font-black text-white text-glow-cyan">Investor Verdict</h1>
          <p className="text-sm text-white/40 mt-1">{startup.name} · {startup.sector}</p>
        </div>
        <Badge variant={decisionVariant} className={cn("text-sm capitalize", decisionClasses)}>
          {review.decision}
        </Badge>
      </div>

      <StartupRunHud startupId={id} status={startup.status} finalOutcome={startup.finalOutcome} className="mb-6" />

      {privateBetaAIReview && (
        <div className="mb-6 border border-cyan-500/20 bg-cyan-500/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300/70">
            Private Beta AI Review
          </p>
          <p className="mt-1 text-sm text-white/60">
            Generated through the server-side review pipeline with{" "}
            <span className="text-white">{privateBetaAIReview.provider ?? "mock"}</span>
            {privateBetaAIReview.usedFallback ? " fallback" : ""}. No API keys or provider internals are exposed.
          </p>
        </div>
      )}

      {nextAction && (
        <div className="mb-6">
          <NextBestActionInline action={nextAction} />
        </div>
      )}

      <div className="space-y-6">
        <GameCard glow={review.decision === "proposal" ? "emerald" : review.decision === "reject" ? "rose" : "violet"} className="hud-corner border-violet-500/20">
          <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
            <div className="text-center md:text-left">
              <p className="text-[10px] text-white/35 font-bold uppercase tracking-widest mb-2">Overall Score</p>
              <div className="text-6xl font-black text-white tabular-nums">
                {review.overallScore ?? "N/A"}<span className="text-lg text-white/40 font-normal">/100</span>
              </div>
            </div>
            <div className={cn("border p-4", decisionClasses)}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2">Committee Signal</p>
              <p className="text-sm leading-relaxed text-white/70">
                {isInvestable
                  ? "The room is open to a deal. Inspect control, dilution, and runway before accepting capital."
                  : "The room is not ready to write a check. Improve the pitch, reduce risk, or build more traction."}
              </p>
            </div>
          </div>
        </GameCard>

        <Card>
          <CardHeader>
            <CardTitle>Section Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <div className="text-xl font-bold">{review.scoreProblem ?? "N/A"}</div>
                <div className="text-xs text-white/40">Problem</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xl font-bold">{review.scoreSolution ?? "N/A"}</div>
                <div className="text-xs text-white/40">Solution</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xl font-bold">{review.scoreMarket ?? "N/A"}</div>
                <div className="text-xs text-white/40">Market</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xl font-bold">{review.scoreBusiness ?? "N/A"}</div>
                <div className="text-xs text-white/40">Business Model</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {reviewQuality && (
          <GameCard glow={reviewQuality.finalDecision === "accept" ? "emerald" : reviewQuality.finalDecision === "reject" ? "rose" : "amber"} className="hud-corner border-cyan-500/20">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300/70">
                  Rubric Verdict
                </p>
                <h2 className="mt-1 text-xl font-black text-white capitalize">
                  Final Decision: {reviewQuality.finalDecision ?? review.decision}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/60">
                  {reviewQuality.decisionSummary}
                </p>
              </div>
              <div className="border border-white/10 bg-white/[0.03] px-4 py-3 text-right">
                <p className="text-[10px] uppercase tracking-widest text-white/35">Confidence</p>
                <p className="text-2xl font-black text-white">{reviewQuality.decisionConfidence ?? "N/A"}</p>
              </div>
            </div>

            {reviewQuality.modelRecommendation &&
              reviewQuality.finalDecision &&
              reviewQuality.modelRecommendation !== reviewQuality.finalDecision && (
                <div className="mb-5 border border-amber-500/20 bg-amber-500/10 p-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
                    Rule Guardrail Applied
                  </p>
                  <p className="mt-1 text-sm text-white/65">
                    Model recommendation was {reviewQuality.modelRecommendation}; final decision was adjusted to{" "}
                    {reviewQuality.finalDecision}.
                  </p>
                  <ReviewList items={reviewQuality.ruleReasons} />
                </div>
              )}

            <div className="grid gap-3 md:grid-cols-5">
              {Object.entries(reviewQuality.dimensions ?? {}).map(([key, dimension]) => (
                <div key={key} className="border border-white/10 bg-black/20 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/70">{key}</p>
                    <p className="text-lg font-black text-white">{dimension.score}</p>
                  </div>
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-emerald-300/70">Evidence</p>
                  <ReviewList items={dimension.evidence?.slice(0, 2)} />
                  <p className="mb-1 mt-3 text-[10px] uppercase tracking-widest text-rose-300/70">Concerns</p>
                  <ReviewList items={dimension.concerns?.slice(0, 2)} />
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {reviewQuality.finalDecision === "accept" && (
                <div className="border border-emerald-500/15 bg-emerald-500/5 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-300">
                    Why Accepted
                  </p>
                  <ReviewList items={reviewQuality.acceptanceRationale} />
                </div>
              )}
              {reviewQuality.finalDecision === "conditional" && (
                <div className="border border-amber-500/15 bg-amber-500/5 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-300">
                    Conditions To Become Fundable
                  </p>
                  <ReviewList items={reviewQuality.conditionalRequirements} />
                </div>
              )}
              {reviewQuality.finalDecision === "reject" && (
                <div className="border border-rose-500/15 bg-rose-500/5 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-rose-300">
                    Why Rejected
                  </p>
                  <ReviewList items={reviewQuality.rejectionReasons} />
                  <p className="mt-3 text-xs text-white/45">
                    No Term Sheet Generated: {reviewQuality.noTermSheetReason ?? "The pitch does not clear the funding bar yet."}
                  </p>
                </div>
              )}
              <div className="border border-cyan-500/15 bg-cyan-500/5 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-300">
                  What Would Change The Decision
                </p>
                <ReviewList items={reviewQuality.whatWouldChangeDecision} />
              </div>
              <div className="border border-white/10 bg-white/[0.03] p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/50">
                  Missing Information
                </p>
                <ReviewList items={reviewQuality.missingInformation} />
                <ReviewList items={reviewQuality.minimumEvidenceNeeded} />
              </div>
              <div className="border border-violet-500/15 bg-violet-500/5 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-violet-300">
                  Risks & Milestones
                </p>
                <ReviewList items={reviewQuality.majorRisksStillPresent} />
                <ReviewList items={reviewQuality.milestoneConditions} />
              </div>
            </div>

            {(reviewQuality.redFlags?.length || reviewQuality.qualityFlags?.length) && (
              <div className="mt-5 border border-rose-500/15 bg-rose-500/5 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-rose-300">
                  Review Quality Flags
                </p>
                <ReviewList items={[...(reviewQuality.redFlags ?? []), ...(reviewQuality.qualityFlags ?? [])]} />
              </div>
            )}
          </GameCard>
        )}

        <BetaFeedbackForm
          startupId={id}
          reviewId={review.id}
          decision={reviewQuality?.finalDecision ?? review.decision}
          score={review.overallScore}
          provider={privateBetaAIReview?.provider ?? "legacy"}
          route={`/startup/${id}/review`}
        />

        {/* Phase 14: Investment Committee */}
        {hasCommittee && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Investment Committee
                </CardTitle>
                <CardDescription>
                  How 6 specialist partners view this opportunity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {committee.personaReviews.map((p) => {
                    const badge = stanceBadge(p.stance);
                    return (
                      <div
                        key={p.personaId}
                        className="rounded-xl border border-white/5 bg-white/5 p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{p.personaName}</span>
                          <span className="text-sm font-bold">{p.score}</span>
                        </div>
                        <div className="text-xs text-white/40 mb-2">{p.focusArea}</div>
                        <p className="text-xs text-white/80 mb-2 line-clamp-2">{p.note}</p>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
                            badge.classes
                          )}
                        >
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Committee Consensus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/40">Support Level</span>
                    <span className="text-sm font-bold">{committee.supportLevel}%</span>
                  </div>
                  <ProgressBar value={committee.supportLevel} size="sm" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ThumbsUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-300">Strongest Support</span>
                    </div>
                    <p className="text-xs text-white/80">{committee.strongestSupportQuote}</p>
                  </div>
                  <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ThumbsDown className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-medium text-rose-300">Strongest Objection</span>
                    </div>
                    <p className="text-xs text-white/80">{committee.strongestObjectionQuote}</p>
                  </div>
                </div>

                {committee.mainObjections.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium">Main Objections</span>
                    </div>
                    <ul className="space-y-1">
                      {committee.mainObjections.map((obj, i) => (
                        <li key={i} className="text-xs text-white/40">• {obj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {committee.whatWouldChangeTheirMind.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-medium">What Would Change Their Mind</span>
                    </div>
                    <ul className="space-y-1">
                      {committee.whatWouldChangeTheirMind.map((item, i) => (
                        <li key={i} className="text-xs text-white/40">• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/40">Recommended Terms Stance:</span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                      termsStanceBadge(committee.termsStance).classes
                    )}
                  >
                    {termsStanceBadge(committee.termsStance).label}
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Investor Memo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{review.memo}</p>
          </CardContent>
        </Card>

        {(review.strengths || review.weaknesses) && (
          <Card>
            <CardHeader>
              <CardTitle>Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {review.strengths && (
                <div>
                  <h4 className="text-sm font-medium text-green-700 mb-1">Strengths</h4>
                  <p className="text-sm whitespace-pre-wrap">{review.strengths}</p>
                </div>
              )}
              {review.weaknesses && (
                <div>
                  <h4 className="text-sm font-medium text-destructive mb-1">Weaknesses</h4>
                  <p className="text-sm whitespace-pre-wrap">{review.weaknesses}</p>
                </div>
              )}
              {review.marketTiming && (
                <div>
                  <h4 className="text-sm font-medium text-white/40 mb-1">Market Timing</h4>
                  <p className="text-sm">{review.marketTiming}</p>
                </div>
              )}
              {review.milestones && (
                <div>
                  <h4 className="text-sm font-medium text-white/40 mb-1">Required Milestones</h4>
                  <p className="text-sm whitespace-pre-wrap">{review.milestones}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {review.decision === "proposal" && (review.proposedAmount || review.proposedEquity) && (
          <Card>
            <CardHeader>
              <CardTitle>Investment Proposal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {review.proposedAmount && (
                <div className="flex justify-between">
                  <span className="text-sm text-white/40">Proposed Amount</span>
                  <span className="font-medium">${Number(review.proposedAmount).toLocaleString()}</span>
                </div>
              )}
              {review.proposedEquity && (
                <div className="flex justify-between">
                  <span className="text-sm text-white/40">Equity Requested</span>
                  <span className="font-medium">{Number(review.proposedEquity)}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Phase 14: Founder Coaching */}
        {!!raw?.coaching && typeof raw?.coaching === "object" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Founder Coaching
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3">
                <div className="text-xs text-emerald-300 font-medium mb-1">What you did well</div>
                <p className="text-xs text-white/80">{(raw.coaching as Record<string, string>).strongDecision}</p>
              </div>
              <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
                <div className="text-xs text-amber-300 font-medium mb-1">Area to improve</div>
                <p className="text-xs text-white/80">{(raw.coaching as Record<string, string>).weakDecision}</p>
              </div>
              <div className="rounded-lg border border-cyan-500/10 bg-cyan-500/5 p-3">
                <div className="text-xs text-cyan-300 font-medium mb-1">Next action</div>
                <p className="text-xs text-white/80">{(raw.coaching as Record<string, string>).nextAction}</p>
              </div>
              <div className="rounded-lg border border-violet-500/10 bg-violet-500/5 p-3">
                <div className="text-xs text-violet-300 font-medium mb-1">Key lesson</div>
                <p className="text-xs text-white/80">{(raw.coaching as Record<string, string>).startupLesson}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          <Link href={`/startup/${id}/pitch`}>
            <Button variant="outline">Revise Pitch</Button>
          </Link>
          <Link href={`/startup/${id}`}>
            <Button variant="outline">Back to Profile</Button>
          </Link>

          {isInvestable && !hasTermSheet && (
            <Link href={`/startup/${id}/terms`}>
              <Button className="ml-auto">Review Term Sheet</Button>
            </Link>
          )}

          {isInvestable && hasTermSheet && (
            <Link href={`/startup/${id}/terms`}>
              <Button className="ml-auto">View Term Sheet</Button>
            </Link>
          )}

          {!isInvestable && (
            <Button disabled className="ml-auto">
              Term Sheet — Not Available
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
