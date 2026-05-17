"use client";

import { useState, useTransition } from "react";
import { respondToBoardroomEvent } from "@/lib/actions/boardroom";
import type { BoardroomPageData } from "@/lib/actions/boardroom";
import type { BoardroomEvent, BoardroomEffect } from "@/lib/boardroom/types";
import { checkResponseRequirements } from "@/lib/boardroom/boardroom-engine";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: "border-rose-500/60 bg-rose-500/10 text-rose-400",
  high: "border-amber-500/60 bg-amber-500/10 text-amber-400",
  medium: "border-yellow-500/60 bg-yellow-500/10 text-yellow-400",
  low: "border-green-500/60 bg-green-500/10 text-green-400",
};

const PRESSURE_LABELS: Record<string, string> = {
  runway_crisis: "RUNWAY CRISIS",
  investor_conflict: "INVESTOR CONFLICT",
  revenue_miss: "REVENUE MISS",
  product_delay: "PRODUCT DELAY",
  brand_risk: "BRAND RISK",
  rival_pressure: "RIVAL PRESSURE",
  burn_rate: "BURN RATE",
  compliance_risk: "COMPLIANCE RISK",
  fundraising_pressure: "FUNDRAISING",
  strategy_doubt: "STRATEGY DOUBT",
  acquisition_pressure: "ACQUISITION",
  growth_expectation: "GROWTH TARGET",
};

const STANCE_COLORS: Record<string, string> = {
  defensive: "border-blue-500/40 text-blue-400 bg-blue-500/10",
  aggressive: "border-rose-500/40 text-rose-400 bg-rose-500/10",
  transparent: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
  pivot: "border-violet-500/40 text-violet-400 bg-violet-500/10",
  negotiate: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  delay: "border-gray-500/40 text-gray-400 bg-gray-500/10",
  accept: "border-green-500/40 text-green-400 bg-green-500/10",
  reject: "border-rose-500/40 text-rose-400 bg-rose-500/10",
  double_down: "border-orange-500/40 text-orange-400 bg-orange-500/10",
};

const RISK_COLORS: Record<string, string> = {
  low: "text-green-400",
  medium: "text-amber-400",
  high: "text-rose-400",
};

function EffectLine({ label, delta }: { label: string; delta?: number }) {
  if (!delta) return null;
  const positive = delta > 0;
  return (
    <span className={cn("text-[10px] font-mono", positive ? "text-green-400" : "text-rose-400")}>
      {label}: {positive ? "+" : ""}{delta}
    </span>
  );
}

function EffectRow({ effects }: { effects: BoardroomEffect }) {
  const lines = [
    { label: "InvScore", delta: effects.investorScoreDelta },
    { label: "Board", delta: effects.boardConfidenceDelta },
    { label: "Risk", delta: effects.riskScoreDelta ? -effects.riskScoreDelta : undefined },
    { label: "Revenue", delta: effects.revenueDelta ? Math.round(effects.revenueDelta / 100) : undefined },
    { label: "Burn", delta: effects.burnDelta ? Math.round(-effects.burnDelta / 100) : undefined },
    { label: "Trust", delta: effects.socialTrustDelta },
    { label: "BrandRisk", delta: effects.brandRiskDelta ? -effects.brandRiskDelta : undefined },
  ].filter((l) => l.delta !== undefined && l.delta !== 0);

  if (lines.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
      {lines.map((l) => (
        <EffectLine key={l.label} label={l.label} delta={l.delta} />
      ))}
      {effects.strategySignal && (
        <span className="text-[10px] text-violet-400 font-mono">
          Signal: {effects.strategySignal}
        </span>
      )}
    </div>
  );
}

// ─── Open Event Panel ─────────────────────────────────────────────────────────

