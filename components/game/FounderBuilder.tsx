"use client";

import { Check, Crosshair, Radio, Rocket, ShieldAlert, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ArchetypePresentation,
  BuilderStep,
  BuilderTone,
  DeploymentPreview,
  MarketCardPresentation,
} from "@/lib/game/founder-builder";

const TONE_CLASS: Record<BuilderTone, string> = {
  cyan: "border-cyan-500/25 bg-cyan-500/[0.055] text-cyan-300",
  violet: "border-violet-500/25 bg-violet-500/[0.055] text-violet-300",
  rose: "border-rose-500/30 bg-rose-500/[0.06] text-rose-300",
  amber: "border-amber-500/25 bg-amber-500/[0.055] text-amber-300",
  emerald: "border-emerald-500/25 bg-emerald-500/[0.055] text-emerald-300",
  white: "border-white/10 bg-white/[0.035] text-white/55",
};

export function BuilderStepRail({
  steps,
  activeStep,
}: {
  steps: BuilderStep[];
  activeStep: BuilderStep["id"];
}) {
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === activeStep));
  return (
    <section className="border border-cyan-500/15 bg-black/45 p-3 hud-corner">
      <div className="grid gap-2 md:grid-cols-5">
        {steps.map((step, index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;
          return (
            <a
              key={step.id}
              href={`#${step.id}`}
              className={cn(
                "relative border p-3 transition-colors",
                active
                  ? "border-cyan-500/35 bg-cyan-500/10 text-cyan-200"
                  : complete
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                    : "border-white/10 bg-white/[0.025] text-white/40"
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.24em]">Step {index + 1}</span>
                {complete && <Check className="h-3.5 w-3.5" />}
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-white">{step.label}</p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed opacity-70">{step.description}</p>
            </a>
          );
        })}
      </div>
    </section>
  );
}

export function ArchetypeCard({
  archetype,
  selected,
  onSelect,
}: {
  archetype: ArchetypePresentation;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative min-h-[270px] overflow-hidden border p-4 text-left transition-all hud-corner",
        TONE_CLASS[archetype.tone],
        selected ? "ring-2 ring-cyan-300/35" : "hover:bg-white/[0.07]"
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-40" />
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-current/30 bg-black/25">
            <Crosshair className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.28em] opacity-65">Build Archetype</p>
            <h3 className="mt-1 text-base font-black uppercase tracking-wider text-white">{archetype.name}</h3>
            <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-white/50">{archetype.fantasy}</p>
          </div>
          {selected && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-cyan-400/40 bg-cyan-400/15 text-cyan-200">
              <Check className="h-4 w-4" />
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <MiniMetric label="Sector" value={archetype.sector} />
          <MiniMetric label="Region" value={archetype.region} />
          <MiniMetric label="Ask" value={`$${archetype.fundingAsk.toLocaleString()}`} />
          <MiniMetric label="Difficulty" value={archetype.difficulty} />
        </div>

        <div className="border border-emerald-500/15 bg-emerald-500/5 p-2">
          <p className="text-[9px] font-black uppercase tracking-wider text-emerald-300/70">Best For</p>
          <p className="mt-1 text-xs text-white/62">{archetype.bestFor}</p>
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5">
          {archetype.risks.map((risk) => (
            <StartupRiskBadge key={risk} label={risk} />
          ))}
        </div>
      </div>
    </button>
  );
}

export function MarketSelectCard({
  card,
  selected,
  onSelect,
}: {
  card: MarketCardPresentation;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "border p-3 text-left transition-all hud-corner",
        TONE_CLASS[card.tone],
        selected ? "ring-2 ring-cyan-300/30" : "hover:bg-white/[0.07]"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wider text-white">{card.label}</p>
        {selected && <Check className="h-4 w-4" />}
      </div>
      <p className="line-clamp-2 text-[11px] leading-relaxed text-white/55">{card.opportunity}</p>
      <p className="mt-2 text-[9px] font-black uppercase tracking-wider opacity-70">Risk: {card.risk}</p>
    </button>
  );
}

