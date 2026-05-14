"use client";

import { Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  subtitle,
  className,
  accent = "cyan",
}: {
  title: string;
  subtitle?: string;
  className?: string;
  accent?: "cyan" | "violet" | "rose" | "emerald" | "amber";
}) {
  const accentColor = {
    cyan: "text-cyan-400",
    violet: "text-violet-400",
    rose: "text-rose-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  }[accent];

  return (
    <div className={cn("mb-4", className)}>
      <div className="flex items-center gap-3 mb-1">
        <Crosshair className={cn("w-5 h-5", accentColor)} />
        <h2 className="text-lg font-semibold tracking-wider text-white">{title}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-cyan-400/30 to-transparent" />
      </div>
      {subtitle && (
        <p className="text-white/40 text-sm ml-8">{subtitle}</p>
      )}
    </div>
  );
}
