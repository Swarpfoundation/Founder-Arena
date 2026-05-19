import Link from "next/link";
import { ArrowRight, Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getNextObjective,
  getRunSlotPresentation,
  getStartupRunStep,
  type StartupObjectiveInput,
} from "@/lib/game/objectives";
import {
  getDemoDayCountdown,
  getRunPhaseLabel,
  getShortRunStepLabel,
  getSprintPressureLevel,
} from "@/lib/game-time/time-scale";
import { StatusBadge } from "@/components/game/StatusBadge";

const ACCENT_CLASS = {
  cyan: "border-cyan-500/30 bg-cyan-500/[0.06] text-cyan-300",
  violet: "border-violet-500/30 bg-violet-500/[0.06] text-violet-300",
  rose: "border-rose-500/30 bg-rose-500/[0.06] text-rose-300",
  amber: "border-amber-500/30 bg-amber-500/[0.06] text-amber-300",
  emerald: "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300",
  white: "border-white/10 bg-white/[0.03] text-white/55",
};

export function RunSlotCard({
  startup,
  featured = false,
}: {
  startup: StartupObjectiveInput & {
    sector?: string | null;
    stage?: string | null;
    valuation?: number | null;
    revenue?: number | null;
    productProgress?: number | null;
    employees?: unknown[] | null;
  };
  featured?: boolean;
}) {
  const slot = getRunSlotPresentation(startup);
  const objective = getNextObjective(startup);
  const runStep = getStartupRunStep(startup);
  const pressure = getSprintPressureLevel(runStep);
  const runway = startup.monthlyBurn && startup.monthlyBurn > 0 && typeof startup.cash === "number"
    ? Math.max(0, Math.floor(startup.cash / startup.monthlyBurn))
    : null;
  const incidentCount = Number(startup.openInfrastructureEvent) + Number(startup.openBoardroomEvent) + Number(startup.hasRivalThreat);

  return (
    <Link href={objective.href} className="group block">
      <article
        className={cn(
          "relative h-full overflow-hidden border p-5 hud-corner transition-all duration-200 hover:-translate-y-1",
          ACCENT_CLASS[slot.accent],
          featured && "shadow-[0_0_38px_rgba(34,211,238,0.12)]"
        )}
      >
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.32em] opacity-70">{slot.eyebrow}</p>
              <h3 className="mt-1 truncate text-xl font-black uppercase tracking-wider text-white">{startup.name}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="border border-current/30 bg-black/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                  {slot.label}
                </span>
                <StatusBadge status={startup.status} />
              </div>
            </div>
            {slot.kind === "archive" ? <Trophy className="h-5 w-5 shrink-0 opacity-70" /> : <Flame className="h-5 w-5 shrink-0 opacity-70" />}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SlotMetric label="Sector" value={startup.sector ?? startup.stage ?? "Venture"} />
            <SlotMetric label="Week" value={`${getShortRunStepLabel(runStep)} / 12`} />
            <SlotMetric label="Phase" value={getRunPhaseLabel(runStep)} />
            <SlotMetric label="Runway" value={runway === null ? "--" : `${runway} mo`} danger={runway !== null && runway < 6} />
          </div>

          <div className="border border-white/10 bg-black/25 p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-[9px] font-black uppercase tracking-wider text-white/35">Objective</p>
              <span className={cn("text-[9px] font-black uppercase tracking-wider", pressure === "demo_day" ? "text-rose-300" : "text-cyan-300")}>
                {getDemoDayCountdown(runStep)}
              </span>
            </div>
            <p className="text-sm font-black uppercase tracking-wider text-white">{objective.title}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/45">{objective.description}</p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className={cn(
              "border px-2 py-1 text-[9px] font-black uppercase tracking-wider",
              incidentCount > 0 ? "border-rose-500/30 bg-rose-500/10 text-rose-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
            )}>
              {incidentCount} active incidents
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-current">
              {objective.ctaLabel}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function SlotMetric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="border border-white/10 bg-white/[0.025] p-2">
      <p className="text-[8px] font-black uppercase tracking-wider text-white/28">{label}</p>
      <p className={cn("truncate text-xs font-black uppercase tracking-wider", danger ? "text-rose-300" : "text-white/78")}>{value}</p>
    </div>
  );
}
