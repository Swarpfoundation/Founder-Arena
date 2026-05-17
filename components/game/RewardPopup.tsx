"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Award, X, ArrowRight } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import type { CeremonyAccent } from "@/lib/gamefeel/ceremony";

const ACCENT: Record<CeremonyAccent, string> = {
  cyan: "border-cyan-400/30 bg-cyan-500/10 text-cyan-400",
  violet: "border-violet-400/30 bg-violet-500/10 text-violet-400",
  rose: "border-rose-400/30 bg-rose-500/10 text-rose-400",
  amber: "border-amber-400/30 bg-amber-500/10 text-amber-400",
  emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-400",
  white: "border-white/15 bg-white/5 text-white/60",
};

export function RewardPopup({
  title,
  description,
  accent = "cyan",
  ctaLabel,
  ctaHref,
  blocking = false,
  dismissible = true,
  className,
}: {
  type?: string;
  title: string;
  description?: string;
  accent?: CeremonyAccent;
  ctaLabel?: string;
  ctaHref?: string;
  blocking?: boolean;
  dismissible?: boolean;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const reduced = useReducedMotion();
  if (dismissed) return null;

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden border p-4 hud-corner",
        ACCENT[accent],
        blocking ? "shadow-[0_0_30px_rgba(34,211,238,0.14)]" : "",
        className
      )}
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-current/30 bg-black/20">
          <Award className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] opacity-70">Reward Signal</p>
          <h3 className="mt-0.5 text-sm font-black uppercase tracking-wider text-white">{title}</h3>
          {description && <p className="mt-1 text-xs leading-relaxed text-white/55">{description}</p>}
          {ctaLabel && ctaHref && (
            <Link href={ctaHref} className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-current hover:text-white">
              {ctaLabel}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-white/25 transition-colors hover:text-white/60"
            aria-label="Dismiss reward"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

