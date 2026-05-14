"use client";

import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
  size = "md",
}: {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  const sizeClass = size === "sm" ? "h-1" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className={cn("w-full bg-white/5 relative overflow-hidden", sizeClass, className)}>
      <div
        className={cn(
          "h-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all duration-500",
          barClassName
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
