"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock, FileText, Lightbulb, Radio, Send, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  DossierReadiness,
  DossierSectionCard,
  PitchFieldId,
  PitchSectionConfig,
  PitchTone,
  ReviewLaunchPresentation,
  SubmissionGatePresentation,
  FundingAskRisk,
} from "@/lib/game/pitch-deck-console";

const TONE_CLASS: Record<PitchTone, string> = {
  cyan: "border-cyan-500/25 bg-cyan-500/[0.055] text-cyan-300",
  violet: "border-violet-500/25 bg-violet-500/[0.055] text-violet-300",
  rose: "border-rose-500/30 bg-rose-500/[0.065] text-rose-300",
  amber: "border-amber-500/25 bg-amber-500/[0.06] text-amber-300",
  emerald: "border-emerald-500/25 bg-emerald-500/[0.055] text-emerald-300",
  white: "border-white/10 bg-white/[0.035] text-white/55",
};

export function DossierReadinessMeter({ readiness }: { readiness: DossierReadiness }) {
  return (
    <section className={cn("border p-5 hud-corner", TONE_CLASS[readiness.tone])}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Dossier Readiness</p>
          <h2 className="mt-1 text-2xl font-black uppercase tracking-wider text-white">{readiness.label}</h2>
          <p className="mt-2 text-sm text-white/55">
            {readiness.requiredComplete}/{readiness.requiredTotal} required sections complete · {readiness.weakCount} weak · {readiness.missingCount} missing
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase tracking-wider opacity-70">Readiness Score</p>
          <p className="text-5xl font-black text-white">{readiness.score}</p>
        </div>
      </div>
      <div className="mt-4 h-3 overflow-hidden border border-white/10 bg-black/30">
        <div className="h-full bg-current" style={{ width: `${readiness.score}%` }} />
      </div>
    </section>
  );
}

export function DossierSectionGrid({
  cards,
  activeField,
  onSelect,
}: {
  cards: DossierSectionCard[];
  activeField: PitchFieldId;
  onSelect: (field: PitchFieldId) => void;
}) {
  return (
    <section className="space-y-3">
      <PanelHeader icon={<FileText className="h-4 w-4" />} title="Evidence Board" subtitle="Each card maps to one VC judgment area" />
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <button key={card.id} type="button" onClick={() => onSelect(card.id)} className="text-left">
            <article className={cn("h-full border p-3 transition-colors hud-corner", activeField === card.id ? "border-emerald-500/35 bg-emerald-500/[0.075] text-emerald-300" : TONE_CLASS[card.tone])}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider opacity-70">{card.group}</p>
                  <h3 className="mt-0.5 text-sm font-black uppercase tracking-wider text-white">{card.label}</h3>
                </div>
                <span className="border border-current/25 bg-black/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                  {card.status}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-white/52">{card.vcCares}</p>
              <div className="mt-3 flex items-center justify-between text-[9px] font-black uppercase tracking-wider opacity-70">
                <span>{card.length} chars</span>
                <span>{card.required ? `min ${card.minChars}` : "optional"}</span>
              </div>
            </article>
          </button>
        ))}
      </div>
    </section>
  );
}

