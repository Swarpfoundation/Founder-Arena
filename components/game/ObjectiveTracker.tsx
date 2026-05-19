import Link from "next/link";
import { ArrowRight, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GameObjective } from "@/lib/game/objectives";

const SEVERITY_CLASS: Record<GameObjective["severity"], string> = {
  neutral: "border-white/10 bg-white/[0.03] text-white/55",
  focus: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  critical: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
};

export function ObjectiveTracker({
  objective,
  compact = false,
  className,
}: {
  objective: GameObjective;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative border p-4 hud-corner", SEVERITY_CLASS[objective.severity], className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-current/30 bg-black/25">
          <Crosshair className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.32em] opacity-70">Next Objective</p>
          <h2 className={cn("mt-1 font-black uppercase tracking-wider text-white", compact ? "text-sm" : "text-lg")}>
            {objective.title}
          </h2>
          {!compact && <p className="mt-1 text-xs leading-relaxed text-white/55">{objective.description}</p>}
        </div>
      </div>
      <Link
        href={objective.href}
        className="mt-3 inline-flex items-center gap-2 border border-current/30 bg-black/20 px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-white/10"
      >
        {objective.ctaLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
