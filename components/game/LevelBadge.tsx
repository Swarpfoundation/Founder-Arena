"use client";

import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

export function LevelBadge({ level, size = "md" }: { level: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center font-black text-cyan-400 border border-cyan-400/30 bg-cyan-400/10",
        sizeClasses[size]
      )}
    >
      <Zap className="absolute inset-0 m-auto w-1/2 h-1/2 text-cyan-400/20" />
      <span className="relative z-10">{level}</span>
    </div>
  );
}
