"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Flame,
  Radio,
  ShieldAlert,
  Skull,
  Sparkles,
  Swords,
  Trophy,
  Zap,
  X,
} from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import type { CriticalEventPresentation, CriticalEventTone } from "@/lib/gamefeel/critical-events";
import type { CeremonyAccent } from "@/lib/gamefeel/ceremony";

const ACCENT: Record<CeremonyAccent, { border: string; bg: string; text: string; glow: string }> = {
  cyan: { border: "border-cyan-400/35", bg: "bg-cyan-500/10", text: "text-cyan-400", glow: "shadow-[0_0_32px_rgba(34,211,238,0.12)]" },
  violet: { border: "border-violet-400/35", bg: "bg-violet-500/10", text: "text-violet-400", glow: "shadow-[0_0_32px_rgba(139,92,246,0.12)]" },
  rose: { border: "border-rose-400/40", bg: "bg-rose-500/10", text: "text-rose-400", glow: "shadow-[0_0_36px_rgba(244,63,94,0.16)]" },
  amber: { border: "border-amber-400/40", bg: "bg-amber-500/10", text: "text-amber-400", glow: "shadow-[0_0_36px_rgba(251,191,36,0.12)]" },
  emerald: { border: "border-emerald-400/35", bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "shadow-[0_0_32px_rgba(52,211,153,0.12)]" },
  white: { border: "border-white/15", bg: "bg-white/5", text: "text-white/60", glow: "" },
};

const TYPE_ICON: Record<CriticalEventTone, ReactNode> = {
  danger: <AlertTriangle className="h-6 w-6" />,
  warning: <ShieldAlert className="h-6 w-6" />,
  viral: <Flame className="h-6 w-6" />,
  rival: <Swords className="h-6 w-6" />,
  boardroom: <Radio className="h-6 w-6" />,
  acquisition: <BadgeDollarSign className="h-6 w-6" />,
  breakout: <Trophy className="h-6 w-6" />,
  death: <Skull className="h-6 w-6" />,
  strategy: <Zap className="h-6 w-6" />,
  leaderboard: <Trophy className="h-6 w-6" />,
  neutral: <Sparkles className="h-6 w-6" />,
};

export function EventRevealPanel({
  event,
  children,
  className,
  dismissible = false,
  sessionGuard = false,
}: {
  event: CriticalEventPresentation;
  children?: ReactNode;
  className?: string;
  dismissible?: boolean;
  sessionGuard?: boolean;
}) {
  const reduced = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);
  const accent = ACCENT[event.accent];

  useEffect(() => {
    if (!sessionGuard || !event.displayKey) return;
    const key = `founder-arena-critical:${event.displayKey}`;
    if (window.sessionStorage.getItem(key)) {
      setDismissed(true);
      return;
    }
    window.sessionStorage.setItem(key, "shown");
  }, [event.displayKey, sessionGuard]);

  if (dismissed) return null;

  return (
    <motion.section
      role="region"
      aria-label={event.title}
      className={cn(
        "relative overflow-hidden border-2 bg-black/75 p-5 hud-corner",
        accent.border,
        accent.glow,
        className
      )}
      initial={reduced ? false : { opacity: 0, y: 22, scale: 0.985 }}
      animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.36, ease: "easeOut" }}
    >
      <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent", accent.text)} />
      {(event.severity === "critical" || event.type === "death") && !reduced && (
        <motion.div
          className={cn("pointer-events-none absolute inset-0 border", accent.border)}
          animate={{ opacity: [0.08, 0.32, 0.08] }}
          transition={{ duration: 1.25, repeat: Infinity }}
        />
      )}
      <div className="relative z-10 space-y-4">
        <div className="flex items-start gap-4">
          <motion.div
            className={cn("flex h-12 w-12 shrink-0 items-center justify-center border", accent.border, accent.bg, accent.text)}
            animate={!reduced && event.severity !== "low" ? { scale: [1, 1.06, 1] } : undefined}
            transition={{ duration: 1.7, repeat: Infinity }}
          >
            {TYPE_ICON[event.type]}
          </motion.div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className={cn("text-[10px] font-black uppercase tracking-[0.32em]", accent.text)}>
                {event.eyebrow}
              </p>
              <span className={cn("border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider", accent.border, accent.bg, accent.text)}>
                {event.severity}
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white md:text-3xl">{event.title}</h2>
            {event.subtitle && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/58">{event.subtitle}</p>}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-white/25 transition-colors hover:text-white/60"
              aria-label="Dismiss event"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {event.affectedStats && event.affectedStats.length > 0 && (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {event.affectedStats.map((stat) => {
              const statAccent = ACCENT[stat.accent ?? event.accent];
              return (
                <div key={stat.label} className={cn("border bg-white/[0.03] p-3", statAccent.border)}>
                  <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-white/35">{stat.label}</p>
                  <p className={cn("text-sm font-black tabular-nums", statAccent.text)}>{stat.value}</p>
                  {stat.delta !== undefined && <p className="mt-1 text-[9px] text-white/35">{stat.delta}</p>}
                </div>
              );
            })}
          </div>
        )}

        {children}

        {(event.primaryCta || event.secondaryCta) && (
          <div className="flex flex-wrap gap-3">
            {event.primaryCta && (
              <Link href={event.primaryCta.href} className={cn("inline-flex items-center gap-2 border px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors hover:bg-white/10", accent.border, accent.bg, accent.text)}>
                {event.primaryCta.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
            {event.secondaryCta && (
              <Link href={event.secondaryCta.href} className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-white/50 transition-colors hover:bg-white/10 hover:text-white/75">
                {event.secondaryCta.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
}
