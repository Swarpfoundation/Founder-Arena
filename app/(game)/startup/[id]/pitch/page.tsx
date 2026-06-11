"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lightbulb, Save, Wand2 } from "lucide-react";
import { z } from "zod";
import { savePitchDeckAction, submitPitchForReviewAction, getStartupById } from "@/lib/actions/startup";
import { checkReviewAccessAction } from "@/lib/actions/review-queue";
import {
  getRewardedReviewAccelerationOfferAction,
  type RewardedReviewAccelerationOffer,
} from "@/lib/actions/rewarded-review-acceleration";
import { pitchDeckSchema } from "@/lib/validations";
import { generatePitchDraft, PITCH_QUALITY_HINTS } from "@/lib/onboarding/pitch-draft";
import { GameScene } from "@/components/game/GameScene";
import { GameHudBar } from "@/components/game/GameHudBar";
import { DeckReviewMarket } from "@/components/game/DeckReviewMarket";
import { RewardedReviewAccelerator } from "@/components/game/RewardedReviewAccelerator";
import {
  DossierReadinessMeter,
  DossierSectionGrid,
  FundingAskConsole,
  PitchSectionEditor,
  PitchValidationBanner,
  ReviewStatusChip,
  SavedDossierBanner,
  SubmissionGatePanel,
} from "@/components/game/PitchDeckConsole";
import {
  EMPTY_PITCH_DATA,
  PITCH_SECTION_CONFIGS,
  getDossierReadiness,
  getFundingAskRisk,
  getPitchSectionCards,
  getPitchValidationPresentation,
  getReviewLaunchPresentation,
  getSubmissionGateState,
  type PitchData,
  type PitchFieldId,
} from "@/lib/game/pitch-deck-console";
import { getNextObjective, getStartupRunStep } from "@/lib/game/objectives";

const fieldList = PITCH_SECTION_CONFIGS.map((section) => section.id);

export const dynamic = "force-dynamic";

type ReviewAccess = Awaited<ReturnType<typeof checkReviewAccessAction>>;

interface StartupPitchContext {
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
  cash: number;
  monthlyBurn: number;
  pitchDeck: unknown | null;
  vcReviews: Array<{ decision?: string | null; overallScore?: number | null }>;
  termSheets: Array<{ status?: string | null }>;
  simulationMonths: Array<{ monthNumber?: number | null }>;
}

