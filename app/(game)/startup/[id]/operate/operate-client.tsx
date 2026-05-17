"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { runMonthlySimulationAction } from "@/lib/actions/simulation";
import { DecisionOption } from "@/lib/simulation/decisions";
import { SimulationEvent } from "@/lib/events/types";
import { previewChoiceEffects } from "@/lib/events/event-selection";
import { GameCard } from "@/components/game/GameCard";
import { ProgressBar } from "@/components/game/ProgressBar";
import { StatDeltaRecap, type RecapHighlight } from "@/components/game/StatDeltaRecap";
import { EventRevealPanel } from "@/components/game/EventRevealPanel";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import type { StatDeltaItem } from "@/lib/gamefeel/ceremony";
import { buildSimulationEventPresentation } from "@/lib/gamefeel/critical-events";
import {
  getDemoDayLabel,
  getDemoDayCountdown,
  getFinalVerdictLabel,
  getRunPhaseLabel,
  getRunStepLabel,
  getShortRunStepLabel,
  getSprintMilestoneLabel,
  getSprintNextActionHint,
} from "@/lib/game-time/time-scale";
import {
  Zap,
  TrendingUp,
  Check,
  AlertTriangle,
  Clock,
  Target,
  Rocket,
  ArrowRight,
  Users,
} from "lucide-react";
import { getEventCategoryIcon, getSeverityIcon } from "@/lib/assets";
import { MissionInstance, NextMove } from "@/lib/missions/types";
import { OperationsAdvisorResult } from "@/lib/ai/operations-advisor";
import { MissionCoachResult } from "@/lib/ai/mission-coach";
import { TotalCostEstimate } from "@/lib/economy/types";

const SEVERITY_COLORS = {
  minor: {
    border: "border-white/10",
    glow: false as const,
    badge: "bg-white/5 text-white/40 border-white/10",
    iconColor: "text-white/40",
  },
  moderate: {
    border: "border-amber-500/20",
    glow: "violet" as const,
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    iconColor: "text-amber-400",
  },
  critical: {
    border: "border-rose-500/30",
    glow: "rose" as const,
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    iconColor: "text-rose-400",
  },
};

const DECISION_GRADIENTS: Record<string, string> = {
  marketing_spend: "from-cyan-500 to-blue-500",
  hire_sales: "from-violet-500 to-fuchsia-500",
  product_focus: "from-emerald-500 to-teal-500",
  cut_costs: "from-amber-500 to-orange-500",
  hire_engineer: "from-cyan-500 to-blue-500",
  hire_compliance: "from-violet-500 to-fuchsia-500",
  launch_beta: "from-emerald-500 to-teal-500",
  improve_security: "from-amber-500 to-orange-500",
  customer_interviews: "from-cyan-500 to-blue-500",
  enterprise_push: "from-violet-500 to-fuchsia-500",
  delay_launch: "from-emerald-500 to-teal-500",
  fundraising_prep: "from-amber-500 to-orange-500",
};

const EVENT_CHOICE_STYLES = [
  { border: "border-cyan-500/30", bg: "bg-cyan-500/10", hover: "hover:bg-cyan-500/20", text: "text-cyan-400" },
  { border: "border-rose-500/30", bg: "bg-rose-500/10", hover: "hover:bg-rose-500/20", text: "text-rose-400" },
  { border: "border-amber-500/30", bg: "bg-amber-500/10", hover: "hover:bg-amber-500/20", text: "text-amber-400" },
];

function getImpactLabel(d: DecisionOption): string {
  if (d.id === "cut_costs") return "Runway +";
  if (d.revenueDelta >= 8000) return "Revenue +";
  if (d.revenueDelta > 0) return "Revenue +";
  if (d.productDelta >= 10) return "Velocity +";
  if (d.productDelta > 0) return "Velocity +";
  if (d.investorDelta >= 5) return "Investor +";
  if (d.investorDelta > 0) return "Investor +";
  if (d.riskDelta < -4) return "Risk --";
  return "Strategic";
}

interface OperateClientProps {
  startupId: string;
  currentMonth: number;
  availableDecisions: DecisionOption[];
  monthlyEvent?: SimulationEvent;
  eventChoices: SimulationEvent["choices"];
  cash: number;
  monthlyBurn: number;
  revenue: number;
  teamMorale: number;
  activeMission: MissionInstance | null;
  pendingMissions: MissionInstance[];
  nextMoves: NextMove[];
  advisor: OperationsAdvisorResult | null;
  missionCoach: MissionCoachResult | null;
  costBreakdown?: TotalCostEstimate | null;
}