export function PitchSectionEditor({
  config,
  value,
  hint,
  error,
  onChange,
}: {
  config: PitchSectionConfig;
  value: string;
  hint: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const inputClass = "w-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-cyan-400/50 focus:outline-none";
  return (
    <section className="border border-cyan-500/20 bg-cyan-500/[0.04] p-5 text-cyan-300 hud-corner">
      <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Active Section Editor</p>
      <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-white">{config.label}</h2>
          <p className="mt-1 text-xs leading-relaxed text-white/48">{config.vcCares}</p>
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider opacity-70">{value.trim().length} chars</span>
      </div>
      <div className="mt-4">
        {config.rows === 1 ? (
          <input id={config.id} name={config.id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={config.placeholder} className={inputClass} />
        ) : (
          <textarea id={config.id} name={config.id} rows={config.rows} value={value} onChange={(event) => onChange(event.target.value)} placeholder={config.placeholder} className={inputClass} />
        )}
      </div>
      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-white/48">
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />
        {hint}
      </p>
      {error && (
        <p className="mt-3 border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}
    </section>
  );
}

export function FundingAskConsole({ risk, ask, useOfFunds }: { risk: FundingAskRisk; ask: string; useOfFunds: string }) {
  return (
    <section className={cn("border p-5 hud-corner", TONE_CLASS[risk.tone])}>
      <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Funding Ask Console</p>
      <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-white">{risk.label}</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{risk.summary}</p>
      <div className="mt-4 grid gap-2">
        <MiniMetric label="Ask" value={ask || "Missing"} />
        <MiniMetric label="Use Of Funds" value={useOfFunds ? `${useOfFunds.trim().length} chars` : "Missing"} />
      </div>
    </section>
  );
}

export function SubmissionGatePanel({
  gate,
  review,
  canSubmit,
  canUseToken,
  submitPending,
  onSubmit,
  onSubmitWithToken,
}: {
  gate: SubmissionGatePresentation;
  review: ReviewLaunchPresentation;
  canSubmit: boolean;
  canUseToken: boolean;
  submitPending: boolean;
  onSubmit: () => void;
  onSubmitWithToken: () => void;
}) {
  return (
    <section className={cn("border p-5 hud-corner", TONE_CLASS[gate.tone])}>
      <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">VC Chamber Launch</p>
      <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-white">{gate.label}</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{gate.summary}</p>
      <div className="mt-4 grid gap-2">
        <MiniMetric label="Weekly Gate" value={gate.weeklyLine} />
        <MiniMetric label="Review Credits" value={gate.creditLine} />
        <MiniMetric label="Review Status" value={review.label} />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {canSubmit && (
          <button
            type="button"
            disabled={submitPending}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 border border-violet-500/35 bg-violet-500/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-violet-200 hover:bg-violet-500/25 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {submitPending ? "Submitting..." : "Send Dossier"}
          </button>
        )}
        {canUseToken && (
          <button
            type="button"
            disabled={submitPending}
            onClick={onSubmitWithToken}
            className="inline-flex items-center gap-2 border border-amber-500/35 bg-amber-500/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-200 hover:bg-amber-500/25 disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" />
            {submitPending ? "Submitting..." : "Use Token"}
          </button>
        )}
        <Link href={review.status === "not_ready" ? "#dossier-editor" : "../review"} className={cn("inline-flex items-center gap-2 border px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-white/10", TONE_CLASS[review.tone])}>
          {review.status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5" /> : review.status === "failed" || review.status === "blocked" ? <AlertTriangle className="h-3.5 w-3.5" /> : <Radio className="h-3.5 w-3.5" />}
          {review.ctaLabel}
        </Link>
      </div>
    </section>
  );
}

export function PitchValidationBanner({ title, messages }: { title: string; messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <section className="border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300 hud-corner">
      <p className="text-sm font-black uppercase tracking-wider text-white">{title}</p>
      <ul className="mt-2 space-y-1 text-sm text-rose-200/80">
        {messages.map((message) => <li key={message}>{message}</li>)}
      </ul>
    </section>
  );
}

export function SavedDossierBanner() {
  return (
    <section className="border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-300 hud-corner">
      Pitch deck saved successfully. The VC chamber can now evaluate the latest dossier.
    </section>
  );
}

export function ReviewStatusChip({ review }: { review: ReviewLaunchPresentation }) {
  return (
    <div className={cn("border px-3 py-2 hud-corner", TONE_CLASS[review.tone])}>
      <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider opacity-70">
        <Clock className="h-3 w-3" />
        {review.status}
      </p>
      <p className="mt-1 text-xs font-black uppercase tracking-wider text-white">{review.label}</p>
    </div>
  );
}

function PanelHeader({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-white">
          <span className="text-cyan-300">{icon}</span>
          {title}
        </h2>
        <p className="mt-1 text-xs text-white/38">{subtitle}</p>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/25 to-transparent md:max-w-xs" />
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/20 px-2 py-1.5">
      <p className="text-[8px] font-black uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-0.5 truncate text-[11px] font-black uppercase tracking-wider text-white">{value}</p>
    </div>
  );
}
