"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Skull, Zap, ArrowRight, Film, Star } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCountUp } from "@/hooks/useCountUp";
import { triggerBreakout, triggerTermSheetAccepted } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import type { CeremonyAccent, CeremonyCta, CeremonyTone } from "@/lib/gamefeel/ceremony";

export interface CeremonyStat {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  accent?: CeremonyAccent;
}

const ACCENT: Record<CeremonyAccent, { border: string; bg: string; text: string; glow: string }> = {
  cyan: { border: "border-cyan-400/40", bg: "bg-cyan-500/10", text: "text-cyan-400", glow: "glow-cyan" },
  violet: { border: "border-violet-400/40", bg: "bg-violet-500/10", text: "text-violet-400", glow: "glow-violet" },
  rose: { border: "border-rose-400/40", bg: "bg-rose-500/10", text: "text-rose-400", glow: "glow-rose" },
  amber: { border: "border-amber-400/40", bg: "bg-amber-500/10", text: "text-amber-400", glow: "glow-gold" },
  emerald: { border: "border-emerald-400/40", bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "glow-emerald" },
  white: { border: "border-white/20", bg: "bg-white/5", text: "text-white/70", glow: "" },
};

const TONE_ICON: Record<CeremonyTone, React.ReactNode> = {
  success: <Trophy className="w-7 h-7" />,
  danger: <Skull className="w-7 h-7" />,
  warning: <Zap className="w-7 h-7" />,
  legendary: <Star className="w-7 h-7" />,
  neutral: <Film className="w-7 h-7" />,
};

function CeremonyNumber({ stat }: { stat: CeremonyStat }) {
  const reduced = useReducedMotion();
  const numeric = typeof stat.value === "number";
  const value = useCountUp(numeric ? stat.value as number : 0, 900, numeric && !reduced);
  const display = numeric ? value.toLocaleString() : stat.value;

  return (
    <span>
      {stat.prefix}{display}{stat.suffix}
    </span>
  );
}

export function GameCeremonyModal({
  title,
  subtitle,
  tone,
  accent = "cyan",
  stats,
  narrative,
  ctas,
  unlocks = [],
  ceremonyKey,
  enableCelebration = false,
}: {
  title: string;
  subtitle?: string;
  tone: CeremonyTone;
  accent?: CeremonyAccent;
  stats?: CeremonyStat[];
  narrative?: string;
  ctas?: CeremonyCta[];
  unlocks?: string[];
  ceremonyKey?: string;
  enableCelebration?: boolean;
}) {
  const reduced = useReducedMotion();
  const a = ACCENT[accent];

  useEffect(() => {
    if (!enableCelebration || reduced || !ceremonyKey) return;
    const key = `founder-arena-ceremony:${ceremonyKey}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "shown");
    if (tone === "legendary") triggerBreakout();
    else if (tone === "success") triggerTermSheetAccepted();
  }, [ceremonyKey, enableCelebration, reduced, tone]);

  return (
    <motion.section
      role="region"
      aria-label={title}
      className={cn(
        "relative overflow-hidden border-2 bg-black/70 p-5 md:p-8 hud-corner",
        a.border,
        tone === "danger" ? "shadow-[0_0_40px_rgba(244,63,94,0.18)]" : a.glow
      )}
      initial={reduced ? false : { opacity: 0, y: 24, scale: 0.98 }}
      animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent", a.text)} />
      {tone === "danger" && !reduced && (
        <motion.div
          className="absolute inset-0 border-2 border-rose-500/10 pointer-events-none"
          animate={{ opacity: [0.15, 0.45, 0.15] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <motion.div
              className={cn("flex h-14 w-14 items-center justify-center border", a.border, a.bg, a.text)}
              animate={!reduced && tone !== "neutral" ? { scale: [1, 1.06, 1] } : undefined}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              {TONE_ICON[tone]}
            </motion.div>
            <div>
              <p className={cn("mb-1 text-[10px] font-bold uppercase tracking-[0.35em]", a.text)}>
                Founder Arena Verdict
              </p>
              <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                {title}
              </h2>
              {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{subtitle}</p>}
            </div>
          </div>
        </div>

        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((stat, index) => {
              const statAccent = ACCENT[stat.accent ?? accent];
              return (
                <motion.div
                  key={stat.label}
                  className={cn("border bg-white/[0.03] p-3", statAccent.border)}
                  initial={reduced ? false : { opacity: 0, y: 12 }}
                  animate={reduced ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-white/35">{stat.label}</p>
                  <p className={cn("text-xl font-black tabular-nums", statAccent.text)}>
                    <CeremonyNumber stat={stat} />
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}

        {narrative && (
          <div className={cn("border p-4", a.border, a.bg)}>
            <p className="text-sm leading-relaxed text-white/75">{narrative}</p>
          </div>
        )}

        {unlocks.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/35">Unlocked</p>
            <div className="flex flex-wrap gap-2">
              {unlocks.map((unlock) => (
                <span key={unlock} className={cn("border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", a.border, a.bg, a.text)}>
                  {unlock}
                </span>
              ))}
            </div>
          </div>
        )}

        {ctas && ctas.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {ctas.map((cta, index) => {
              const c = ACCENT[cta.accent];
              return (
                <Link key={`${cta.href}-${cta.label}`} href={cta.href}>
                  <motion.div
                    className={cn("inline-flex items-center gap-2 border px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-colors hover:bg-white/10", c.border, c.bg, c.text)}
                    whileTap={reduced ? undefined : { scale: 0.97 }}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={reduced ? undefined : { opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.04 }}
                  >
                    {cta.label}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </motion.section>
  );
}