interface MonthRecapPayload {
  month: number;
  deltas: StatDeltaItem[];
  highlights: RecapHighlight[];
  nextAction: { label: string; href: string };
}

type SimulationActionResult =
  | { success: true; recap?: MonthRecapPayload }
  | {
      outcome: string;
      reason?: string;
      founderScore?: number;
      publicSlug?: string;
      achievementsUnlocked?: string[];
      xpGained?: number;
      recap?: MonthRecapPayload;
    };

export function OperateClient({
  startupId,
  currentMonth,
  availableDecisions,
  monthlyEvent,
  eventChoices,
  cash,
  monthlyBurn,
  revenue,
  activeMission,
  pendingMissions,
  nextMoves,
  advisor,
  missionCoach,
  costBreakdown,
}: OperateClientProps) {
  const router = useRouter();
  const [selectedDecisions, setSelectedDecisions] = useState<string[]>([]);
  const [selectedEventChoice, setSelectedEventChoice] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<SimulationActionResult | null>(null);
  const [monthRecap, setMonthRecap] = useState<MonthRecapPayload | null>(null);
  const [monthComplete, setMonthComplete] = useState(false);
  const [pending, setPending] = useState(false);
  const reduced = useReducedMotion();

  const nextMonth = currentMonth + 1;
  const nextStepLabel = getRunStepLabel(nextMonth);
  const nextShortStepLabel = getShortRunStepLabel(nextMonth);
  const nextPhaseLabel = getRunPhaseLabel(nextMonth);
  const nextMilestone = getSprintMilestoneLabel(nextMonth);
  const nextCountdown = getDemoDayCountdown(nextMonth);
  const nextSprintHint = getSprintNextActionHint(nextMonth);
  const hasEvent = !!monthlyEvent && eventChoices.length > 0;
  const eventResolved = !hasEvent || selectedEventChoice !== null;
  const eventPresentation = hasEvent
    ? buildSimulationEventPresentation({ startupId, event: monthlyEvent })
    : null;

  function toggleDecision(id: string) {
    setSelectedDecisions((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
    setError("");
  }

  async function handleSubmit() {
    setError("");
    setResult(null);
    setMonthRecap(null);
    setMonthComplete(false);
    setPending(true);

    try {
      const res = await runMonthlySimulationAction(
        startupId,
        selectedDecisions,
        selectedEventChoice ?? undefined
      );
      if ("success" in res) {
        setMonthRecap(res.recap ?? null);
        setMonthComplete(true);
      } else {
        setResult(res);
      }
      setSelectedDecisions([]);
      setSelectedEventChoice(null);
      router.refresh();
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError("Simulation failed");
    } finally {
      setPending(false);
    }
  }

  const severityStyle = hasEvent
    ? SEVERITY_COLORS[monthlyEvent!.severity]
    : SEVERITY_COLORS.minor;

  return (
    <div className="mb-8 space-y-5 relative">
      {/* Sprint Simulation Overlay */}
      <AnimatePresence>
        {pending && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            initial={reduced ? false : { opacity: 0 }}
            animate={reduced ? undefined : { opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
          >
            <div className="text-center">
              <motion.div
                className="text-8xl font-black text-cyan-400 text-glow-cyan"
                animate={reduced ? undefined : { scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                {nextShortStepLabel}
              </motion.div>
              <div className="flex items-center gap-2 justify-center mt-4">
                <div className="w-2 h-2 bg-cyan-400 animate-pulse" />
                <p className="text-xs text-slate-400 tracking-widest">SIMULATING SPRINT</p>
                <div className="w-2 h-2 bg-cyan-400 animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Critical Event Modal */}
      <AnimatePresence>
        {hasEvent && !selectedEventChoice && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center p-5"
            initial={reduced ? false : { opacity: 0 }}
            animate={reduced ? undefined : { opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/80" />
            <motion.div
              className="relative z-10 w-full max-w-md"
              initial={reduced ? false : { scale: 0.5, y: 50 }}
              animate={reduced ? undefined : { scale: 1, y: 0 }}
              exit={reduced ? undefined : { scale: 0.8, y: -30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="game-card p-4 border-2 border-rose-500/30 hud-corner">
                <div className="relative z-10 space-y-4">
                  {eventPresentation && (
                    <EventRevealPanel event={eventPresentation} className="p-4" />
                  )}

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs capitalize text-white/40 border-white/10 bg-white/5">
                      {(() => {
                        const CatIcon = getEventCategoryIcon(monthlyEvent!.category);
                        return <CatIcon className="w-3.5 h-3.5" size={14} />;
                      })()}
                      {monthlyEvent!.category}
                    </span>
                    <span className={cn("inline-flex items-center gap-1 border px-2 py-0.5 text-xs capitalize", severityStyle.badge)}>
                      {(() => {
                        const SevIcon = getSeverityIcon(monthlyEvent!.severity);
                        return <SevIcon className={cn("w-3.5 h-3.5", severityStyle.iconColor)} size={14} />;
                      })()}
                      {monthlyEvent!.severity}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {eventChoices.map((choice, i) => {
                      const style = EVENT_CHOICE_STYLES[i % EVENT_CHOICE_STYLES.length];
                      return (
                        <motion.button
                          key={choice.id}
                          className={cn(
                            "w-full p-4 border text-left transition-all",
                            style.border,
                            style.bg,
                            style.hover
                          )}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedEventChoice(choice.id);
                            setError("");
                          }}
                        >
                          <p className={cn("text-sm font-bold", style.text)}>{choice.label}</p>
                          <p className="text-[10px] text-slate-500">{choice.description}</p>
                          <p className="text-xs text-cyan-400/80 mt-1 font-mono">{previewChoiceEffects(choice)}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Summary (when resolved) */}
      {hasEvent && selectedEventChoice && (
        <GameCard glow={severityStyle.glow} className={cn("border hud-corner", severityStyle.border)}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-400">{monthlyEvent!.title}</h3>
              <p className="text-[10px] text-rose-400/60 font-bold uppercase tracking-wider">Critical Event</p>
            </div>
          </div>
          <p className="text-sm text-white/40 mb-3">{monthlyEvent!.narrative}</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs capitalize text-white/40 border-white/10 bg-white/5">
              {(() => {
                const CatIcon = getEventCategoryIcon(monthlyEvent!.category);
                return <CatIcon className="w-3.5 h-3.5" size={14} />;
              })()}
              {monthlyEvent!.category}
            </span>
            <span className={cn("inline-flex items-center gap-1 border px-2 py-0.5 text-xs capitalize", severityStyle.badge)}>
              {(() => {
                const SevIcon = getSeverityIcon(monthlyEvent!.severity);
                return <SevIcon className={cn("w-3.5 h-3.5", severityStyle.iconColor)} size={14} />;
              })()}
              {monthlyEvent!.severity}
            </span>
          </div>
          <div className="mt-3 p-3 border border-cyan-500/20 bg-cyan-500/10">
            <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1">Response Selected</p>
            <p className="text-sm text-white">
              {eventChoices.find((c) => c.id === selectedEventChoice)?.label}
            </p>
          </div>
          <button
            onClick={() => setSelectedEventChoice(null)}
            className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Change response
          </button>
        </GameCard>
      )}

      {/* Active Mission */}
      {activeMission && (
        <GameCard glow="violet" className="border-violet-500/20 hud-corner">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-violet-500/20 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-violet-400">{activeMission.title}</h3>
              <p className="text-[10px] text-violet-400/60 font-bold uppercase tracking-wider">
                {activeMission.category} &middot; Mission {activeMission.sequence}
              </p>
            </div>
          </div>
          <ProgressBar value={activeMission.progress} max={100} className="mb-3" />
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-slate-500">Progress</span>
            <span className="text-violet-400 font-bold">{activeMission.progress}%</span>
          </div>
          {((activeMission.requiredRoles as { role: string; count: number }[]) ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {((activeMission.requiredRoles as { role: string; count: number }[]) ?? []).map((r) => (
                <span
                  key={r.role}
                  className="inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] text-white/60 border-white/10 bg-white/5"
                >
                  <Users className="w-3 h-3" />
                  {r.role} x{r.count}
                </span>
              ))}
            </div>
          )}

          {/* Mission Coach */}
          {missionCoach && (
            <div className="mt-4 p-3 border border-emerald-500/20 bg-emerald-500/5">
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2">Mission Coach</p>
              <p className="text-xs text-emerald-300/90 mb-2 font-medium">{missionCoach.priorityTip}</p>
              <ul className="space-y-1">
                {missionCoach.tips.slice(1).map((tip, i) => (
                  <li key={i} className="text-[11px] text-white/50 flex items-start gap-1.5">
                    <span className="text-emerald-400/60 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </GameCard>
      )}

      {/* Mission Timeline */}
      {activeMission && pendingMissions.length > 0 && (
        <GameCard glow="violet" className="border-violet-500/20 hud-corner">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-violet-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-violet-400">Mission Roadmap</h3>
              <p className="text-[10px] text-violet-400/60 font-bold uppercase tracking-wider">
                {pendingMissions.length + 1} missions ahead
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute top-3 left-0 right-0 h-px bg-white/10" />
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[activeMission, ...pendingMissions].map((m, i) => (
                <div key={m.id} className="relative flex-shrink-0 w-24">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto mb-2 relative z-10",
                      i === 0
                        ? "bg-violet-500/20 border-violet-400"
                        : "bg-slate-800 border-white/20"
                    )}
                  >
                    <span className={cn("text-[10px] font-bold", i === 0 ? "text-violet-400" : "text-white/40")}>
                      {m.sequence}
                    </span>
                  </div>
                  <p className={cn("text-[10px] text-center leading-tight", i === 0 ? "text-violet-300" : "text-white/40")}>
                    {m.title}
                  </p>
                  <p className="text-[9px] text-center text-white/20 mt-0.5">{m.category}</p>
                </div>
              ))}
            </div>
          </div>
        </GameCard>
      )}

      {/* AI Operations Advisor */}
      {advisor && (
        <GameCard glow="cyan" className="border-cyan-500/20 hud-corner">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-cyan-400">AI Operations Advisor</h3>
              <p className="text-[10px] text-cyan-400/60 font-bold uppercase tracking-wider">
                Confidence: {advisor.confidence}%
              </p>
            </div>
          </div>

          <p className="text-xs text-white/70 mb-3">{advisor.currentSituationSummary}</p>

          {advisor.topOperationalRisks.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mb-1">Top Risks</p>
              <ul className="space-y-1">
                {advisor.topOperationalRisks.slice(0, 3).map((risk, i) => (
                  <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {advisor.missionGapAnalysis && (
            <div className="mb-3 p-2 border border-violet-500/20 bg-violet-500/5">
              <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-1">Mission Gap</p>
              <p className="text-xs text-white/60">{advisor.missionGapAnalysis}</p>
            </div>
          )}

          {advisor.recommendedHires.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Recommended Hires</p>
              <div className="flex flex-wrap gap-1.5">
                {advisor.recommendedHires.map((hire, i) => (
                  <span key={i} className="inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] text-white/60 border-white/10 bg-white/5">
                    <Users className="w-3 h-3" />
                    {hire}
                  </span>
                ))}
              </div>
            </div>
          )}

          {advisor.spendingWarnings.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mb-1">Spending Warnings</p>
              {advisor.spendingWarnings.map((w, i) => (
                <p key={i} className="text-xs text-rose-300/80">{w}</p>
              ))}
            </div>
          )}

          {advisor.whatNotToDo.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">What Not To Do</p>
              {advisor.whatNotToDo.map((w, i) => (
                <p key={i} className="text-xs text-amber-300/80">{w}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 border border-cyan-500/10 bg-cyan-500/5">
              <p className="text-[10px] text-cyan-400/60 uppercase tracking-wider mb-0.5">Next 30 Days</p>
              <p className="text-[10px] text-white/60">{advisor.next30DaysPlan}</p>
            </div>
            <div className="p-2 border border-cyan-500/10 bg-cyan-500/5">
              <p className="text-[10px] text-cyan-400/60 uppercase tracking-wider mb-0.5">Next 90 Days</p>
              <p className="text-[10px] text-white/60">{advisor.next90DaysPlan}</p>
            </div>
          </div>
        </GameCard>
      )}

      {/* Next Moves */}
      {nextMoves.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-white mb-3 tracking-wider uppercase flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-amber-400" />
            Recommended Next Moves
          </h3>
          <div className="space-y-2">
            {nextMoves.slice(0, 3).map((move, i) => (
              <motion.div
                key={move.id}
                className={cn(
                  "game-card p-4 border hud-corner",
                  move.urgency === "critical"
                    ? "border-rose-500/30 bg-rose-500/5"
                    : move.urgency === "high"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-white/5"
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{move.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{move.whyItMatters}</p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shrink-0",
                      move.urgency === "critical"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : move.urgency === "high"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-white/5 text-white/40 border border-white/10"
                    )}
                  >
                    {move.urgency}
                  </span>
                </div>
                {move.estimatedCost > 0 && (
                  <p className="text-xs text-rose-400/80 mt-2">Est. cost: ${(move.estimatedCost / 1000).toFixed(0)}K</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      {costBreakdown && (
        <GameCard glow="rose" className="border-rose-500/20 hud-corner">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-rose-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-400">Monthly Burn Breakdown</h3>
              <p className="text-[10px] text-rose-400/60 font-bold uppercase tracking-wider">
                Runway: {Math.floor(cash / Math.max(monthlyBurn, 1))} months
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: "Payroll", value: costBreakdown.payrollMonthly, color: "text-cyan-400" },
              { label: "Office", value: costBreakdown.officeMonthly, color: "text-amber-400" },
              { label: "Operating", value: costBreakdown.operatingCostsMonthly, color: "text-violet-400" },
              ...(costBreakdown.missionCostsMonthly > 0
                ? [{ label: "Mission", value: costBreakdown.missionCostsMonthly, color: "text-emerald-400" }]
                : []),
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="text-white/40">{item.label}</span>
                <span className={`font-bold ${item.color}`}>${(item.value / 1000).toFixed(1)}K</span>
              </div>
            ))}
            <div className="h-px bg-white/10 my-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60 font-bold">Total Burn</span>
              <span className="font-black text-rose-400">${(costBreakdown.totalMonthlyBurn / 1000).toFixed(1)}K/mo</span>
            </div>
            {revenue > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Net Burn</span>
                <span className="font-bold text-rose-400">${(Math.max(0, costBreakdown.totalMonthlyBurn - revenue) / 1000).toFixed(1)}K/mo</span>
              </div>
            )}
          </div>
        </GameCard>
      )}

      {/* Decision Cards */}
      {eventResolved && (
        <div>
          <h3 className="text-sm font-bold text-white mb-3 tracking-wider uppercase flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            Sprint Decisions
          </h3>
          <div className="space-y-2">
            {availableDecisions.map((decision, i) => {
              const isSelected = selectedDecisions.includes(decision.id);
              const gradient = DECISION_GRADIENTS[decision.id] ?? "from-cyan-500 to-blue-500";
              return (
                <motion.button
                  key={decision.id}
                  className={cn(
                    "w-full game-card p-4 text-left transition-all hud-corner",
                    isSelected
                      ? "border-cyan-500/40 bg-cyan-500/10"
                      : "border-white/5 hover:border-white/10"
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleDecision(decision.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 bg-gradient-to-br flex items-center justify-center flex-shrink-0", gradient)}>
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{decision.label}</p>
                      <p className="text-[10px] text-slate-500">{decision.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-rose-400">
                        {decision.cashCost > 0 ? `-$${(decision.cashCost / 1000).toFixed(0)}K` : "Free"}
                      </p>
                      <p className="text-[10px] text-emerald-400">{getImpactLabel(decision)}</p>
                    </div>
                    {isSelected && (
                      <div className="ml-2 flex-shrink-0 flex items-center justify-center bg-cyan-500/20 border border-cyan-500/30 w-7 h-7 text-cyan-300 text-xs font-bold">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Run Sprint Button */}
      {eventResolved && (
        <div className="space-y-3">
          <div className="border border-cyan-500/20 bg-cyan-500/5 p-3 hud-corner">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.28em] text-cyan-400">{nextStepLabel}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/35">{nextPhaseLabel}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/70">{nextMilestone ?? nextCountdown}</span>
            </div>
            <p className="text-xs leading-relaxed text-white/50">{nextSprintHint}</p>
          </div>
          <motion.button
            className={cn(
              "w-full h-16 font-black text-lg tracking-wider flex items-center justify-center gap-3 transition-all border",
              selectedDecisions.length > 0 && !pending
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 glow-cyan"
                : "bg-slate-800/50 border-slate-700/50 text-slate-500 cursor-not-allowed"
            )}
            whileHover={selectedDecisions.length > 0 && !pending ? { scale: 1.03, y: -2 } : undefined}
            whileTap={selectedDecisions.length > 0 && !pending ? { scale: 0.97 } : undefined}
            onClick={handleSubmit}
            disabled={!selectedDecisions.length || pending}
          >
            <Clock className="w-6 h-6" />
            {selectedDecisions.length > 0 ? "RUN SPRINT" : "SELECT DECISION"}
          </motion.button>
        </div>
      )}

      {/* Error */}
      {error && (
        <GameCard glow="rose" className="border-rose-500/30 hud-corner">
          <p className="text-sm text-rose-300">{error}</p>
        </GameCard>
      )}

      {/* Sprint Complete Result */}
      <AnimatePresence>
        {monthComplete && !result && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
          >
            {monthRecap && (
              <StatDeltaRecap
                title={`${getRunStepLabel(monthRecap.month)} Sprint Recap`}
                deltas={monthRecap.deltas}
                highlights={monthRecap.highlights}
                nextAction={monthRecap.nextAction}
                phaseStep={monthRecap.month}
              />
            )}
            <div className="game-card p-6 border-2 border-emerald-500/30 hud-corner text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400 tracking-wider">Operation Complete</span>
              </div>
              <h3 className="text-2xl font-black text-white">{nextStepLabel} Done</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-500/10">
                  <p className="text-[10px] text-emerald-400/60 uppercase">Decisions</p>
                  <p className="text-lg font-black text-emerald-400">{selectedDecisions.length}</p>
                </div>
                <div className="p-3 bg-cyan-500/10">
                  <p className="text-[10px] text-cyan-400/60 uppercase">Week</p>
                  <p className="text-lg font-black text-cyan-400">{nextShortStepLabel}</p>
                </div>
                <div className="p-3 bg-rose-500/10">
                  <p className="text-[10px] text-rose-400/60 uppercase">Event</p>
                  <p className="text-lg font-black text-rose-400">{hasEvent ? "Yes" : "No"}</p>
                </div>
              </div>
              <motion.button
                className="px-8 py-3 bg-slate-800 text-slate-300 text-sm font-bold tracking-wider uppercase border border-slate-700 hover:border-slate-500 transition-all"
                whileTap={{ scale: 0.95 }}
                onClick={() => setMonthComplete(false)}
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final Outcome Result */}
      <AnimatePresence>
        {result && "outcome" in result && result.outcome && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
          >
            {result.recap && (
              <StatDeltaRecap
                title={`${getDemoDayLabel()} Sprint ${result.recap.month} Recap`}
                deltas={result.recap.deltas}
                highlights={[
                  ...result.recap.highlights,
                  ...(result.achievementsUnlocked?.length
                    ? [{
                        label: "Rewards",
                        text: `${result.achievementsUnlocked.length} achievement signal${result.achievementsUnlocked.length === 1 ? "" : "s"} unlocked. XP +${result.xpGained ?? 0}.`,
                        tone: "emerald" as const,
                      }]
                    : []),
                ]}
                nextAction={{
                  label: result.publicSlug ? "View Public Record" : "View Story",
                  href: result.publicSlug ? `/s/${result.publicSlug}` : `/startup/${startupId}/documentary`,
                }}
                phaseStep={result.recap.month}
              />
            )}
            <div className="game-card p-6 border-2 border-emerald-500/30 hud-corner text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400 tracking-wider">{getFinalVerdictLabel()}</span>
              </div>
              <h3 className="text-2xl font-black text-white">{result.outcome}</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-500/10">
                  <p className="text-[10px] text-emerald-400/60 uppercase">Founder Score</p>
                  <p className="text-lg font-black text-emerald-400">{result.founderScore ?? 0}</p>
                </div>
                <div className="p-3 bg-cyan-500/10">
                  <p className="text-[10px] text-cyan-400/60 uppercase">Weeks</p>
                  <p className="text-lg font-black text-cyan-400">{nextMonth}</p>
                </div>
                <div className="p-3 bg-rose-500/10">
                  <p className="text-[10px] text-rose-400/60 uppercase">Status</p>
                  <p className="text-lg font-black text-rose-400">Final</p>
                </div>
              </div>
              <p className="text-sm text-white/40">{result.reason}</p>
              <motion.button
                className="px-8 py-3 bg-slate-800 text-slate-300 text-sm font-bold tracking-wider uppercase border border-slate-700 hover:border-slate-500 transition-all"
                whileTap={{ scale: 0.95 }}
                onClick={() => setResult(null)}
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
