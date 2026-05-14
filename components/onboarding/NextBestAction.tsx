"use client";

import Link from "next/link";
import { GameCard } from "@/components/game/GameCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, AlertCircle } from "lucide-react";
import type { NextBestAction as NextBestActionType } from "@/lib/onboarding/progress";

interface NextBestActionProps {
  action: NextBestActionType | null;
  className?: string;
}

export function NextBestAction({ action, className = "" }: NextBestActionProps) {
  if (!action) return null;

  const urgencyColor =
    action.urgency === "high"
      ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
      : action.urgency === "medium"
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";

  return (
    <GameCard glow={action.urgency === "high" ? "rose" : action.urgency === "medium" ? "cyan" : false} className={className}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Next Best Action
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${urgencyColor}`}
            >
              {action.urgency}
            </span>
          </div>
          <p className="text-sm text-foreground/90">{action.description}</p>
        </div>
        <Link href={action.href}>
          <Button className="gap-2 whitespace-nowrap">
            {action.label}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </GameCard>
  );
}

export function NextBestActionInline({ action }: { action: NextBestActionType | null }) {
  if (!action) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <AlertCircle className="w-4 h-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{action.description}</p>
      </div>
      <Link href={action.href} className="text-sm font-medium text-primary hover:text-primary/80 transition-colors shrink-0">
        {action.label} →
      </Link>
    </div>
  );
}
