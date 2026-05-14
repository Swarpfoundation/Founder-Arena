"use client";

import { GameCard } from "@/components/game/GameCard";
import { ProgressBar } from "@/components/game/ProgressBar";
import { Check, Circle } from "lucide-react";
import type { OnboardingProgress } from "@/lib/onboarding/progress";

interface FirstRunChecklistProps {
  progress: OnboardingProgress;
  className?: string;
}

export function FirstRunChecklist({ progress, className = "" }: FirstRunChecklistProps) {
  if (progress.completedCount >= progress.totalCount) return null;

  return (
    <GameCard glow="cyan" className={className}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Getting Started</h3>
          <p className="text-xs text-muted-foreground">
            Complete these steps to learn the game
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {progress.completedCount}/{progress.totalCount}
        </span>
      </div>

      <ProgressBar value={progress.percentComplete} size="sm" className="mb-4" />

      <div className="space-y-2">
        {progress.items.map((item) => (
          <div
            key={item.key}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
              item.completed
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-white/5 bg-secondary/20"
            }`}
          >
            {item.completed ? (
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span
              className={`text-sm ${
                item.completed ? "text-muted-foreground line-through" : "text-foreground"
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </GameCard>
  );
}
