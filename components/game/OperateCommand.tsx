"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, Clock, Lock, Radio, Target, Zap } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import type {
  ActionCardPresentation,
  EndSprintConsolePresentation,
  OperateAccent,
  ResolutionStage,
  ThreatRadarItem,
} from "@/lib/game/operate-turn";

const ACCENT_CLASS: Record<OperateAccent, string> = {
  cyan: "border-cyan-500/25 bg-cyan-500/[0.055] text-cyan-300",
  violet: "border-violet-500/25 bg-violet-500/[0.055] text-violet-300",
  rose: "border-rose-500/30 bg-rose-500/[0.06] text-rose-300",
  amber: "border-amber-500/25 bg-amber-500/[0.055] text-amber-300",
  emerald: "border-emerald-500/25 bg-emerald-500/[0.055] text-emerald-300",
  white: "border-white/10 bg-white/[0.035] text-white/55",
};

const THREAT_CLASS = {
  critical: "border-rose-500/30 bg-rose-500/[0.06] text-rose-300",
  warning: "border-amber-500/25 bg-amber-500/[0.055] text-amber-300",
  opportunity: "border-emerald-500/25 bg-emerald-500/[0.055] text-emerald-300",
  info: "border-cyan-500/25 bg-cyan-500/[0.055] text-cyan-300",
};

export function ActionDeck({
  cards,
  onToggle,
}: {
  cards: ActionCardPresentation[];
  onToggle: (id: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-cyan-300" />
        <h2 className="text-sm font-black uppercase tracking-[0.24em] text-white">Action Deck</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/30 to-transparent" />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {cards.map((card, index) => (
          <ChoiceCard key={card.id} card={card} index={index} onToggle={onToggle} />
        ))}
      </div>
    </section>
  );
}

function ChoiceCard({
  card,
  index,
  onToggle,
}: {
  card: ActionCardPresentation;
  index: number;
  onToggle: (id: string) => void;
}) {
  const reduced = useReducedMotion();
  const locked = Boolean(card.lockedReason);
  return (
    <motion.button
      type="button"
      disabled={locked}
      onClick={() => onToggle(card.id)}
      className={cn(
        "relative min-h-[176px] overflow-hidden border p-4 text-left transition-all hud-corner",
        ACCENT_CLASS[card.accent],
        card.selected && "ring-2 ring-cyan-300/35",
        locked ? "cursor-not-allowed opacity-45" : "hover:bg-white/[0.07]"
      )}
      initial={reduced ? false : { opacity: 0, y: 18 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035 }}
      whileTap={!locked && !reduced ? { scale: 0.985 } : undefined}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-40" />
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-current/30 bg-black/25">
            {locked ? <Lock className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.28em] opacity-65">Sprint Choice</p>
            <h3 className="mt-1 text-base font-black uppercase tracking-wider text-white">{card.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-white/50">{card.description}</p>
          </div>
          {card.selected && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-cyan-400/40 bg-cyan-400/15 text-cyan-200">
              <Check className="h-4 w-4" />
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <StatPill label="Cost" value={card.costLabel} />
          <StatPill label="Burn" value={card.burnLabel} />
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="border border-emerald-500/15 bg-emerald-500/5 p-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-emerald-300/70">Upside</p>
            <p className="mt-1 text-xs text-white/62">{card.upside}</p>
          </div>
          <div className="border border-amber-500/15 bg-amber-500/5 p-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-amber-300/70">Tradeoff</p>
            <p className="mt-1 text-xs text-white/62">{card.tradeoff}</p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5">
          {card.tags.map((tag) => (
            <span key={tag} className="border border-current/20 bg-black/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider opacity-80">
              {tag}
            </span>
          ))}
          {card.effectPreview.slice(0, 4).map((effect) => (
            <span key={effect} className="border border-white/10 bg-white/[0.035] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/45">
              {effect}
            </span>
          ))}
        </div>

        {locked && (
          <div className="border border-white/10 bg-black/30 p-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
            Locked: {card.lockedReason}
          </div>
        )}
      </div>
    </motion.button>
  );
}

export function ThreatRadar({ items }: { items: ThreatRadarItem[] }) {
  if (items.length === 0) {
    return (
      <section className="border border-emerald-500/20 bg-emerald-500/[0.045] p-4 text-emerald-300 hud-corner">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Threat Radar</p>
        <p className="mt-1 text-sm text-white/55">No urgent threats detected. This is the window to create momentum.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-rose-300" />
        <h2 className="text-sm font-black uppercase tracking-[0.24em] text-white">Threat Radar</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-rose-500/30 to-transparent" />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className={cn("border p-3 hud-corner", THREAT_CLASS[item.severity])}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-wider">{item.label}</p>
              <span className="text-[9px] font-black uppercase tracking-wider opacity-65">{item.severity}</span>
            </div>
            <p className="text-xs leading-relaxed text-white/58">{item.description}</p>
            {item.href && (
              <a href={item.href} className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-current hover:text-white">
                Open Console
                <ArrowRight className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function EndSprintConsole({
  presentation,
  onRun,
}: {
  presentation: EndSprintConsolePresentation;
  onRun: () => void;
}) {
  return (
    <section className="relative overflow-hidden border border-cyan-500/25 bg-cyan-500/[0.055] p-4 hud-corner">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-300/65">Command Console</p>
          <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-white">End Sprint</h2>
          <p className="mt-1 text-sm leading-relaxed text-white/55">{presentation.statusLine}</p>
          {presentation.warning && (
            <p className="mt-2 inline-flex items-center gap-2 border border-rose-500/25 bg-rose-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              {presentation.warning}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {presentation.resolves.map((item) => (
              <span key={item} className="border border-white/10 bg-white/[0.035] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/40">
                resolves {item}
              </span>
            ))}
          </div>
        </div>
        <motion.button
          type="button"
          onClick={onRun}
          disabled={!presentation.canRun}
          className={cn(
            "flex h-16 items-center justify-center gap-3 border text-sm font-black uppercase tracking-[0.22em] transition-all",
            presentation.canRun
              ? "border-cyan-400/45 bg-cyan-400/15 text-cyan-200 glow-cyan hover:bg-cyan-400/25"
              : "cursor-not-allowed border-white/10 bg-white/[0.035] text-white/30"
          )}
          whileHover={presentation.canRun ? { y: -2 } : undefined}
          whileTap={presentation.canRun ? { scale: 0.98 } : undefined}
        >
          <Clock className="h-5 w-5" />
          {presentation.label}
        </motion.button>
      </div>
    </section>
  );
}

export function SprintResolutionSequence({ stages }: { stages: ResolutionStage[] }) {
  const reduced = useReducedMotion();
  return (
    <section className="border border-violet-500/20 bg-violet-500/[0.045] p-4 hud-corner">
      <p className="text-[10px] font-black uppercase tracking-[0.32em] text-violet-300/65">Sprint Debrief Sequence</p>
      <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.id}
            className={cn("border p-3", ACCENT_CLASS[stage.tone])}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <p className="text-[9px] font-black uppercase tracking-wider opacity-65">Stage {index + 1}</p>
            <p className="mt-1 text-sm font-black uppercase tracking-wider text-white">{stage.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/55">{stage.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/20 px-2 py-1.5">
      <p className="text-[8px] font-black uppercase tracking-wider text-white/30">{label}</p>
      <p className="text-[11px] font-black uppercase tracking-wider text-white">{value}</p>
    </div>
  );
}
