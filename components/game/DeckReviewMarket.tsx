"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Building2, FileText, FileUp, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type IntakeMode = "pdf_upload" | "manual_pitch" | "ai_generated_deck";

interface PublicFirm {
  id: string;
  name: string;
  sectorFocus: string[];
  checkSizeRange: string;
  riskAppetite: string;
  publicDescription: string;
}

interface FirmReviewView {
  firmId: string;
  firmName: string;
  decision: "pass" | "interested" | "conditional" | "term_sheet_ready";
  score: number;
  confidence: number;
  checkSizeSuggestion: string;
  valuationView: string;
  whyTheyLikeIt: string[];
  mainConcerns: string[];
  dealBreakers: string[];
  questionsForFounder: string[];
  requiredMilestones: string[];
  missingInformation: string[];
  summary: string;
}

interface AggregateView {
  overallDecision: "rejected" | "mixed" | "conditional" | "fundable";
  overallScore: number;
  interestedFirmIds: string[];
  fundingLikelihood: "low" | "medium" | "high";
  topReasons: string[];
  topRisks: string[];
  bestNextMilestones: string[];
  suggestedPitchFixes: string[];
  playerFacingSummary: string;
}

interface GeneratedDeck {
  deckTitle: string;
  oneLinePitch: string;
  slides: Array<{
    slideNumber: number;
    title: string;
    headline: string;
    bullets: string[];
    speakerNote: string;
  }>;
  generatedWarnings: string[];
  missingInfo: string[];
  qualityScore: number;
}

interface JobView {
  jobId: string;
  reviewInputType: IntakeMode;
  status: "uploaded" | "extracting_deck" | "reviewing" | "completed" | "failed";
  deckFileName: string | null;
  sourceSummary: string | null;
  accessUsedCredit: boolean;
  safeErrorMessage: string | null;
  firmReviews: FirmReviewView[] | null;
  aggregateReview: AggregateView | null;
}

interface GenerationJobView {
  jobId: string;
  status: string;
  safeErrorMessage: string | null;
  generatedDeck: GeneratedDeck | null;
  accessUsedCredit: boolean;
}

const DECISION_STYLES: Record<FirmReviewView["decision"], string> = {
  pass: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  interested: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  conditional: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  term_sheet_ready: "border-violet-500/30 bg-violet-500/10 text-violet-300",
};

