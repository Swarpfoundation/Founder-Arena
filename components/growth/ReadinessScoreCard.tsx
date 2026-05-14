"use client";

import { ReadinessResult } from "@/lib/growth/types";
import { GameCard } from "@/components/game/GameCard";
import { ProgressBar } from "@/components/game/ProgressBar";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, Zap } from "lucide-react";

interface ReadinessScoreCardProps {
  title: string;
  result: ReadinessResult;
  className?: string;
}

const STATUS_CONFIG = {
  strong: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2, glow: "emerald" as const },
  ready: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: CheckCircle2, glow: "cyan" as const },
  borderline: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: AlertTriangle, glow: "violet" as const },
  not_ready: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: XCircle, glow: "rose" as const },
};

export function ReadinessScoreCard({ title, result, className }: ReadinessScoreCardProps) {
  const config = STATUS_CONFIG[result.status];
  const Icon = config.icon;

  return (
    <GameCard glow={config.glow} className={cn("border", config.border, className)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-foreground">{title}</h3>
          <div className={cn("text-sm font-medium mt-0.5 capitalize", config.color)}>
            {result.status.replace("_", " ")}
          </div>
        </div>
        <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold", config.bg, config.color)}>
          <Icon className="w-3.5 h-3.5" />
          {result.score}/100
        </div>
      </div>

      <ProgressBar value={result.score} className="mb-4" />

      {result.reasons.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Strengths</div>
          <ul className="space-y-1">
            {result.reasons.slice(0, 3).map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.blockers.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Blockers</div>
          <ul className="space-y-1">
            {result.blockers.slice(0, 2).map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={cn("text-xs rounded-md px-2.5 py-2", config.bg)}>
        <Zap className={cn("w-3.5 h-3.5 inline mr-1", config.color)} />
        {result.recommendedNextMove}
      </div>
    </GameCard>
  );
}