function OpenEventPanel({
  event,
  pageData,
  onResolved,
}: {
  event: BoardroomEvent;
  pageData: BoardroomPageData;
  onResolved: (narrative: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resolvedNarrative, setResolvedNarrative] = useState<string | null>(null);

  function handleSelect(id: string) {
    if (resolvedNarrative || isPending) return;
    setSelectedId(id === selectedId ? null : id);
    setError(null);
  }

  function handleConfirm() {
    if (!selectedId || isPending) return;
    setError(null);

    startTransition(async () => {
      try {
        const result = await respondToBoardroomEvent(
          pageData.startupId,
          event.id,
          selectedId
        );
        if (result.success) {
          setResolvedNarrative(result.outcomeNarrative);
          onResolved(result.outcomeNarrative);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to submit response");
      }
    });
  }

  const severityClass = SEVERITY_COLORS[event.severity] ?? SEVERITY_COLORS.medium;

  if (resolvedNarrative) {
    return (
      <div className="game-card p-6 border border-green-500/30 bg-green-500/5">
        <p className="text-[10px] text-green-400 font-bold tracking-widest uppercase mb-2">
          BOARDROOM — RESOLVED
        </p>
        <p className="text-white font-bold text-lg mb-2">{event.title}</p>
        <p className="text-white/70 text-sm">{resolvedNarrative}</p>
      </div>
    );
  }

  return (
    <div className={cn("game-card p-6 border-2 hud-corner", severityClass)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <span className={cn("text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 border", severityClass)}>
            {PRESSURE_LABELS[event.pressureType] ?? event.pressureType.toUpperCase()} &bull; {event.severity.toUpperCase()}
          </span>
          <h2 className="text-xl font-black text-white mt-2">{event.title}</h2>
        </div>
        <span className="text-[10px] text-white/40 font-mono shrink-0">Month {event.month}</span>
      </div>

      {/* Context */}
      <div className="mb-4 p-3 border border-white/10 bg-black/20">
        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">BOARD CONCERN</p>
        <p className="text-white/80 text-sm">{event.concern}</p>
      </div>

      {/* Question */}
      <div className="mb-5 p-3 border border-amber-500/30 bg-amber-500/5">
        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">BOARD QUESTION</p>
        <p className="text-amber-100 text-sm font-medium italic">&ldquo;{event.boardQuestion}&rdquo;</p>
      </div>

      {/* Response Options */}
      <div className="space-y-3 mb-5">
        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">SELECT RESPONSE</p>
        {event.responseOptions.map((opt) => {
          const req = checkResponseRequirements(opt, {
            cash: pageData.cash,
            revenue: pageData.revenue,
            productProgress: pageData.productProgress,
            investorScore: pageData.investorScore,
            boardConfidence: pageData.boardroomState.boardConfidence,
            monthlyBurn: pageData.monthlyBurn,
          });
          const isSelected = selectedId === opt.id;
          const isDisabled = !req.available;

          return (
            <button
              key={opt.id}
              onClick={() => !isDisabled && handleSelect(opt.id)}
              disabled={isDisabled || isPending}
              className={cn(
                "w-full text-left p-4 border transition-all",
                isDisabled
                  ? "border-white/10 bg-white/5 opacity-40 cursor-not-allowed"
                  : isSelected
                  ? "border-cyan-500/70 bg-cyan-500/15 cursor-pointer"
                  : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10 cursor-pointer"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white font-bold text-sm">{opt.title}</span>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 border uppercase", STANCE_COLORS[opt.stance])}>
                      {opt.stance.replace("_", " ")}
                    </span>
                    <span className={cn("text-[10px] font-bold ml-auto", RISK_COLORS[opt.risk])}>
                      {opt.risk.toUpperCase()} RISK
                    </span>
                  </div>
                  <p className="text-white/60 text-xs">{opt.description}</p>
                  {opt.contextNote && (
                    <p className="text-amber-400/80 text-[11px] italic mt-1">{opt.contextNote}</p>
                  )}
                  {isDisabled && req.reason && (
                    <p className="text-rose-400 text-[11px] mt-1">Locked: {req.reason}</p>
                  )}
                  <EffectRow effects={opt.projectedEffects} />
                </div>
                {isSelected && (
                  <div className="w-4 h-4 border border-cyan-400 bg-cyan-400 shrink-0 mt-0.5" />
                )}
                {!isSelected && !isDisabled && (
                  <div className="w-4 h-4 border border-white/30 shrink-0 mt-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-rose-400 text-xs mb-3 font-bold">{error}</p>
      )}

      <button
        onClick={handleConfirm}
        disabled={!selectedId || isPending}
        className={cn(
          "w-full py-3 text-xs font-black tracking-widest uppercase transition-all",
          selectedId && !isPending
            ? "border border-cyan-500/50 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 cursor-pointer"
            : "border border-white/10 bg-white/5 text-white/30 cursor-not-allowed"
        )}
      >
        {isPending ? "SUBMITTING..." : "CONFIRM RESPONSE TO BOARD"}
      </button>
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({ events }: { events: BoardroomEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="game-card p-5">
      <p className="text-[10px] text-white/40 font-bold tracking-widest uppercase mb-4">
        EVENT HISTORY — {events.length} resolved
      </p>
      <div className="space-y-3">
        {[...events].reverse().map((e) => {
          const responseOpt = e.responseOptions.find(
            (o) => o.id === e.selectedResponseId
          );
          return (
            <div key={e.id} className="p-3 border border-white/10 bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-white/40 font-mono">M{e.month}</span>
                <span className={cn("text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 border",
                  SEVERITY_COLORS[e.severity] ?? "border-white/20 text-white/60"
                )}>
                  {PRESSURE_LABELS[e.pressureType] ?? e.pressureType}
                </span>
                <span className="text-white/80 text-xs font-bold ml-1">{e.title}</span>
              </div>
              {responseOpt && (
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 border uppercase", STANCE_COLORS[responseOpt.stance])}>
                    {responseOpt.stance.replace("_", " ")}
                  </span>
                  <span className="text-white/60 text-xs">{responseOpt.title}</span>
                </div>
              )}
              {e.outcomeNarrative && (
                <p className="text-white/50 text-[11px] mt-1 italic">{e.outcomeNarrative}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Board Metrics Panel ──────────────────────────────────────────────────────

function BoardMetricsPanel({ data }: { data: BoardroomPageData }) {
  const { boardroomState } = data;

  function Bar({ value, color }: { value: number; color: string }) {
    return (
      <div className="w-full h-1.5 bg-white/10">
        <div
          className={cn("h-full transition-all", color)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    );
  }

  const metrics = [
    { label: "BOARD CONFIDENCE", value: boardroomState.boardConfidence, color: "bg-cyan-400" },
    { label: "INVESTOR PATIENCE", value: boardroomState.investorPatience, color: "bg-violet-400" },
    { label: "FOUNDER CONTROL", value: boardroomState.founderControl, color: "bg-amber-400" },
    { label: "PRESSURE LEVEL", value: boardroomState.pressureLevel, color: "bg-rose-400" },
  ];

  return (
    <div className="game-card p-5">
      <p className="text-[10px] text-white/40 font-bold tracking-widest uppercase mb-4">
        BOARD DYNAMICS
      </p>
      <div className="space-y-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white/50 font-bold tracking-wider">{m.label}</span>
              <span className="text-[10px] font-mono text-white/70">{m.value}</span>
            </div>
            <Bar value={m.value} color={m.color} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── No Events State ──────────────────────────────────────────────────────────

function NoEventsState({ data }: { data: BoardroomPageData }) {
  const isFinalized = data.startupStatus === "dead" || data.startupStatus === "completed";
  return (
    <div className="game-card p-8 text-center hud-corner">
      <p className="text-white/40 text-sm uppercase tracking-wider font-bold mb-2">
        {isFinalized ? "RUN COMPLETE" : "BOARDROOM CLEAR"}
      </p>
      <p className="text-white/60 text-sm">
        {isFinalized
          ? "This run is over. No open boardroom events."
          : "No open boardroom events. Pressure events trigger when key metrics hit critical thresholds."}
      </p>
      {!isFinalized && (
        <div className="mt-4 grid grid-cols-2 gap-2 max-w-xs mx-auto text-left">
          {[
            "Runway ≤ 2 months",
            "Investor score ≤ 35",
            "Brand risk ≥ 70",
            "Risk score ≥ 85",
            "No revenue by month 6",
            "Burn rate > 3× revenue",
          ].map((trigger) => (
            <span key={trigger} className="text-[10px] text-white/40 font-mono">
              → {trigger}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export function BoardroomClient({
  startupId,
  data,
}: {
  startupId: string;
  data: BoardroomPageData;
}) {
  void startupId;
  const [resolvedNarrative, setResolvedNarrative] = useState<string | null>(null);
  const openEvent = data.boardroomState.currentOpenEvent;
  const history = data.boardroomState.eventHistory;

  return (
    <div className="space-y-5">
      {/* Active event or clear state */}
      {openEvent && !resolvedNarrative ? (
        <OpenEventPanel
          event={openEvent}
          pageData={data}
          onResolved={(n) => setResolvedNarrative(n)}
        />
      ) : (
        <NoEventsState data={data} />
      )}

      {/* Board metrics */}
      <BoardMetricsPanel data={data} />

      {/* History */}
      {history.length > 0 && <HistoryPanel events={history} />}
    </div>
  );
}
