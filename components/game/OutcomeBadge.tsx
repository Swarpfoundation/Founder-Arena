"use client";

import { cn } from "@/lib/utils";
import { getOutcomeIcon } from "@/lib/assets";

const outcomeMap: Record<string, { label: string; classes: string }> = {
  breakout: { label: "BREAKOUT", classes: "border-emerald-400/30 text-emerald-400 bg-emerald-400/10" },
  strong: { label: "STRONG EXIT", classes: "border-cyan-400/30 text-cyan-400 bg-cyan-400/10" },
  moderate: { label: "MODERATE EXIT", classes: "border-cyan-400/30 text-cyan-400 bg-cyan-400/10" },
  acquisition: { label: "ACQUIRED", classes: "border-violet-400/30 text-violet-400 bg-violet-400/10" },
  ipo: { label: "IPO", classes: "border-amber-400/30 text-amber-400 bg-amber-400/10" },
  survival: { label: "SURVIVED", classes: "border-white/10 text-white/40 bg-white/5" },
  zombie: { label: "ZOMBIE", classes: "border-white/10 text-white/40 bg-white/5" },
  shutdown: { label: "SHUTDOWN", classes: "border-rose-400/30 text-rose-400 bg-rose-400/10" },
  bankrupt: { label: "BANKRUPT", classes: "border-rose-400/30 text-rose-400 bg-rose-400/10" },
  dead: { label: "DEAD", classes: "border-rose-400/30 text-rose-400 bg-rose-400/10" },
};

export function OutcomeBadge({ outcome, className }: { outcome: string; className?: string }) {
  const key = outcome.toLowerCase();
  const o = outcomeMap[key] ?? {
    label: outcome.toUpperCase(),
    classes: "border-white/10 text-white/40 bg-white/5",
  };

  const Icon = getOutcomeIcon(key);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border px-3 py-1 text-xs font-bold tracking-wider",
        o.classes,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" size={14} />
      {o.label}
    </span>
  );
}
