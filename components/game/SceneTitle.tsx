import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const ACCENT_TEXT = {
  cyan: "text-cyan-400",
  violet: "text-violet-400",
  rose: "text-rose-400",
  amber: "text-amber-400",
  emerald: "text-emerald-400",
  neutral: "text-white/45",
};

export function SceneTitle({
  eyebrow,
  title,
  subtitle,
  accent = "cyan",
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  accent?: keyof typeof ACCENT_TEXT;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className={cn("mb-2 text-[10px] font-black uppercase tracking-[0.38em]", ACCENT_TEXT[accent])}>
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-black uppercase tracking-[0.08em] text-white md:text-5xl text-glow-cyan">
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/48">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
