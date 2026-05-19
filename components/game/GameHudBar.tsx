import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, Briefcase, Gauge, Radio, Server, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GameObjective } from "@/lib/game/objectives";
import { getRunPhaseLabel, getRunStepLabel } from "@/lib/game-time/time-scale";

export function GameHudBar({
  startupId,
  startupName,
  currentStep,
  cash,
  monthlyBurn,
  activeIncidents = 0,
  objective,
  className,
}: {
  startupId?: string;
  startupName?: string;
  currentStep?: number;
  cash?: number;
  monthlyBurn?: number;
  activeIncidents?: number;
  objective?: GameObjective;
  className?: string;
}) {
  const runway = monthlyBurn && monthlyBurn > 0 && typeof cash === "number"
    ? Math.max(0, Math.floor(cash / monthlyBurn))
    : null;

  return (
    <div className={cn("relative border border-cyan-500/15 bg-black/55 p-3 hud-corner", className)}>
      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-cyan-400/45">In-Game HUD</p>
          <p className="truncate text-sm font-black uppercase tracking-wider text-white">
            {startupName ?? "No active operation"}
          </p>
          {objective && <p className="truncate text-xs text-white/38">{objective.title}</p>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <HudMetric icon={<Gauge className="h-3.5 w-3.5" />} label="Week" value={currentStep ? getRunStepLabel(currentStep).replace("Week ", "") : "--"} />
          <HudMetric label="Phase" value={currentStep ? getRunPhaseLabel(currentStep) : "Standby"} />
          <HudMetric label="Runway" value={runway === null ? "--" : `${runway} mo`} danger={runway !== null && runway < 6} />
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 border px-2 py-1 text-[9px] font-black uppercase tracking-wider",
              activeIncidents > 0
                ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                : "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            {activeIncidents} incidents
          </span>
          {startupId ? (
            <>
              <HudLink href={`/startup/${startupId}/operate`} icon={<Briefcase className="h-3.5 w-3.5" />} label="Operate" />
              <HudLink href={`/startup/${startupId}/infrastructure`} icon={<Server className="h-3.5 w-3.5" />} label="Infra" />
              <HudLink href={`/startup/${startupId}/boardroom`} icon={<ShieldAlert className="h-3.5 w-3.5" />} label="Board" />
            </>
          ) : (
            <HudLink href="/startup/new" icon={<Radio className="h-3.5 w-3.5" />} label="Deploy" />
          )}
        </div>
      </div>
    </div>
  );
}

function HudMetric({
  label,
  value,
  icon,
  danger = false,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="border border-white/10 bg-white/[0.03] px-2 py-1.5">
      <p className="mb-0.5 flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-white/30">
        {icon}
        {label}
      </p>
      <p className={cn("truncate text-[11px] font-black uppercase tracking-wider", danger ? "text-rose-300" : "text-white")}>
        {value}
      </p>
    </div>
  );
}

function HudLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white/45 transition-colors hover:border-cyan-500/30 hover:text-cyan-300"
    >
      {icon}
      {label}
    </Link>
  );
}
