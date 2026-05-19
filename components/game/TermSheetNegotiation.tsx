"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Lock, Scale, ShieldAlert, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ClauseRiskCardPresentation,
  DealStatusPresentation,
  DealTone,
  FounderControlRisk,
  NegotiationCta,
  TermSheetSceneInput,
} from "@/lib/game/term-sheet-scene";
import { formatDealAmount, formatEquityPercent, formatValuation, getRunwayInjectionCopy } from "@/lib/game/term-sheet-scene";

const TONE_CLASS: Record<DealTone, string> = {
  cyan: "border-cyan-500/25 bg-cyan-500/[0.055] text-cyan-300",
  violet: "border-violet-500/25 bg-violet-500/[0.055] text-violet-300",
  rose: "border-rose-500/30 bg-rose-500/[0.06] text-rose-300",
  amber: "border-amber-500/25 bg-amber-500/[0.055] text-amber-300",
  emerald: "border-emerald-500/25 bg-emerald-500/[0.055] text-emerald-300",
  white: "border-white/10 bg-white/[0.035] text-white/55",
};

const RISK_CLASS = {
  low: "border-emerald-500/20 bg-emerald-500/[0.055] text-emerald-300",
  normal: "border-cyan-500/20 bg-cyan-500/[0.055] text-cyan-300",
  high: "border-amber-500/25 bg-amber-500/[0.06] text-amber-300",
  severe: "border-rose-500/30 bg-rose-500/[0.07] text-rose-300",
};

export function DealStamp({
  presentation,
  amount,
  equity,
}: {
  presentation: DealStatusPresentation;
  amount?: number | null;
  equity?: TermSheetSceneInput["proposedEquity"];
}) {
  return (
    <section className={cn("relative overflow-hidden border-2 p-5 hud-corner", TONE_CLASS[presentation.tone])}>
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute inset-x-0 top-1/2 h-px bg-current" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-current" />
      </div>
      <div className="relative z-10 grid gap-5 md:grid-cols-[minmax(0,1fr)_240px] md:items-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] opacity-70">{presentation.eyebrow}</p>
          <p className="mt-2 -rotate-1 border-4 border-current/50 px-4 py-3 text-center text-3xl font-black uppercase tracking-[0.18em] text-white md:inline-block md:text-5xl">
            {presentation.label}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60">{presentation.summary}</p>
        </div>
        <div className="grid gap-2">
          <DealMetric label="Capital" value={typeof amount === "number" ? formatDealAmount(amount) : "--"} />
          <DealMetric label="Equity Sold" value={equity !== undefined && equity !== null ? formatEquityPercent(equity) : "--"} />
        </div>
      </div>
    </section>
  );
}

export function DealBoard({ termSheet }: { termSheet: TermSheetSceneInput }) {
  const rows = [
    { label: "Investment Amount", value: formatDealAmount(termSheet.proposedAmount ?? 0), accent: "emerald" as DealTone },
    { label: "Equity Requested", value: formatEquityPercent(termSheet.proposedEquity), accent: "amber" as DealTone },
    { label: "Pre-Money Valuation", value: formatValuation(termSheet.preMoneyValuation ?? 0), accent: "cyan" as DealTone },
    { label: "Post-Money Valuation", value: formatValuation(termSheet.postMoneyValuation ?? 0), accent: "violet" as DealTone },
    { label: "Liquidation Preference", value: `${termSheet.liquidationPreference ?? 1}x`, accent: "rose" as DealTone },
    { label: "Pro-Rata Rights", value: termSheet.proRataRights ? "Yes" : "No", accent: "white" as DealTone },
    { label: "Board Seat", value: termSheet.boardSeat ? "Yes" : "No", accent: termSheet.boardSeat ? "rose" as DealTone : "white" as DealTone },
    { label: "Board Observer", value: termSheet.boardObserver ? "Yes" : "No", accent: termSheet.boardObserver ? "amber" as DealTone : "white" as DealTone },
  ];
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-amber-300" />
        <h2 className="text-sm font-black uppercase tracking-[0.24em] text-white">Deal Board</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent" />
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label} className={cn("border p-3 hud-corner", TONE_CLASS[row.accent])}>
            <p className="text-[9px] font-black uppercase tracking-wider opacity-70">{row.label}</p>
            <p className="mt-1 truncate text-lg font-black text-white">{row.value}</p>
          </div>
        ))}
      </div>
      {(termSheet.milestoneRequirements || termSheet.investorNotes || termSheet.founderSalaryCap) && (
        <div className="grid gap-3 md:grid-cols-3">
          {termSheet.founderSalaryCap && (
            <DealNote label="Founder Salary Cap" value={`${formatDealAmount(termSheet.founderSalaryCap)}/year`} />
          )}
          {termSheet.milestoneRequirements && <DealNote label="Milestone Requirements" value={termSheet.milestoneRequirements} />}
          {termSheet.investorNotes && <DealNote label="Investor Notes" value={termSheet.investorNotes} />}
        </div>
      )}
    </section>
  );
}