export default function PitchBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [startupId, setStartupId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string>("");
  const [savePending, setSavePending] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasExistingPitch, setHasExistingPitch] = useState(false);
  const [reviewAccess, setReviewAccess] = useState<ReviewAccess | null>(null);
  const [rewardOffer, setRewardOffer] = useState<RewardedReviewAccelerationOffer | null>(null);
  const [startupData, setStartupData] = useState<StartupPitchContext | null>(null);
  const [pitchValues, setPitchValues] = useState<PitchData>(EMPTY_PITCH_DATA);
  const [activeField, setActiveField] = useState<PitchFieldId>("problem");

  useEffect(() => {
    params.then((p) => setStartupId(p.id));
  }, [params]);

  useEffect(() => {
    if (!startupId) return;
    getStartupById(startupId).then((startup) => {
      const nextStartupData: StartupPitchContext = {
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
        cash: startup.cash,
        monthlyBurn: startup.monthlyBurn,
        pitchDeck: startup.pitchDeck,
        vcReviews: startup.vcReviews.map((review) => ({
          decision: review.decision,
          overallScore: review.overallScore,
        })),
        termSheets: startup.termSheets.map((term) => ({ status: term.status })),
        simulationMonths: startup.simulationMonths.map((month) => ({ monthNumber: month.monthNumber })),
      };
      setStartupData(nextStartupData);

      if (startup.pitchDeck) {
        setHasExistingPitch(true);
        setPitchValues({
          problem: startup.pitchDeck.problem ?? "",
          solution: startup.pitchDeck.solution ?? "",
          marketSize: startup.pitchDeck.marketSize ?? "",
          product: startup.pitchDeck.product ?? "",
          businessModel: startup.pitchDeck.businessModel ?? "",
          goToMarket: startup.pitchDeck.goToMarket ?? "",
          competition: startup.pitchDeck.competition ?? "",
          team: startup.pitchDeck.team ?? "",
          financialPlan: startup.pitchDeck.financialPlan ?? "",
          ask: startup.pitchDeck.ask ?? "",
          useOfFunds: startup.pitchDeck.useOfFunds ?? "",
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
    setPitchValues(draft);
    setSaved(false);
  }

  function updatePitchValue(field: PitchFieldId, value: string) {
    setPitchValues((current) => ({ ...current, [field]: value }));
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
      await refreshReviewAccess();
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

  const activeConfig = PITCH_SECTION_CONFIGS.find((section) => section.id === activeField) ?? PITCH_SECTION_CONFIGS[0];
  const sectionCards = useMemo(() => getPitchSectionCards(pitchValues), [pitchValues]);
  const readiness = useMemo(() => getDossierReadiness(pitchValues), [pitchValues]);
  const fundingRisk = useMemo(() => getFundingAskRisk(pitchValues), [pitchValues]);
  const validation = getPitchValidationPresentation(errors);
  const gate = getSubmissionGateState(reviewAccess);
  const latestReview = startupData?.vcReviews[0] ?? null;
  const reviewPresentation = getReviewLaunchPresentation({
    latestReview,
    hasPitch: hasExistingPitch,
  });
  const objective = startupData && startupId
    ? getNextObjective({ ...startupData, id: startupId })
    : undefined;
  const currentStep = startupData ? getStartupRunStep(startupData) : undefined;
  const cooldownMinutes = reviewAccess
    ? Math.ceil(reviewAccess.cooldownRemainingSeconds / 60)
    : 0;

  return (
    <GameScene
      eyebrow="Investor Dossier"
      title="Pitch Deck Console"
      subtitle="Prepare the evidence board before sending the run into the VC Review Chamber."
      accent="cyan"
      actions={
        <Link href={startupId ? `/startup/${startupId}` : "/dashboard"} className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black uppercase tracking-wider text-white/45 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" />
          Startup Dossier
        </Link>
      }
      sidePanel={
        <div className="space-y-4">
          <ReviewStatusChip review={reviewPresentation} />
          <FundingAskConsole risk={fundingRisk} ask={pitchValues.ask} useOfFunds={pitchValues.useOfFunds} />
          <SubmissionGatePanel
            gate={gate}
            review={reviewPresentation}
            canSubmit={reviewAccess?.canSubmit ?? true}
            canUseToken={reviewAccess?.canBypassWithToken && !reviewAccess.canSubmit ? true : false}
            submitPending={submitPending}
            onSubmit={() => handleSubmit(false)}
            onSubmitWithToken={() => handleSubmit(true)}
          />
          {reviewAccess?.cooldownRemainingSeconds ? (
            <section className="border border-amber-500/25 bg-amber-500/[0.055] p-4 text-amber-300 hud-corner">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] opacity-70">Cooldown</p>
              <p className="mt-1 text-sm text-white/60">{cooldownMinutes} min remaining before standard submission.</p>
              {rewardOffer && (
                <div className="mt-4">
                  <RewardedReviewAccelerator
                    startupId={startupId}
                    offer={rewardOffer}
                    onRefresh={refreshReviewAccess}
                  />
                </div>
              )}
            </section>
          ) : null}
        </div>
      }
    >
      {startupId && (
        <GameHudBar
          startupId={startupId}
          startupName={startupData?.name}
          currentStep={currentStep}
          cash={startupData?.cash}
          monthlyBurn={startupData?.monthlyBurn}
          objective={objective}
        />
      )}

      {globalError && (
        <section className="border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 hud-corner">
          {globalError}
        </section>
      )}

      <PitchValidationBanner title={validation.title} messages={validation.messages} />
      {saved && <SavedDossierBanner />}

      {!hasExistingPitch && startupData && (
        <section className="border border-cyan-500/20 bg-cyan-500/[0.045] p-4 text-cyan-300 hud-corner">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                <span className="text-sm font-black uppercase tracking-wider text-white">Suggested Pitch Draft</span>
              </div>
              <p className="mt-1 text-xs text-white/45">Generate a deterministic starter dossier from the startup brief. It remains fully editable.</p>
            </div>
            <button type="button" onClick={applyDraft} className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20">
              <Lightbulb className="h-4 w-4" />
              Use Draft
            </button>
          </div>
        </section>
      )}

      <DossierReadinessMeter readiness={readiness} />

      <form action={handleSave} className="space-y-5" id="dossier-editor">
        <HiddenPitchFields values={pitchValues} activeField={activeField} />
        <DossierSectionGrid cards={sectionCards} activeField={activeField} onSelect={setActiveField} />
        <PitchSectionEditor
          config={activeConfig}
          value={pitchValues[activeField]}
          hint={PITCH_QUALITY_HINTS[activeField]}
          error={errors[activeField]}
          onChange={(value) => updatePitchValue(activeField, value)}
        />
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={savePending || submitPending} className="inline-flex items-center gap-2 border border-cyan-500/35 bg-cyan-500/15 px-5 py-3 text-xs font-black uppercase tracking-wider text-cyan-200 hover:bg-cyan-500/25 disabled:opacity-50">
            <Save className="h-4 w-4" />
            {savePending ? "Saving..." : "Save Dossier"}
          </button>
          <button type="button" onClick={() => router.push(`/startup/${startupId}`)} disabled={savePending || submitPending} className="border border-white/10 bg-white/[0.03] px-5 py-3 text-xs font-black uppercase tracking-wider text-white/55 hover:text-white disabled:opacity-50">
            Return To Startup
          </button>
        </div>
      </form>

      <DeckReviewMarket startupId={startupId} />
    </GameScene>
  );
}

function HiddenPitchFields({ values, activeField }: { values: PitchData; activeField: PitchFieldId }) {
  return (
    <>
      {fieldList.filter((field) => field !== activeField).map((field) => (
        <input key={field} type="hidden" name={field} value={values[field]} />
      ))}
    </>
  );
}
