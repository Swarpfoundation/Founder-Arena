"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { savePitchDeckAction, submitPitchForReviewAction, getStartupById } from "@/lib/actions/startup";
import { checkReviewAccessAction } from "@/lib/actions/review-queue";
import {
  getRewardedReviewAccelerationOfferAction,
  type RewardedReviewAccelerationOffer,
} from "@/lib/actions/rewarded-review-acceleration";
import { pitchDeckSchema } from "@/lib/validations";
import { generatePitchDraft, PITCH_QUALITY_HINTS } from "@/lib/onboarding/pitch-draft";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GameCard } from "@/components/game/GameCard";
import { StartupRunHud } from "@/components/game/StartupRunHud";
import { PageReveal } from "@/components/game/PageReveal";
import { RewardedReviewAccelerator } from "@/components/game/RewardedReviewAccelerator";
import { z } from "zod";
import {
  Wand2,
  Save,
  Send,
  Lightbulb,
  Zap,
  Clock,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fieldList = [
  "problem",
  "solution",
  "marketSize",
  "product",
  "businessModel",
  "goToMarket",
  "competition",
  "team",
  "financialPlan",
  "ask",
  "useOfFunds",
] as const;

export const dynamic = "force-dynamic";

export default function PitchBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [startupId, setStartupId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string>("");
  const [savePending, setSavePending] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasExistingPitch, setHasExistingPitch] = useState(false);
  const [reviewAccess, setReviewAccess] = useState<{
    canSubmit: boolean;
    reason?: string;
    isFirstReview: boolean;
    cooldownRemainingSeconds: number;
    monthlyQuotaRemaining: number;
    monthlyQuotaLimit: number;
    speedTokensAvailable: number;
    canBypassWithToken: boolean;
    weeklySubmission: {
      planId: "free" | "pro" | "max";
      isPaid: boolean;
      windowStart: Date | string;
      windowEnd: Date | string;
      usedCount: number;
      freeLimit: number;
      remainingFreeSubmissions: number;
      submissionCreditsAvailable: number;
      canSubmit: boolean;
      willUseCredit: boolean;
      reason?: string;
    };
  } | null>(null);
  const [rewardOffer, setRewardOffer] = useState<RewardedReviewAccelerationOffer | null>(null);
  const [startupData, setStartupData] = useState<{
    name: string;
    sector: string;
    description: string;
    targetMarket: string;
    problem: string;
    solution: string;
    monetizationModel: string;
    unfairAdvantage: string;
    fundingAsk: number;
    status: string;
  } | null>(null);

  useEffect(() => {
    params.then((p) => setStartupId(p.id));
  }, [params]);

  useEffect(() => {
    if (!startupId) return;
    getStartupById(startupId).then((startup) => {
      setStartupData({
        name: startup.name,
        sector: startup.sector,
        description: startup.description ?? startup.tagline ?? "",
        targetMarket: startup.targetMarket ?? "",
        problem: startup.problem ?? "",
        solution: startup.solution ?? "",
        monetizationModel: startup.monetizationModel ?? "",
        unfairAdvantage: startup.unfairAdvantage ?? "",
        fundingAsk: startup.fundingAsk ?? 500000,
        status: startup.status,
      });

      if (startup.pitchDeck) {
        setHasExistingPitch(true);
        const pd = startup.pitchDeck;
        fieldList.forEach((field) => {
          const el = document.getElementById(field) as HTMLInputElement | HTMLTextAreaElement | null;
          if (el && pd[field as keyof typeof pd]) {
            el.value = String(pd[field as keyof typeof pd] ?? "");
          }
        });
      }
    });
    refreshReviewAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startupId]);

  async function refreshReviewAccess() {
    if (!startupId) return;
    const [access, offer] = await Promise.all([
      checkReviewAccessAction(startupId),
      getRewardedReviewAccelerationOfferAction(startupId),
    ]);
    setReviewAccess(access);
    setRewardOffer(offer);
  }

  function applyDraft() {
    if (!startupData) return;
    const draft = generatePitchDraft(startupData);
    fieldList.forEach((field) => {
      const el = document.getElementById(field) as HTMLInputElement | HTMLTextAreaElement | null;
      if (el) {
        el.value = draft[field];
      }
    });
    setSaved(false);
  }

  async function handleSave(formData: FormData) {
    setErrors({});
    setGlobalError("");
    setSaved(false);
    setSavePending(true);

    try {
      const data = Object.fromEntries(formData.entries()) as Record<string, string>;
      const validated = pitchDeckSchema.parse(data);
      await savePitchDeckAction(startupId, validated);
      setSaved(true);
      setHasExistingPitch(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((e) => {
          const path = e.path[0] as string;
          if (!fieldErrors[path]) fieldErrors[path] = e.message;
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        setGlobalError(error.message);
      } else {
        setGlobalError("Something went wrong. Please try again.");
      }
    } finally {
      setSavePending(false);
    }
  }

  async function handleSubmit(useSpeedToken = false) {
    setGlobalError("");
    setSubmitPending(true);
    try {
      await submitPitchForReviewAction(startupId, { useSpeedToken });
    } catch (error) {
      if (error instanceof Error) {
        setGlobalError(error.message);
      } else {
        setGlobalError("Something went wrong. Please try again.");
      }
      setSubmitPending(false);
    }
  }

  const cooldownMinutes = reviewAccess
    ? Math.ceil(reviewAccess.cooldownRemainingSeconds / 60)
    : 0;
  const weeklyResetDate = reviewAccess?.weeklySubmission
    ? new Date(reviewAccess.weeklySubmission.windowEnd).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <PageReveal className="max-w-3xl mx-auto pt-24 pb-12 px-4 md:px-8">
      <div className="mb-6">
        <button onClick={() => router.push(`/startup/${startupId}`)} className="text-sm text-white/40 hover:text-white transition-colors">
          ← Back to Startup
        </button>
      </div>

      <p className="text-[10px] tracking-[0.4em] text-cyan-400/40 mb-2">Pitch Deck Console</p>
      <h1 className="text-3xl md:text-4xl font-black text-white text-glow-cyan tracking-tight mb-2">Investor Entry Ritual</h1>
      <p className="text-white/40 mb-8">
        Investors do not fund ideas. They fund pressure-tested execution. Build the pitch, send it to review, then negotiate the capital that unlocks Week 1.
      </p>

      {startupId && (
        <StartupRunHud
          startupId={startupId}
          status={startupData?.status ?? "draft"}
          className="mb-6"
        />
      )}

      <div className="mb-6 grid grid-cols-4 gap-2">
        {[
          { label: "Brief", active: true },
          { label: "VC Review", active: hasExistingPitch },
          { label: "Terms", active: false },
          { label: "Week 1", active: false },
        ].map((step, index) => (
          <div
            key={step.label}
            className={cn(
              "border px-3 py-2 text-center",
              step.active
                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                : "border-white/10 bg-white/[0.02] text-white/30"
            )}
          >
            <p className="text-[9px] font-black uppercase tracking-wider">{String(index + 1).padStart(2, "0")}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider">{step.label}</p>
          </div>
        ))}
      </div>

      {globalError && (
        <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {globalError}
        </div>
      )}

      {saved && (
        <div className="mb-6 rounded-md border border-emerald-500/50 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          Pitch deck saved successfully.
        </div>
      )}

      {/* Review Access Status */}
      {reviewAccess && !reviewAccess.isFirstReview && (
        <div className="mb-6 p-4 border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-white/40" />
            <p className="text-[10px] tracking-[0.2em] text-white/40">REVIEW STATUS</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {reviewAccess.weeklySubmission.isPaid ? (
              <div>
                <p className="text-sm text-white/60">
                  Plan access: <span className="text-white font-bold">Unlimited VC review submissions</span>
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-white/60">
                  Weekly reviews:{" "}
                  <span className="text-white font-bold">
                    {reviewAccess.weeklySubmission.remainingFreeSubmissions}
                  </span>{" "}
                  / {reviewAccess.weeklySubmission.freeLimit} remaining
                  {weeklyResetDate ? <span className="text-white/35"> · resets {weeklyResetDate}</span> : null}
                </p>
              </div>
            )}
            {!reviewAccess.weeklySubmission.isPaid && (
              <div className="text-emerald-400 text-sm">
                {reviewAccess.weeklySubmission.submissionCreditsAvailable} referral review credits
              </div>
            )}
            {reviewAccess.cooldownRemainingSeconds > 0 && (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Cooldown: {cooldownMinutes} min remaining
              </div>
            )}
            {reviewAccess.speedTokensAvailable > 0 && (
              <div className="text-cyan-400 text-sm">
                <Zap className="w-4 h-4 inline mr-1" />
                {reviewAccess.speedTokensAvailable} speed tokens
              </div>
            )}
          </div>
          {!reviewAccess.canSubmit && !reviewAccess.weeklySubmission.canSubmit && (
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/pricing")}
                className="px-4 py-2 border border-cyan-400/30 text-cyan-400 text-xs tracking-wider hover:bg-cyan-400/10 transition-all"
              >
                <ExternalLink className="w-3 h-3 inline mr-1" /> UPGRADE PLAN
              </button>
              <button
                type="button"
                onClick={() => router.push("/referrals")}
                className="px-4 py-2 border border-emerald-400/30 text-emerald-400 text-xs tracking-wider hover:bg-emerald-400/10 transition-all"
              >
                INVITE FOR CREDITS
              </button>
            </div>
          )}
          {reviewAccess.cooldownRemainingSeconds > 0 && rewardOffer && (
            <div className="mt-4">
              <RewardedReviewAccelerator
                startupId={startupId}
                offer={rewardOffer}
                onRefresh={refreshReviewAccess}
              />
            </div>
          )}
        </div>
      )}

      {/* Draft suggestion */}
      {!hasExistingPitch && startupData && (
        <GameCard glow="cyan" className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Wand2 className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Suggested Pitch Draft</span>
              </div>
              <p className="text-xs text-white/40">
                We can generate a starter pitch from your startup fields. It is editable and not final.
              </p>
            </div>
            <button type="button" onClick={applyDraft} className="relative inline-flex items-center gap-2 px-4 py-2 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all shrink-0">
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400" />
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-bold text-xs tracking-wider uppercase">USE DRAFT</span>
            </button>
          </div>
        </GameCard>
      )}

      <form action={handleSave} className="space-y-6">
        <div className="border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold tracking-wider text-white uppercase">Core Story</div>
            <div className="text-xs text-white/40 mt-0.5">The heart of your pitch.</div>
          </div>
          <div className="space-y-4">
            <PitchField
              id="problem"
              label="Problem"
              rows={4}
              placeholder="What painful problem are you solving?"
              hint={PITCH_QUALITY_HINTS.problem}
              error={errors.problem}
            />
            <PitchField
              id="solution"
              label="Solution"
              rows={4}
              placeholder="How do you solve it?"
              hint={PITCH_QUALITY_HINTS.solution}
              error={errors.solution}
            />
            <PitchField
              id="marketSize"
              label="Market Size"
              rows={3}
              placeholder="TAM, SAM, SOM with numbers"
              hint={PITCH_QUALITY_HINTS.marketSize}
              error={errors.marketSize}
            />
          </div>
        </div>

        <div className="border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold tracking-wider text-white uppercase">Product & Business</div>
          </div>
          <div className="space-y-4">
            <PitchField
              id="product"
              label="Product"
              rows={4}
              placeholder="What are you building?"
              hint={PITCH_QUALITY_HINTS.product}
              error={errors.product}
            />
            <PitchField
              id="businessModel"
              label="Business Model"
              rows={3}
              placeholder="How do you make money?"
              hint={PITCH_QUALITY_HINTS.businessModel}
              error={errors.businessModel}
            />
            <PitchField
              id="goToMarket"
              label="Go-to-Market"
              rows={3}
              placeholder="How will you acquire customers?"
              hint={PITCH_QUALITY_HINTS.goToMarket}
              error={errors.goToMarket}
            />
            <PitchField
              id="competition"
              label="Competition"
              rows={3}
              placeholder="Who else is in this space?"
              hint={PITCH_QUALITY_HINTS.competition}
              error={errors.competition}
            />
          </div>
        </div>

        <div className="border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold tracking-wider text-white uppercase">Team & Financials</div>
          </div>
          <div className="space-y-4">
            <PitchField
              id="team"
              label="Team"
              rows={3}
              placeholder="Who is on the team?"
              hint={PITCH_QUALITY_HINTS.team}
              error={errors.team}
            />
            <PitchField
              id="financialPlan"
              label="Financial Plan"
              rows={3}
              placeholder="Revenue projections, unit economics"
              hint={PITCH_QUALITY_HINTS.financialPlan}
              error={errors.financialPlan}
            />
            <PitchField
              id="ask"
              label="Funding Ask"
              rows={1}
              placeholder="$500,000 seed round"
              hint={PITCH_QUALITY_HINTS.ask}
              error={errors.ask}
              input
            />
            <PitchField
              id="useOfFunds"
              label="Use of Funds"
              rows={3}
              placeholder="How will you spend the money?"
              hint={PITCH_QUALITY_HINTS.useOfFunds}
              error={errors.useOfFunds}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <button type="submit" disabled={savePending || submitPending} className="relative inline-flex items-center gap-2 px-6 py-3 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all disabled:opacity-50">
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400" />
            <Save className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 font-bold text-xs tracking-wider uppercase">{savePending ? "SAVING..." : "SAVE PITCH"}</span>
          </button>

          {/* Submit with optional speed token */}
          {reviewAccess?.canBypassWithToken && !reviewAccess.canSubmit && (
            <button
              type="button"
              disabled={savePending || submitPending}
              onClick={() => handleSubmit(true)}
              className="relative inline-flex items-center gap-2 px-6 py-3 border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 transition-all disabled:opacity-50"
            >
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-amber-400" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-amber-400" />
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-bold text-xs tracking-wider uppercase">{submitPending ? "SUBMITTING..." : "USE TOKEN & SUBMIT"}</span>
            </button>
          )}

          {(reviewAccess?.canSubmit ?? true) && (
            <button
              type="button"
              disabled={savePending || submitPending}
              onClick={() => handleSubmit(false)}
              className="relative inline-flex items-center gap-2 px-6 py-3 border border-violet-400/30 bg-violet-400/10 hover:bg-violet-400/20 transition-all disabled:opacity-50"
            >
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-violet-400" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-violet-400" />
              <Send className="w-4 h-4 text-violet-400" />
              <span className="text-violet-400 font-bold text-xs tracking-wider uppercase">{submitPending ? "SUBMITTING..." : "ENTER VC REVIEW CHAMBER"}</span>
            </button>
          )}

          <button type="button" onClick={() => router.push(`/startup/${startupId}`)} disabled={savePending || submitPending} className="relative inline-flex items-center gap-2 px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50">
            <span className="text-white/60 font-bold text-xs tracking-wider uppercase">CANCEL</span>
          </button>
        </div>
      </form>
    </PageReveal>
  );
}

function PitchField({
  id,
  label,
  rows,
  placeholder,
  hint,
  error,
  input,
}: {
  id: string;
  label: string;
  rows: number;
  placeholder: string;
  hint: string;
  error?: string;
  input?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {input ? (
        <Input id={id} name={id} placeholder={placeholder} />
      ) : (
        <Textarea id={id} name={id} rows={rows} placeholder={placeholder} />
      )}
      <p className="text-xs text-white/40 flex items-start gap-1">
        <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
        {hint}
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
