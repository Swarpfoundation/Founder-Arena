"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  Briefcase,
  Crown,
  Film,
  Radio,
  Server,
  ShieldAlert,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildFirstRunAction, buildRunPhaseSteps, type FirstRunAction } from "@/lib/gamefeel/first-run";
import {
  getDemoDayCountdown,
  getRunPhase,
  getRunPhaseProgress,
  getRunStepLabel,
  getSprintNextActionHint,
  getSprintPressureLevel,
} from "@/lib/game-time/time-scale";

type RunStatus = "draft" | "pitching" | "funded" | "active" | "completed" | "dead" | string;

const ITEMS = [
  { key: "overview", label: "Overview", icon: Activity, segment: "", route: (id: string) => `/startup/${id}` },
  { key: "operate", label: "Operate", icon: Briefcase, segment: "operate", route: (id: string) => `/startup/${id}/operate`, requiresOperating: true },
  { key: "team", label: "Team", icon: Users, segment: "team", route: (id: string) => `/startup/${id}/team`, requiresOperating: true },
  { key: "social", label: "Social", icon: Radio, segment: "social", route: (id: string) => `/startup/${id}/social`, requiresOperating: true },
  { key: "rivals", label: "Rivals", icon: Swords, segment: "rivals", route: (id: string) => `/startup/${id}/rivals`, requiresOperating: true },
  { key: "strategy", label: "Strategy", icon: Crown, segment: "strategy", route: (id: string) => `/startup/${id}/strategy`, requiresOperating: true },
  { key: "infra", label: "Infra", icon: Server, segment: "infrastructure", route: (id: string) => `/startup/${id}/infrastructure` },
  { key: "boardroom", label: "Board", icon: ShieldAlert, segment: "boardroom", route: (id: string) => `/startup/${id}/boardroom`, requiresOperating: true },
  { key: "story", label: "Story", icon: Film, segment: "documentary", route: (id: string) => `/startup/${id}/documentary`, requiresFinal: true },
  { key: "career", label: "Career", icon: BookOpen, segment: "career", route: () => "/career" },
  { key: "arena", label: "Arena", icon: Trophy, segment: "leaderboard", route: () => "/leaderboard?tab=overall&season=beta-season-1" },
];

function canUseItem(status: RunStatus, item: { requiresOperating?: boolean; requiresFinal?: boolean }) {
  const operating = status === "funded" || status === "active" || status === "completed" || status === "dead";
  const final = status === "completed" || status === "dead";
  if (item.requiresFinal) return final;
  if (item.requiresOperating) return operating;
  return true;
}

export function StartupRunHud({
  startupId,
  status,
  finalOutcome,
  hasBoardroomAlert = false,
  nextAction,
  currentStep,
  hasTeam,
  className,
}: {
  startupId: string;
  status: RunStatus;
  finalOutcome?: string | null;
  hasBoardroomAlert?: boolean;
  nextAction?: FirstRunAction | null;
  currentStep?: number | null;
  hasTeam?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const isFinal = status === "completed" || status === "dead";
  const action = nextAction ?? buildFirstRunAction({
    startupId,
    status,
    hasPitch: status !== "draft",
    hasReview: status !== "draft" && status !== "pitching",
    hasFunding: status === "funded" || status === "active" || isFinal,
  });
  const phaseSteps = buildRunPhaseSteps(status);
  const phase = currentStep ? getRunPhase(currentStep) : null;
  const sprintProgress = currentStep ? getRunPhaseProgress(currentStep) : null;
  const pressure = currentStep ? getSprintPressureLevel(currentStep) : null;
  const pressureClass =
    pressure === "demo_day"
      ? "text-rose-400 border-rose-500/25 bg-rose-500/10"
      : pressure === "dangerous"
        ? "text-amber-400 border-amber-500/25 bg-amber-500/10"
        : pressure === "rising"
          ? "text-violet-400 border-violet-500/25 bg-violet-500/10"
          : "text-cyan-400 border-cyan-500/25 bg-cyan-500/10";

  return (
    <nav className={cn("relative border border-cyan-500/15 bg-black/45 p-3 hud-corner", className)} aria-label="Startup run navigation">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-cyan-400/45">Run HUD</p>
          <p className="text-xs text-white/35">
            {isFinal ? `Finalized${finalOutcome ? ` · ${finalOutcome.replace(/_/g, " ")}` : ""}` : action.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isFinal && (
            <Link href={action.href} className="hidden border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-amber-400 hover:bg-amber-500/20 sm:inline-flex">
              {action.label}
            </Link>
          )}
          <span className={cn(
            "border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            status === "dead"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
              : isFinal
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
          )}>
            {status}
          </span>
        </div>
      </div>
      <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
        {phaseSteps.map((step) => (
          <span
            key={step.key}
            className={cn(
              "shrink-0 border px-2 py-1 text-[9px] font-black uppercase tracking-wider",
              step.state === "complete"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                : step.state === "current"
                  ? "border-cyan-500/35 bg-cyan-500/10 text-cyan-400"
                  : "border-white/5 bg-white/[0.02] text-white/20"
            )}
          >
            {step.label}
          </span>
        ))}
      </div>
      {phase && sprintProgress && currentStep && (
        <div className="mb-2 grid gap-2 border border-white/5 bg-white/[0.02] p-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <span className={cn("border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider", pressureClass)}>
                {getRunStepLabel(currentStep)} · {phase.label}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/25">
                {getDemoDayCountdown(currentStep)}
              </span>
            </div>
            <div className="h-1 bg-white/10">
              <div className="h-full bg-cyan-400" style={{ width: `${sprintProgress.percentComplete}%` }} />
            </div>
          </div>
          <p className="text-[10px] leading-relaxed text-white/35 sm:max-w-xs">
            {getSprintNextActionHint(currentStep, { status, hasTeam })}
          </p>
        </div>
      )}
      <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
        {ITEMS.map((item) => {
          const href = item.route(startupId);
          const active =
            item.key === "overview"
              ? pathname === `/startup/${startupId}`
              : item.key === "career"
                ? pathname === "/career"
                : item.key === "arena"
                  ? pathname.startsWith("/leaderboard")
                  : pathname === href || pathname.startsWith(`${href}/`);
          const unlocked = canUseItem(status, item);
          const Icon = item.icon;
          const alert = item.key === "boardroom" && hasBoardroomAlert;

          if (!unlocked) {
            return (
              <div
                key={item.key}
                className="flex shrink-0 items-center gap-1.5 border border-white/5 bg-white/[0.02] px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white/20"
                title="Unlocks later in the run"
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
                <span className="text-[8px] text-white/15">LOCK</span>
              </div>
            );
          }

          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 border px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors",
                active
                  ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-300"
                  : "border-white/10 bg-white/[0.03] text-white/45 hover:border-cyan-500/30 hover:text-white/75"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
              {alert && <span className="h-1.5 w-1.5 animate-pulse bg-rose-400" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