const OVERALL_STYLES: Record<AggregateView["overallDecision"], string> = {
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  mixed: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  conditional: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  fundable: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

const MODE_OPTIONS: Array<{ id: IntakeMode; label: string; icon: typeof FileUp }> = [
  { id: "pdf_upload", label: "Upload PDF Deck", icon: FileUp },
  { id: "manual_pitch", label: "Write Pitch Manually", icon: FileText },
  { id: "ai_generated_deck", label: "Generate Deck with AI", icon: Sparkles },
];

const PROFILE_FIELDS = [
  ["companyName", "Company name"],
  ["city", "City"],
  ["country", "Country"],
  ["websiteUrl", "Website"],
  ["sector", "Sector"],
  ["targetCustomer", "Target customer"],
  ["currentStage", "Stage"],
] as const;

export function DeckReviewMarket({ startupId }: { startupId: string }) {
  const [firms, setFirms] = useState<PublicFirm[]>([]);
  const [selectedFirmIds, setSelectedFirmIds] = useState<string[]>([]);
  const [autoSelect, setAutoSelect] = useState(true);
  const [mode, setMode] = useState<IntakeMode>("pdf_upload");
  const [file, setFile] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [pitchText, setPitchText] = useState("");
  const [deckRequest, setDeckRequest] = useState("");
  const [realLifeStartup, setRealLifeStartup] = useState(false);
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [generatedJob, setGeneratedJob] = useState<GenerationJobView | null>(null);
  const [job, setJob] = useState<JobView | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/vc-review-firms")
      .then((response) => response.json())
      .then((data) => setFirms(data.firms ?? []))
      .catch(() => setFirms([]));
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollJob = useCallback((jobId: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/vc-review-jobs/${jobId}`);
        if (!response.ok) return;
        const data = await response.json();
        const nextJob: JobView = data.job;
        setJob(nextJob);
        if (nextJob.status === "completed" || nextJob.status === "failed") stopPolling();
      } catch {
        /* keep polling */
      }
    }, 3000);
  }, [stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  function appendSharedFields(form: FormData) {
    form.set("startupId", startupId);
    form.set("inputType", mode);
    if (notes.trim()) form.set("manualNotes", notes.trim());
    if (!autoSelect && selectedFirmIds.length > 0) form.set("firmIds", selectedFirmIds.join(","));
    if (logo) form.set("logo", logo);
    form.set("profile.realLifeStartup", String(realLifeStartup));
    for (const [field] of PROFILE_FIELDS) {
      const value = profile[field]?.trim();
      if (value) form.set(`profile.${field}`, value);
    }
    for (const field of ["shortDescription", "founderGoal", "fundingGoal", "existingProductUrl", "tractionSummary", "revenueSummary", "teamSummary"]) {
      const value = profile[field]?.trim();
      if (value) form.set(`profile.${field}`, value);
    }
  }

  async function generateDeck() {
    if (generating) return;
    setGenerating(true);
    setError(null);

    const form = new FormData();
    appendSharedFields(form);
    form.set("requestText", deckRequest);

    try {
      const response = await fetch("/api/deck-generation-jobs", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "AI deck generation failed.");
        return;
      }
      setGeneratedJob(data.job);
    } catch {
      setError("Network error while generating the deck.");
    } finally {
      setGenerating(false);
    }
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const form = new FormData();
    appendSharedFields(form);

    if (mode === "pdf_upload") {
      if (!file) {
        setSubmitting(false);
        return;
      }
      form.set("deck", file);
    } else if (mode === "manual_pitch") {
      form.set("pitchText", pitchText);
    } else {
      if (!generatedJob?.jobId) {
        setError("Generate a deck before submitting it to the firms.");
        setSubmitting(false);
        return;
      }
      form.set("generatedDeckJobId", generatedJob.jobId);
    }

    try {
      const response = await fetch("/api/vc-review-jobs", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok && response.status !== 202) {
        setError(data.error ?? "Investment firm review submission failed.");
        if (data.job) setJob(data.job);
        return;
      }
      setJob(data.job);
      if (data.job?.status === "reviewing" || data.job?.status === "extracting_deck" || data.job?.status === "uploaded") {
        pollJob(data.job.jobId);
      }
    } catch {
      setError("Network error while submitting to the firms.");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleFirm(id: string) {
    setSelectedFirmIds((current) =>
      current.includes(id) ? current.filter((firmId) => firmId !== id) : current.length >= 5 ? current : [...current, id]
    );
  }

  const inFlight = job && (job.status === "uploaded" || job.status === "extracting_deck" || job.status === "reviewing");
  const submitDisabled =
    submitting ||
    (!autoSelect && selectedFirmIds.length === 0) ||
    (mode === "pdf_upload" && !file) ||
    (mode === "manual_pitch" && pitchText.trim().length < 300) ||
    (mode === "ai_generated_deck" && !generatedJob?.generatedDeck);

  return (
    <div className="border border-violet-500/20 bg-violet-500/[0.04] p-5">
      <div className="mb-1 flex items-center gap-2 text-violet-300">
        <Building2 className="h-4 w-4" />
        <h2 className="text-sm font-black uppercase tracking-wider">AI Investment Firm Market</h2>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-white/45">
        Submit a PDF deck, manual pitch, or AI-generated deck to fictional arena investment firms. Premium or one
        rewarded/referral review credit is required for AI generation and firm review.
      </p>

      {!inFlight && (
        <div className="space-y-4">
          <div className="grid gap-2 md:grid-cols-3">
            {MODE_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMode(option.id)}
                  className={cn(
                    "flex items-center justify-center gap-2 border px-3 py-2 text-[11px] font-black uppercase tracking-wider",
                    mode === option.id ? "border-violet-400/50 bg-violet-500/15 text-violet-200" : "border-white/10 text-white/40"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="border border-white/10 bg-white/[0.02] p-3">
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-white/60">Startup profile</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PROFILE_FIELDS.map(([field, label]) => (
                <input
                  key={field}
                  value={profile[field] ?? ""}
                  onChange={(event) => setProfile((current) => ({ ...current, [field]: event.target.value.slice(0, 300) }))}
                  placeholder={label}
                  className="border border-white/10 bg-black/20 px-2 py-2 text-xs text-white/70 placeholder:text-white/25 focus:border-violet-400/40 focus:outline-none"
                />
              ))}
            </div>
            <textarea
              value={profile.shortDescription ?? ""}
              onChange={(event) => setProfile((current) => ({ ...current, shortDescription: event.target.value.slice(0, 600) }))}
              placeholder="Short company description"
              rows={2}
              className="mt-2 w-full border border-white/10 bg-black/20 p-2 text-xs text-white/70 placeholder:text-white/25 focus:border-violet-400/40 focus:outline-none"
            />
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {[
                ["tractionSummary", "Traction summary"],
                ["revenueSummary", "Revenue summary"],
                ["teamSummary", "Team summary"],
                ["fundingGoal", "Funding goal"],
              ].map(([field, label]) => (
                <input
                  key={field}
                  value={profile[field] ?? ""}
                  onChange={(event) => setProfile((current) => ({ ...current, [field]: event.target.value.slice(0, 500) }))}
                  placeholder={label}
                  className="border border-white/10 bg-black/20 px-2 py-2 text-xs text-white/70 placeholder:text-white/25 focus:border-violet-400/40 focus:outline-none"
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/45">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={realLifeStartup} onChange={(event) => setRealLifeStartup(event.target.checked)} />
                Real-life startup profile
              </label>
              <label className="cursor-pointer text-violet-300">
                {logo ? `Logo: ${logo.name}` : "Optional private logo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </div>

          {mode === "pdf_upload" && (
            <label className="flex cursor-pointer items-center gap-3 border border-dashed border-white/20 bg-white/[0.02] p-3 text-xs text-white/60 transition-colors hover:border-violet-400/40">
              <FileUp className="h-4 w-4 shrink-0 text-violet-300" />
              <span className="truncate">{file ? file.name : "Choose pitch deck PDF (max 15MB, 40 pages, text-based)"}</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
          )}

          {mode === "manual_pitch" && (
            <textarea
              value={pitchText}
              onChange={(event) => setPitchText(event.target.value.slice(0, 30000))}
              placeholder="Write the full pitch firms should review (problem, solution, market, traction, GTM, team, funding ask). Minimum 300 characters."
              rows={8}
              className="w-full border border-white/10 bg-white/[0.02] p-3 text-xs text-white/70 placeholder:text-white/25 focus:border-violet-400/40 focus:outline-none"
            />
          )}

          {mode === "ai_generated_deck" && (
            <div className="space-y-3">
              <textarea
                value={deckRequest}
                onChange={(event) => setDeckRequest(event.target.value.slice(0, 4000))}
                placeholder="Describe the startup and what the deck should emphasize. The backend will generate a structured 12-slide investor deck without inventing traction."
                rows={4}
                className="w-full border border-white/10 bg-white/[0.02] p-3 text-xs text-white/70 placeholder:text-white/25 focus:border-violet-400/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={generateDeck}
                disabled={generating || deckRequest.trim().length < 80}
                className="inline-flex items-center gap-2 border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generate professional deck
              </button>
              {generatedJob?.generatedDeck && (
                <div className="border border-cyan-500/20 bg-cyan-500/[0.04] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-wider text-cyan-200">{generatedJob.generatedDeck.deckTitle}</p>
                    <p className="text-[11px] text-white/45">Quality {generatedJob.generatedDeck.qualityScore}/100</p>
                  </div>
                  <p className="mt-1 text-xs text-white/55">{generatedJob.generatedDeck.oneLinePitch}</p>
                  <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    {generatedJob.generatedDeck.slides.slice(0, 6).map((slide) => (
                      <p key={slide.slideNumber} className="text-[11px] text-white/40">
                        {slide.slideNumber}. {slide.title}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value.slice(0, 2000))}
            placeholder="Optional founder notes for the firms (max 2000 chars)"
            rows={2}
            className="w-full border border-white/10 bg-white/[0.02] p-2 text-xs text-white/70 placeholder:text-white/25 focus:border-violet-400/40 focus:outline-none"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoSelect(true)}
              className={cn("border px-2 py-1 text-[11px] font-bold uppercase tracking-wider", autoSelect ? "border-violet-400/50 bg-violet-500/15 text-violet-200" : "border-white/10 text-white/40")}
            >
              Auto-select firms
            </button>
            <button
              type="button"
              onClick={() => setAutoSelect(false)}
              className={cn("border px-2 py-1 text-[11px] font-bold uppercase tracking-wider", !autoSelect ? "border-violet-400/50 bg-violet-500/15 text-violet-200" : "border-white/10 text-white/40")}
            >
              Pick firms
            </button>
          </div>

          {!autoSelect && (
            <div className="grid gap-2 sm:grid-cols-2">
              {firms.map((firm) => (
                <button
                  key={firm.id}
                  type="button"
                  onClick={() => toggleFirm(firm.id)}
                  className={cn("border p-2 text-left text-xs transition-colors", selectedFirmIds.includes(firm.id) ? "border-violet-400/50 bg-violet-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/25")}
                >
                  <p className="font-bold text-white/80">{firm.name}</p>
                  <p className="text-[11px] text-white/40">{firm.sectorFocus.slice(0, 3).join(" · ")} · {firm.checkSizeRange}</p>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={submitDisabled}
            className="inline-flex items-center gap-2 border border-violet-400/50 bg-violet-500/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-violet-200 transition-colors hover:bg-violet-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Building2 className="h-3.5 w-3.5" />}
            Submit to AI firms
          </button>
        </div>
      )}

      {error && <p className="mt-3 border border-rose-500/25 bg-rose-500/10 p-2 text-xs text-rose-300">{error}</p>}

      {inFlight && (
        <div className="mt-3 flex items-center gap-3 border border-white/10 bg-white/[0.02] p-3 text-xs text-white/60">
          <Loader2 className="h-4 w-4 animate-spin text-violet-300" />
          <span>AI investment firms are reviewing your submission… this can take a couple of minutes.</span>
        </div>
      )}

      {job?.status === "failed" && (
        <div className="mt-3 space-y-2 border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-200">
          <p>{job.safeErrorMessage ?? "Deck review failed."}</p>
          <button
            type="button"
            onClick={async () => {
              const response = await fetch(`/api/vc-review-jobs/${job.jobId}/run`, { method: "POST" });
              if (response.ok) {
                const data = await response.json();
                setJob(data.job);
                pollJob(job.jobId);
              }
            }}
            className="inline-flex items-center gap-1 border border-rose-400/40 px-2 py-1 font-bold uppercase tracking-wider"
          >
            <RefreshCw className="h-3 w-3" /> Retry review
          </button>
        </div>
      )}

      {job?.status === "completed" && job.aggregateReview && (
        <div className="mt-4 space-y-3">
          <div className={cn("border p-3", OVERALL_STYLES[job.aggregateReview.overallDecision])}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black uppercase tracking-wider">Market verdict: {job.aggregateReview.overallDecision}</p>
              <p className="text-xs font-bold">{job.aggregateReview.overallScore}/100 · likelihood {job.aggregateReview.fundingLikelihood}</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed opacity-80">{job.aggregateReview.playerFacingSummary}</p>
            {job.sourceSummary && <p className="mt-1 text-[11px] opacity-60">Source: {job.sourceSummary}</p>}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {(job.firmReviews ?? []).map((review) => (
              <div key={review.firmId} className="border border-white/10 bg-white/[0.02] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-wider text-white/80">{review.firmName}</p>
                  <span className={cn("border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider", DECISION_STYLES[review.decision])}>
                    {review.decision.replace(/_/g, " ")} · {review.score}
                  </span>
                </div>
                <p className="mb-2 text-xs leading-relaxed text-white/55">{review.summary}</p>
                {review.checkSizeSuggestion && <p className="text-[11px] text-white/45">Check size view: {review.checkSizeSuggestion}</p>}
                {review.mainConcerns.length > 0 && <p className="mt-1 text-[11px] text-amber-300/80">Concerns: {review.mainConcerns.slice(0, 2).join(" · ")}</p>}
                {review.questionsForFounder.length > 0 && <p className="mt-1 text-[11px] text-white/40">Asks: {review.questionsForFounder.slice(0, 2).join(" · ")}</p>}
              </div>
            ))}
          </div>

          {job.aggregateReview.suggestedPitchFixes.length > 0 && (
            <div className="border border-cyan-500/20 bg-cyan-500/[0.05] p-3">
              <p className="mb-1 text-xs font-black uppercase tracking-wider text-cyan-300">Fix before re-pitching</p>
              <ul className="space-y-1">
                {job.aggregateReview.suggestedPitchFixes.map((fix) => (
                  <li key={fix} className="text-xs text-white/55">- {fix}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
