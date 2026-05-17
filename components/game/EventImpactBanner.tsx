"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle, Flame, Radio, Skull, Swords, Trophy, Zap } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import type { CriticalEventPresentation, CriticalEventTone } from "@/lib/gamefeel/critical-events";
import type { CeremonyAccent } from "@/lib/gamefeel/ceremony";

const ACCENT: Record<CeremonyAccent, string> = {
  cyan: "border-cyan-400/25 bg-cyan-500/8 text-cyan-400",
  violet: "border-violet-400/25 bg-violet-500/8 text-violet-400",
  rose: "border-rose-400/30 bg-rose-500/10 text-rose-400",
  amber: "border-amber-400/30 bg-amber-500/10 text-amber-400",
  emerald: "border-emerald-400/25 bg-emerald-500/8 text-emerald-400",
  white: "border-white/10 bg-white/5 text-white/50",
};

const ICON: Record<CriticalEventTone, React.ReactNode> = {
  danger: <AlertTriangle className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  viral: <Flame className="h-4 w-4" />,
  rival: <Swords className="h-4 w-4" />,
  boardroom: <Radio className="h-4 w-4" />,
  acquisition: <Trophy className="h-4 w-4" />,
  breakout: <Trophy className="h-4 w-4" />,
  death: <Skull className="h-4 w-4" />,
  strategy: <Zap className="h-4 w-4" />,
  leaderboard: <Trophy className="h-4 w-4" />,
  neutral: <Zap className="h-4 w-4" />,
};

export function EventImpactBanner({
  event,
  className,
}: {
  event: CriticalEventPresentation;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={cn("relative overflow-hidden border p-3 hud-corner", ACCENT[event.accent], className)}
      initial={reduced ? false : { opacity: 0, x: -14 }}
      animate={reduced ? undefined : { opacity: 1, x: 0 }}
      transition={{ duration: 0.24 }}
    >
      {event.severity === "critical" && !reduced && (
        <motion.div
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-current"
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
      )}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-current/30 bg-black/20">
          {ICON[event.type]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[9px] font-black uppercase tracking-[0.28em] opacity-70">{event.eyebrow}</p>
            <span className="text-[9px] font-black uppercase tracking-wider opacity-50">{event.severity}</span>
          </div>
          <p className="mt-0.5 text-sm font-black uppercase tracking-wider text-white">{event.title}</p>
          {event.subtitle && <p className="mt-1 text-xs leading-relaxed text-white/55">{event.subtitle}</p>}
          {event.primaryCta && (
            <Link href={event.primaryCta.href} className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-current hover:text-white">
              {event.primaryCta.label}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
