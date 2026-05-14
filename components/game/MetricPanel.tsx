"use client";

import { cn } from "@/lib/utils";

function TrendArrowUp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-3 h-3", className)}>
      <path d="M7 17l5-5 5 5" />
      <path d="M12 12V3" />
    </svg>
  );
}

function TrendArrowDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-3 h-3", className)}>
      <path d="M7 7l5 5 5-5" />
      <path d="M12 12v9" />
    </svg>
  );
}


export function MetricPanel({
  label,
  value,
  trend,
  trendValue,
  icon,
  className,
  variant = "default",
}: {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: "default" | "large" | "compact";
}) {
  const trendIcon =
    trend === "up" ? (
      <TrendArrowUp className="text-emerald-400" />
    ) : trend === "down" ? (
      <TrendArrowDown className="text-rose-400" />
    ) : null;

  const isLarge = variant === "large";
  const isCompact = variant === "compact";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className={cn(
        "flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40",
        isCompact && "text-[9px]"
      )}>
        {icon && <span className="text-cyan-400">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className={cn(
        "font-black tracking-tight text-white",
        isLarge ? "text-2xl" : isCompact ? "text-sm" : "text-xl"
      )}>
        {value}
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 text-[10px]">
          {trendIcon}
          {trendValue && (
            <span
              className={cn(
                trend === "up"
                  ? "text-emerald-400"
                  : trend === "down"
                  ? "text-rose-400"
                  : "text-white/40"
              )}
            >
              {trendValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