export function FounderControlMeter({ risk }: { risk: FounderControlRisk }) {
  return (
    <section className={cn("border p-5 hud-corner", RISK_CLASS[risk.risk])}>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Founder Control</p>
          <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-white">{risk.label}</h2>
          <p className="mt-1 text-sm text-white/55">{risk.investorInfluence}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase tracking-wider opacity-65">Founder Ownership After Round</p>
          <p className="text-4xl font-black text-white">{risk.founderOwnershipAfter.toFixed(1).replace(/\.0$/, "")}%</p>
        </div>
      </div>
      <div className="h-4 overflow-hidden border border-white/10 bg-black/35">
        <div className="h-full bg-current" style={{ width: `${Math.min(100, risk.founderOwnershipAfter)}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-white/35">
        <span>Founder</span>
        <span>{risk.equitySold.toFixed(1).replace(/\.0$/, "")}% sold</span>
        <span>Investor</span>
      </div>
      {risk.warnings.length > 0 && (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {risk.warnings.map((warning) => (
            <div key={warning} className="flex items-start gap-2 border border-current/20 bg-black/20 p-2 text-xs leading-relaxed text-white/62">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-current" />
              {warning}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function ClauseRiskGrid({ clauses }: { clauses: ClauseRiskCardPresentation[] }) {
  if (clauses.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-rose-300" />
        <h2 className="text-sm font-black uppercase tracking-[0.24em] text-white">Investor Clauses</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-rose-500/30 to-transparent" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {clauses.map((clause) => (
          <article key={clause.id} className={cn("border p-4 hud-corner", RISK_CLASS[clause.risk])}>
            <p className="text-[9px] font-black uppercase tracking-wider opacity-70">{clause.risk} risk</p>
            <h3 className="mt-1 text-sm font-black uppercase tracking-wider text-white">{clause.label}</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/55">{clause.summary}</p>
            <p className="mt-3 border border-current/20 bg-black/20 p-2 text-[11px] leading-relaxed text-white/58">{clause.gameMeaning}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function RunwayInjectionPanel({ termSheet }: { termSheet: TermSheetSceneInput }) {
  const copy = getRunwayInjectionCopy(termSheet);
  return (
    <section className="border border-emerald-500/20 bg-emerald-500/[0.055] p-5 text-emerald-300 hud-corner">
      <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
        <div className="border border-current/25 bg-black/25 p-4 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.28em] opacity-70">{copy.title}</p>
          <p className="mt-1 text-4xl font-black text-white">{copy.amount}</p>
        </div>
        <div>
          <p className="text-sm leading-relaxed text-white/58">{copy.warning}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {copy.unlocks.map((unlock) => (
              <span key={unlock} className="inline-flex items-center gap-1.5 border border-current/20 bg-black/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                <Unlock className="h-3 w-3" />
                {unlock}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function NegotiationConsole({
  status,
  ctas,
  actionPending,
  showCounter,
  onAccept,
  onReject,
  onToggleCounter,
}: {
  status: DealStatusPresentation["status"];
  ctas: NegotiationCta[];
  actionPending: boolean;
  showCounter: boolean;
  onAccept: () => void;
  onReject: () => void;
  onToggleCounter: () => void;
}) {
  const isLive = status === "live";
  return (
    <section className="border border-cyan-500/20 bg-cyan-500/[0.045] p-5 text-cyan-300 hud-corner">
      <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Negotiation Console</p>
      {isLive ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={onAccept} disabled={actionPending} className="inline-flex items-center gap-2 border border-emerald-500/35 bg-emerald-500/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50">
            <Check className="h-4 w-4" />
            {actionPending ? "Processing..." : "Accept Capital"}
          </button>
          <button type="button" onClick={onToggleCounter} disabled={actionPending} className="inline-flex items-center gap-2 border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-300 hover:bg-amber-500/20 disabled:opacity-50">
            <Scale className="h-4 w-4" />
            {showCounter ? "Close Counter Console" : "Counter Offer"}
          </button>
          <button type="button" onClick={onReject} disabled={actionPending} className="inline-flex items-center gap-2 border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-rose-300 hover:bg-rose-500/20 disabled:opacity-50">
            <Lock className="h-4 w-4" />
            Decline Deal
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          {ctas.map((cta) => (
            <Link key={`${cta.label}-${cta.href}`} href={cta.href} className={cn("inline-flex items-center gap-2 border px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-white/10", TONE_CLASS[cta.tone])}>
              {cta.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function TermSheetStatusScene({
  presentation,
  ctas,
}: {
  presentation: DealStatusPresentation;
  ctas: NegotiationCta[];
}) {
  return (
    <section className={cn("border p-5 hud-corner", TONE_CLASS[presentation.tone])}>
      <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">{presentation.eyebrow}</p>
      <h2 className="mt-1 text-2xl font-black uppercase tracking-wider text-white">{presentation.label}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/58">{presentation.summary}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {ctas.map((cta) => (
          <Link key={`${cta.label}-${cta.href}`} href={cta.href} className={cn("inline-flex items-center gap-2 border px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-white/10", TONE_CLASS[cta.tone])}>
            {cta.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function DealMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-current/25 bg-black/25 p-3">
      <p className="text-[9px] font-black uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function DealNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.025] p-3">
      <p className="text-[9px] font-black uppercase tracking-wider text-white/35">{label}</p>
      <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-white/58">{value}</p>
    </div>
  );
}
