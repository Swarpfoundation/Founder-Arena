import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageReveal } from "@/components/game/PageReveal";
import { SceneTitle } from "@/components/game/SceneTitle";

const ACCENT_BORDER = {
  cyan: "border-cyan-500/20",
  violet: "border-violet-500/20",
  rose: "border-rose-500/25",
  amber: "border-amber-500/25",
  emerald: "border-emerald-500/20",
  neutral: "border-white/10",
};

export function GameScene({
  eyebrow,
  title,
  subtitle,
  accent = "cyan",
  actions,
  sidePanel,
  footer,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  accent?: keyof typeof ACCENT_BORDER;
  actions?: ReactNode;
  sidePanel?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <PageReveal className={cn("mx-auto max-w-7xl px-4 pb-12 pt-24 md:px-8", className)}>
      <section className={cn("relative overflow-hidden border bg-black/35 p-5 hud-corner md:p-6", ACCENT_BORDER[accent])}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent" />
        <div className="relative z-10 space-y-6">
          <SceneTitle eyebrow={eyebrow} title={title} subtitle={subtitle} accent={accent} actions={actions} />
          {sidePanel ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0 space-y-5">{children}</div>
              <aside className="space-y-4">{sidePanel}</aside>
            </div>
          ) : (
            <div className="space-y-5">{children}</div>
          )}
          {footer}
        </div>
      </section>
    </PageReveal>
  );
}
