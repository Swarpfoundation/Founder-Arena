import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, Lock, MessageSquare, ShieldAlert, Unlock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  InvestorSeatPresentation,
  ReviewStatusScenePresentation,
  TermSheetVaultPresentation,
  VerdictPresentation,
} from "@/lib/game/vc-review-chamber";
import type { VCReviewDimensionAssessment, VCReviewDimensionKey, VCReviewFinalDecision } from "@/lib/ai-review/types";

const TONE_BORDER: Record<string, string> = {
  emerald: "border-emerald-500/25 bg-emerald-500/[0.055] text-emerald-300",
  amber: "border-amber-500/25 bg-amber-500/[0.055] text-amber-300",
  rose: "border-rose-500/30 bg-rose-500/[0.06] text-rose-300",
  cyan: "border-cyan-500/25 bg-cyan-500/[0.055] text-cyan-300",
  violet: "border-violet-500/25 bg-violet-500/[0.055] text-violet-300",
  white: "border-white/10 bg-white/[0.035] text-white/60",
};

export function VerdictStamp({
  verdict,
  score,
  confidence,
}: {
  verdict: VerdictPresentation;
  score?: number | null;
  confidence?: number | null;
}) {
  return (
    <section className={cn("relative overflow-hidden border-2 p-5 hud-corner", verdict.stampClass)}>
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute inset-x-0 top-1/2 h-px bg-current" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-current" />
      </div>
      <div className="relative z-10 grid gap-5 md:grid-cols-[minmax(0,1fr)_180px] md:items-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] opacity-70">{verdict.eyebrow}</p>
          <p className="mt-2 -rotate-1 border-4 border-current/50 px-4 py-3 text-center text-4xl font-black uppercase tracking-[0.18em] text-white md:inline-block md:text-5xl">
            {verdict.label}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60">{verdict.summary}</p>
        </div>
        <div className="border border-current/25 bg-black/25 p-4 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.28em] opacity-70">Overall Score</p>
          <p className="mt-1 text-5xl font-black tabular-nums text-white">
            {typeof score === "number" ? score : "N/A"}
            {typeof score === "number" && <span className="text-sm text-white/35">/100</span>}
          </p>
          {typeof confidence === "number" && (
            <p className="mt-2 text-[10px] font-black uppercase tracking-wider opacity-70">
              Confidence {confidence}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function ReviewStatusScene({
  presentation,
  provider,
  mode,
  attempts,
  maxAttempts,
  lastError,
  pitchHref,
  reviewHref,
  startupHref,
}: {
  presentation: ReviewStatusScenePresentation;
  provider?: string;
  mode?: string;
  attempts?: number;
  maxAttempts?: number;
  lastError?: string | null;
  pitchHref: string;
  reviewHref: string;
  startupHref: string;
}) {
  const primaryHref = presentation.label === "NO DOSSIER" || presentation.label === "FAILED" || presentation.label === "CANCELLED"
    ? pitchHref
    : reviewHref;

  return (
    <section className={cn("relative overflow-hidden border-2 p-6 hud-corner", presentation.stampClass)}>
      <div className="relative z-10 space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] opacity-70">{presentation.eyebrow}</p>
            <p className="mt-2 text-4xl font-black uppercase tracking-[0.18em] text-white">{presentation.label}</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{presentation.summary}</p>
          </div>
          <div className="border border-current/25 bg-black/25 p-4">
            <p className="text-[9px] font-black uppercase tracking-wider opacity-65">Safe Queue Metadata</p>
            <p className="mt-2 text-xs text-white/55">
              Provider: <span className="text-white">{provider ?? "none"}</span>
            </p>
            <p className="text-xs text-white/55">
              Mode: <span className="text-white">{mode?.replace(/_/g, " ") ?? "not submitted"}</span>
            </p>
            {typeof attempts === "number" && typeof maxAttempts === "number" && (
              <p className="text-xs text-white/55">
                Attempts: <span className="text-white">{attempts}/{maxAttempts}</span>
              </p>
            )}
          </div>
        </div>

        {lastError && (
          <div className="border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200/75">
            Provider issue detected. Raw provider logs and prompts are hidden; the worker will retry if attempts remain.
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href={primaryHref} className="inline-flex items-center gap-2 border border-current/30 bg-black/25 px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-white/10">
            {presentation.ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {presentation.canContinuePlaying && (
            <Link href={startupHref} className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-wider text-white/55 hover:text-white">
              Continue Playing
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function InvestorPanel({ seats }: { seats: InvestorSeatPresentation[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-violet-300" />
        <h2 className="text-sm font-black uppercase tracking-[0.24em] text-white">Investor Panel</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-violet-500/30 to-transparent" />
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        {seats.map((seat) => (
          <InvestorSeatCard key={seat.role} seat={seat} />
        ))}
      </div>
    </section>
  );
}

function InvestorSeatCard({ seat }: { seat: InvestorSeatPresentation }) {
  const stanceClass = {
    bullish: "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300",
    cautious: "border-amber-500/25 bg-amber-500/[0.06] text-amber-300",
    bearish: "border-rose-500/25 bg-rose-500/[0.06] text-rose-300",
    pending: "border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300",
  }[seat.stance];

  return (
    <article className={cn("border p-3 hud-corner", stanceClass)}>
      <p className="text-[9px] font-black uppercase tracking-[0.24em] opacity-70">{seat.role}</p>
      <p className="mt-2 text-3xl font-black text-white">{seat.score ?? "--"}</p>
      <p className="text-[10px] font-black uppercase tracking-wider opacity-80">{seat.label} · {seat.stance}</p>
      <p className="mt-3 line-clamp-4 text-[11px] leading-relaxed text-white/55">{seat.summary}</p>
    </article>
  );
}

export function ScoreDossierPanel({
  dimensions,
}: {
  dimensions?: Partial<Record<VCReviewDimensionKey, VCReviewDimensionAssessment>>;
}) {
  const entries = Object.entries(dimensions ?? {}).filter(
    (entry): entry is [VCReviewDimensionKey, VCReviewDimensionAssessment] => Boolean(entry[1])
  );

  if (entries.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-cyan-300" />
        <h2 className="text-sm font-black uppercase tracking-[0.24em] text-white">Startup Dossier</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/30 to-transparent" />
      </div>
      <div className="grid gap-3 lg:grid-cols-5">
        {entries.map(([key, dimension]) => (
          <div key={key} className="border border-white/10 bg-white/[0.025] p-3 hud-corner">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-black uppercase tracking-wider text-white">{key}</p>
              <p className="text-2xl font-black text-cyan-300">{dimension.score}</p>
            </div>
            <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-emerald-300/70">Evidence</p>
            <BulletList items={dimension.evidence?.slice(0, 2)} />
            <p className="mb-1 mt-3 text-[9px] font-black uppercase tracking-widest text-rose-300/70">Concerns</p>
            <BulletList items={dimension.concerns?.slice(0, 2)} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function VerdictRationalePanel({
  finalDecision,
  rejectionReasons,
  conditionalRequirements,
  acceptanceRationale,
  whatWouldChangeDecision,
  noTermSheetReason,
  majorRisksStillPresent,
  milestoneConditions,
  missingInformation,
  minimumEvidenceNeeded,
}: {
  finalDecision: VCReviewFinalDecision;
  rejectionReasons?: string[];
  conditionalRequirements?: string[];
  acceptanceRationale?: string[];
  whatWouldChangeDecision?: string[];
  noTermSheetReason?: string;
  majorRisksStillPresent?: string[];
  milestoneConditions?: string[];
  missingInformation?: string[];
  minimumEvidenceNeeded?: string[];
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {finalDecision === "accept" && (
        <RationaleBlock tone="emerald" title="Why The Panel Accepted This">
          <BulletList items={acceptanceRationale} />
        </RationaleBlock>
      )}
      {finalDecision === "conditional" && (
        <RationaleBlock tone="amber" title="Milestones To Become Fundable">
          <BulletList items={conditionalRequirements} />
        </RationaleBlock>
      )}
      {finalDecision === "reject" && (
        <RationaleBlock tone="rose" title="Why The Panel Rejected This">
          <BulletList items={rejectionReasons} />
          <p className="mt-3 text-xs text-white/45">No Term Sheet: {noTermSheetReason ?? "The pitch does not clear the funding bar yet."}</p>
        </RationaleBlock>
      )}
      <RationaleBlock tone="cyan" title="What Would Change The Decision">
        <BulletList items={whatWouldChangeDecision} />
      </RationaleBlock>
      <RationaleBlock tone="white" title="Missing Intel">
        <BulletList items={missingInformation} />
        <BulletList items={minimumEvidenceNeeded} />
      </RationaleBlock>
      <RationaleBlock tone="violet" title="Risks & Milestone Conditions">
        <BulletList items={majorRisksStillPresent} />
        <BulletList items={milestoneConditions} />
      </RationaleBlock>
    </section>
  );
}

export function TermSheetVault({
  vault,
  href,
}: {
  vault: TermSheetVaultPresentation;
  href: string;
}) {
  const Icon = vault.locked ? Lock : Unlock;
  return (
    <section className={cn("border p-5 hud-corner", TONE_BORDER[vault.tone])}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-current/30 bg-black/25">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Term Sheet Vault</p>
            <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-white">{vault.label}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/55">{vault.description}</p>
          </div>
        </div>
        {vault.locked ? (
          <span className="inline-flex items-center justify-center border border-current/30 bg-black/25 px-4 py-2 text-xs font-black uppercase tracking-wider opacity-80">
            {vault.ctaLabel}
          </span>
        ) : (
          <Link href={href} className="inline-flex items-center justify-center gap-2 border border-current/30 bg-black/25 px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-white/10">
            {vault.ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </section>
  );
}

export function GuardrailNotice({
  modelRecommendation,
  finalDecision,
  ruleReasons,
}: {
  modelRecommendation?: string;
  finalDecision?: string;
  ruleReasons?: string[];
}) {
  if (!modelRecommendation || !finalDecision || modelRecommendation === finalDecision) return null;
  return (
    <section className="border border-amber-500/25 bg-amber-500/10 p-4 hud-corner">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Panel Guardrail Applied</p>
      <p className="mt-1 text-sm text-white/65">
        Model recommendation was {modelRecommendation}; final decision was adjusted to {finalDecision}.
      </p>
      <BulletList items={ruleReasons} />
    </section>
  );
}

export function RedFlagsPanel({
  redFlags,
  qualityFlags,
}: {
  redFlags?: string[];
  qualityFlags?: string[];
}) {
  const items = [...(redFlags ?? []), ...(qualityFlags ?? [])];
  if (items.length === 0) return null;
  return (
    <section className="border border-rose-500/20 bg-rose-500/5 p-4 hud-corner">
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-rose-300" />
        <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-300">Red Flags / Review Flags</p>
      </div>
      <BulletList items={items} />
    </section>
  );
}

export function FounderCoachingPanel({
  coaching,
}: {
  coaching?: Record<string, string> | null;
}) {
  if (!coaching) return null;
  return (
    <section className="border border-violet-500/20 bg-violet-500/5 p-4 hud-corner">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-violet-300" />
        <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Founder Coaching</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <CoachingTile label="What worked" value={coaching.strongDecision} tone="emerald" />
        <CoachingTile label="Improve next" value={coaching.weakDecision} tone="amber" />
        <CoachingTile label="Next action" value={coaching.nextAction} tone="cyan" />
        <CoachingTile label="Lesson" value={coaching.startupLesson} tone="violet" />
      </div>
    </section>
  );
}

function CoachingTile({ label, value, tone }: { label: string; value?: string; tone: string }) {
  if (!value) return null;
  return (
    <div className={cn("border p-3", TONE_BORDER[tone] ?? TONE_BORDER.white)}>
      <p className="mb-1 text-[9px] font-black uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-xs leading-relaxed text-white/70">{value}</p>
    </div>
  );
}

function RationaleBlock({ tone, title, children }: { tone: string; title: string; children: ReactNode }) {
  return (
    <div className={cn("border p-4 hud-corner", TONE_BORDER[tone] ?? TONE_BORDER.white)}>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-white">{title}</p>
      {children}
    </div>
  );
}

function BulletList({ items }: { items?: string[] }) {
  const safeItems = (items ?? []).filter(Boolean);
  if (safeItems.length === 0) {
    return <p className="text-xs text-white/35">No panel notes recorded.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {safeItems.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2 text-xs leading-relaxed text-white/58">
          <span className="mt-1.5 h-1 w-1 shrink-0 bg-current opacity-60" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
