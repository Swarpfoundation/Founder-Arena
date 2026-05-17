"use client";

import { motion } from "framer-motion";
import { CalendarDays, Flag, Gauge, Trophy } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import {
  getDemoDayCountdown,
  getRunPhase,
  getRunPhaseProgress,
  getRunStepLabel,
  getSprintMilestoneLabel,
  getSprintNextActionHint,
  getSprintPressureLevel,
  type SprintPressureLevel,
} from "@/lib/game-time/time-scale";

const PRESSURE_STYLE: Record<SprintPressureLevel, {
  label: string;
  border: string;
  text: string;
  bg: string;
  bar: string;
}> = {
  early: {
    label: "Early Signal",
    border: "border-cyan-500/25",
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    bar: "bg-cyan-400",
  },
  rising: {
    label: "Pressure Rising",
    border: "border-violet-500/25",
    text: "text-violet-400",
    bg: "bg-violet-500/10",
    bar: "bg-violet-400",
  },
  dangerous: {
    label: "Dangerous",
    border: "border-amber-500/30",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    bar: "bg-amber-400",
  },
  demo_day: {
    label: "Demo Day Runway",
    border: "border-rose-500/30",
    text: "text-rose-400",
    bg: "bg-rose-500/10",
    bar: "bg-rose-400",
  },
};

export function SprintPhaseBanner({
  step,
  status,
  hasTeam,
  compact = false,
  className,
}: {
  step: number;
  status?: string | null;
  hasTeam?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const phase = getRunPhase(step);
  const progress = getRunPhaseProgress(step);
  const pressure = getSprintPressureLevel(step);
  const pressureStyle = PRESSURE_STYLE[pressure];
  const milestone = getSprintMilestoneLabel(step);
  const countdown = getDemoDayCountdown(step);
  const hint = getSprintNextActionHint(step, { status, hasTeam });
  const isFinal = status === "completed" || status === "dead";

  return (
    <motion.section
      className={cn(
        "relative overflow-hidden border bg-black/55 p-4 hud-corner",
        pressureStyle.border,
        className
      )}
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      aria-label="Sprint phase"
    >
      {!reduced && (
        <motion.div
          className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white/5 to-transparent"
          animate={{ opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 2.8, repeat: Infinity }}
        />
      )}
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-1.5 border px-2 py-1 text-[9px] font-black uppercase tracking-[0.28em]", pressureStyle.border, pressureStyle.bg, pressureStyle.text)}>
              <CalendarDays className="h-3 w-3" />
              {getRunStepLabel(step)} / 12
            </span>
            <span className={cn("border px-2 py-1 text-[9px] font-black uppercase tracking-wider", pressureStyle.border, pressureStyle.text)}>
              Pressure: {pressureStyle.label}
            </span>
            {isFinal && (
              <span className="border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                Finalized
              </span>
            )}
          </div>
          <h2 className={cn("font-black uppercase tracking-[0.16em] text-white", compact ? "text-sm" : "text-xl")}>
            {phase.label}
          </h2>
          {!compact && <p className="mt-1 text-sm leading-relaxed text-white/55">{phase.tagline}</p>}
        </div>

        <div className="grid gap-2 sm:grid-cols-3 md:min-w-[360px]">
          <div className="border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-white/30">
              <Gauge className="h-3 w-3" />
              Phase
            </p>
            <p className="text-sm font-black text-white">{progress.stepWithinPhase}/{progress.phaseTotalSteps}</p>
            <div className="mt-2 h-1.5 bg-white/10">
              <div className={cn("h-full", pressureStyle.bar)} style={{ width: `${progress.percentComplete}%` }} />
            </div>
          </div>
          <div className="border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-white/30">
              <Trophy className="h-3 w-3" />
              Demo Day
            </p>
            <p className={cn("text-xs font-black uppercase tracking-wider", pressureStyle.text)}>{countdown}</p>
          </div>
          <div className="border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-white/30">
              <Flag className="h-3 w-3" />
              Milestone
            </p>
            <p className="text-xs font-black uppercase tracking-wider text-white">{milestone ?? "One more sprint"}</p>
          </div>
        </div>
      </div>

      {!compact && (
        <div className={cn("relative z-10 mt-4 border p-3 text-xs leading-relaxed", pressureStyle.border, pressureStyle.bg)}>
          <span className={cn("font-black uppercase tracking-wider", pressureStyle.text)}>Next signal: </span>
          <span className="text-white/65">{hint}</span>
        </div>
      )}
    </motion.section>
  );
}
