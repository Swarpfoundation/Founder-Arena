"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Radio, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";
import { formatDeltaValue, type StatDeltaItem } from "@/lib/gamefeel/ceremony";
import {
  getDemoDayCountdown,
  getRunPhase,
  getSprintNextActionHint,
  getSprintPressureLevel,
} from "@/lib/game-time/time-scale";

export interface RecapHighlight {
  label: string;
  text: string;
  tone?: "cyan" | "amber" | "rose" | "emerald" | "violet";
}

function AnimatedDelta({ item }: { item: StatDeltaItem }) {
  const reduced = useReducedMotion();
  const counted = useCountUp(Math.abs(item.delta), 800, !reduced);
  const value = reduced ? item.delta : item.delta < 0 ? -counted : counted;
  return <>{formatDeltaValue(value, item.format)}</>;
}

const HIGHLIGHT_TONE = {
  cyan: "border-cyan-500/20 bg-cyan-500/5 text-cyan-300",
  amber: "border-amber-500/20 bg-amber-500/5 text-amber-300",
  rose: "border-rose-500/20 bg-rose-500/5 text-rose-300",
  emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
  violet: "border-violet-500/20 bg-violet-500/5 text-violet-300",
};

export function StatDeltaRecap({
  title = "Sprint Recap",
  deltas,
  highlights = [],
  nextAction,
  phaseStep,
}: {
  title?: string;
  deltas: StatDeltaItem[];
  highlights?: RecapHighlight[];
  nextAction?: { label: string; href: string };
  phaseStep?: number | null;
}) {
  const reduced = useReducedMotion();
  const visibleDeltas = deltas.filter((d) => d.delta !== 0).slice(0, 8);
  const phase = phaseStep ? getRunPhase(phaseStep) : null;
  const pressure = phaseStep ? getSprintPressureLevel(phaseStep) : null;
  const phaseTone =
    pressure === "demo_day"
      ? "border-rose-500/25 bg-rose-500/10 text-rose-300"
      : pressure === "dangerous"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
        : pressure === "rising"
          ? "border-violet-500/25 bg-violet-500/10 text-violet-300"
          : "border-cyan-500/25 bg-cyan-500/10 text-cyan-300";

  return (
    <motion.section
      className="game-card p-5 hud-corner border-cyan-500/25"
      initial={reduced ? false : { opacity: 0, y: 24 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
          <Radio className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-400/60">After-Action Report</p>
          <h3 className="text-lg font-black text-white">{title}</h3>
        </div>
      </div>

      {phase && phaseStep && (
        <div className={cn("mb-4 border p-3", phaseTone)}>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[9px] font-black uppercase tracking-[0.28em] opacity-70">{phase.label}</p>
            <p className="text-[9px] font-black uppercase tracking-wider opacity-70">{getDemoDayCountdown(phaseStep)}</p>
          </div>
          <p className="text-xs leading-relaxed text-white/65">{getSprintNextActionHint(phaseStep)}</p>
        </div>
      )}

      {visibleDeltas.length > 0 ? (
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {visibleDeltas.map((item, index) => (
            <motion.div
              key={item.id}
              className={cn(
                "border bg-white/[0.03] p-3",
                item.direction === "flat"
                  ? "border-white/10"
                  : item.isGood
                    ? "border-emerald-500/25"
                    : "border-rose-500/25"
              )}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="truncate text-[9px] font-bold uppercase tracking-wider text-white/35">{item.label}</p>
                {item.direction === "up" ? (
                  <TrendingUp className={cn("h-3 w-3", item.isGood ? "text-emerald-400" : "text-rose-400")} />
                ) : item.direction === "down" ? (
                  <TrendingDown className={cn("h-3 w-3", item.isGood ? "text-emerald-400" : "text-rose-400")} />
                ) : (
                  <Zap className="h-3 w-3 text-white/20" />
                )}
              </div>
              <p className={cn("text-lg font-black tabular-nums", item.isGood ? "text-emerald-400" : item.direction === "flat" ? "text-white/35" : "text-rose-400")}>
                <AnimatedDelta item={item} />
              </p>
              <p className="mt-1 text-[9px] text-white/25">
                {formatDeltaValue(item.before, item.format)} → {formatDeltaValue(item.after, item.format).replace(/^\+/, "")}
              </p>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-sm text-white/40">No major stat movement recorded this sprint.</p>
      )}

      {highlights.length > 0 && (
        <div className="mb-4 grid gap-2 md:grid-cols-2">
          {highlights.map((h) => (
            <div key={`${h.label}-${h.text}`} className={cn("border p-3", HIGHLIGHT_TONE[h.tone ?? "cyan"])}>
              <p className="mb-1 text-[9px] font-black uppercase tracking-widest opacity-70">{h.label}</p>
              <p className="text-xs leading-relaxed text-white/70">{h.text}</p>
            </div>
          ))}
        </div>
      )}

      {nextAction && (
        <Link href={nextAction.href} className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-400 transition-colors hover:bg-cyan-500/20">
          {nextAction.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </motion.section>
  );
}