export function BuildPreviewPanel({ preview }: { preview: DeploymentPreview }) {
  return (
    <section className="sticky top-24 space-y-3 border border-cyan-500/20 bg-cyan-500/[0.055] p-4 text-cyan-300 hud-corner">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border border-current/30 bg-black/25">
          <Radio className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] opacity-70">Deployment Preview</p>
          <h2 className="text-lg font-black uppercase tracking-wider text-white">{preview.runSeed}</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniMetric label="Sector" value={preview.sector} />
        <MiniMetric label="Region" value={preview.region} />
        <MiniMetric label="Funding Ask" value={preview.fundingAskLabel} />
        <MiniMetric label="Readiness" value={preview.readinessLabel} />
      </div>

      <div className="border border-violet-500/20 bg-violet-500/10 p-3 text-violet-200">
        <p className="text-[9px] font-black uppercase tracking-wider opacity-70">First Objective</p>
        <p className="mt-1 text-sm font-black uppercase tracking-wider text-white">{preview.firstObjective}</p>
        <p className="mt-1 text-xs text-white/50">{preview.phase} phase opens the run.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {preview.riskTags.map((risk) => (
          <StartupRiskBadge key={risk} label={risk} />
        ))}
      </div>
    </section>
  );
}

export function DeploymentCTA({
  pending,
  onAbort,
}: {
  pending: boolean;
  onAbort: () => void;
}) {
  return (
    <section id="deploy" className="relative overflow-hidden border border-cyan-500/25 bg-cyan-500/[0.055] p-5 text-cyan-300 hud-corner">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center border border-current/30 bg-black/25">
          <Rocket className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Deployment Ceremony</p>
          <h2 className="text-xl font-black uppercase tracking-wider text-white">Deploy Into Arena</h2>
          <p className="mt-1 text-sm text-white/55">
            Create the run, unlock the Pitch Deck Console, and prepare for the investor chamber.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="relative inline-flex items-center gap-2 border border-cyan-400/35 bg-cyan-400/15 px-6 py-3 transition-all hover:bg-cyan-400/25 disabled:opacity-50">
          <Zap className="h-4 w-4" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">{pending ? "Deploying..." : "Deploy Into Arena"}</span>
        </button>
        <button type="button" onClick={onAbort} disabled={pending} className="relative inline-flex items-center gap-2 border border-white/10 bg-white/5 px-6 py-3 transition-all hover:bg-white/10 disabled:opacity-50">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Back To Command Deck</span>
        </button>
      </div>
    </section>
  );
}

export function StartupRiskBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300">
      <ShieldAlert className="h-3 w-3" />
      {label}
    </span>
  );
}

export function BuilderStatusStrip({
  runSeed,
  region,
  marketRisk,
  investorInterest,
}: {
  runSeed: string;
  region: string;
  marketRisk: string;
  investorInterest: string;
}) {
  const items = [
    { label: "Run Seed", value: runSeed, icon: Crosshair, tone: "cyan" as BuilderTone },
    { label: "Arena Conditions", value: region, icon: Radio, tone: "violet" as BuilderTone },
    { label: "Market Risk", value: marketRisk, icon: ShieldAlert, tone: "rose" as BuilderTone },
    { label: "Investor Interest", value: investorInterest, icon: Sparkles, tone: "amber" as BuilderTone },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={cn("border p-3 hud-corner", TONE_CLASS[item.tone])}>
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <p className="text-[9px] font-black uppercase tracking-wider opacity-70">{item.label}</p>
            </div>
            <p className="truncate text-xs font-black uppercase tracking-wider text-white">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/20 px-2 py-1.5">
      <p className="text-[8px] font-black uppercase tracking-wider text-white/30">{label}</p>
      <p className="truncate text-[11px] font-black uppercase tracking-wider text-white">{value}</p>
    </div>
  );
}
