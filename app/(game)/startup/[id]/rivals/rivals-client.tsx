"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Skull,
  Flame,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Swords,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  RivalStartup,
  RivalMove,
  CounterActionAvailability,
  RivalRunComparison,
  RivalArchetype,
  RivalRelationship,
} from "@/lib/rivals/types";
import { performCounterAction } from "@/lib/actions/rivals";
import { cn } from "@/lib/utils";

interface Props {
  startupId: string;
  rivals: RivalStartup[];
  moveHistory: RivalMove[];
  availableCounterActions: CounterActionAvailability[];
  comparison: RivalRunComparison | null;
  startupStatus: string;
  currentMonth: number;
  sector: string;
}

// ─── Archetype display metadata ───────────────────────────────────────────────

const ARCHETYPE_META: Record<RivalArchetype, { label: string; color: string; icon: string }> = {
  copycat:             { label: "COPYCAT",       color: "text-amber-400",   icon: "📋" },
  hype_founder:        { label: "HYPE FOUNDER",  color: "text-pink-400",    icon: "📣" },
  enterprise_killer:   { label: "ENTERPRISE",    color: "text-blue-400",    icon: "🏢" },
  technical_genius:    { label: "TECH GENIUS",   color: "text-cyan-400",    icon: "⚙️" },
  predator_vc_backed:  { label: "VC PREDATOR",   color: "text-violet-400",  icon: "💰" },
  community_builder:   { label: "COMMUNITY",     color: "text-emerald-400", icon: "🌐" },
  regulatory_operator: { label: "REGULATOR",     color: "text-slate-300",   icon: "🛡️" },
  chaos_founder:       { label: "CHAOS",         color: "text-rose-400",    icon: "⚡" },
};

// ─── Relationship display ─────────────────────────────────────────────────────

const RELATIONSHIP_META: Record<RivalRelationship, { label: string; color: string }> = {
  neutral:   { label: "NEUTRAL",   color: "text-white/40" },
  friendly:  { label: "FRIENDLY",  color: "text-emerald-400" },
  tense:     { label: "TENSE",     color: "text-amber-400" },
  hostile:   { label: "HOSTILE",   color: "text-rose-400" },
  feared:    { label: "FEARED",    color: "text-rose-600" },
  respected: { label: "RESPECTED", color: "text-cyan-400" },
  defeated:  { label: "DEFEATED",  color: "text-white/20" },
};

// ─── Threat level ─────────────────────────────────────────────────────────────

function threatLevel(rival: RivalStartup): { label: string; color: string; bg: string } {
  if (rival.isDefeated) return { label: "ELIMINATED", color: "text-white/20", bg: "bg-white/5" };
  const score = rival.rivalryScore + rival.hype * 0.3 + rival.traction * 0.3;
  if (score > 80)  return { label: "CRITICAL",  color: "text-rose-400",    bg: "bg-rose-500/10" };
  if (score > 50)  return { label: "HIGH",      color: "text-amber-400",   bg: "bg-amber-500/10" };
  if (score > 25)  return { label: "MODERATE",  color: "text-yellow-400",  bg: "bg-yellow-500/10" };
  return              { label: "LOW",         color: "text-emerald-400", bg: "bg-emerald-500/10" };
}

// ─── Mini stat bar ────────────────────────────────────────────────────────────

function StatBar({
  label,
  value,
  color = "cyan",
}: {
  label: string;
  value: number;
  color?: "cyan" | "violet" | "rose" | "amber" | "emerald";
}) {
  const colorMap = {
    cyan:    "bg-cyan-400",
    violet:  "bg-violet-400",
    rose:    "bg-rose-400",
    amber:   "bg-amber-400",
    emerald: "bg-emerald-400",
  };
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-[9px] text-white/30 uppercase tracking-wider">{label}</span>
        <span className="text-[9px] text-white/60">{value}</span>
      </div>
      <div className="h-0.5 bg-white/5">
        <div
          className={cn("h-full transition-all", colorMap[color])}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

// ─── Rival card ───────────────────────────────────────────────────────────────

function RivalCard({
  rival,
  isExpanded,
  onToggle,
}: {
  rival: RivalStartup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const arch = ARCHETYPE_META[rival.founder.archetype];
  const rel = RELATIONSHIP_META[rival.relationshipToPlayer];
  const threat = threatLevel(rival);

  return (
    <div
      className={cn(
        "game-card hud-corner transition-all",
        rival.isDefeated && "opacity-40"
      )}
    >
      {/* Card header */}
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{arch.icon}</span>
              <span className={cn("text-[10px] font-bold tracking-widest uppercase", arch.color)}>
                {arch.label}
              </span>
              <span
                className={cn(
                  "ml-auto text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest",
                  threat.color,
                  threat.bg
                )}
              >
                {threat.label}
              </span>
            </div>
            <h3 className="text-base font-black text-white tracking-tight">{rival.name}</h3>
            <p className={cn("text-[10px] uppercase tracking-widest", rel.color)}>
              {rival.founder.name} · {rel.label}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] text-white/30">RIVALRY</span>
            <span
              className={cn(
                "text-xl font-black",
                rival.rivalryScore > 60 ? "text-rose-400" :
                rival.rivalryScore > 30 ? "text-amber-400" : "text-white/40"
              )}
            >
              {rival.rivalryScore}
            </span>
            <button className="text-white/30 hover:text-white/60 transition-colors">
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Latest move badge */}
        {rival.latestMoveTitle && (
          <div className="mt-2 flex items-center gap-2 text-[10px] text-white/40 border border-white/5 bg-white/3 px-2 py-1">
            <Swords className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Month {rival.latestMoveMonth}: {rival.latestMoveTitle}</span>
          </div>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <StatBar label="Product" value={rival.productProgress} color="cyan" />
            <StatBar label="Traction" value={rival.traction} color="violet" />
            <StatBar label="Hype" value={rival.hype} color="amber" />
            <StatBar label="Trust" value={rival.trust} color="emerald" />
            <StatBar label="Investor Heat" value={rival.investorHeat} color="violet" />
            <StatBar label="Risk" value={rival.risk} color="rose" />
          </div>

          {/* Financial estimates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/3 border border-white/5 p-2">
              <div className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Revenue Est.</div>
              <div className="text-xs font-bold text-white">${rival.revenueEstimate.toLocaleString()}/mo</div>
            </div>
            <div className="bg-white/3 border border-white/5 p-2">
              <div className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Valuation Est.</div>
              <div className="text-xs font-bold text-white">${(rival.valuationEstimate / 1000).toFixed(0)}K</div>
            </div>
          </div>

          {/* Funding status */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/30 uppercase tracking-wider">Funding:</span>
            <span className="text-[10px] font-bold text-cyan-400 uppercase">{rival.fundingStatus.replace(/_/g, " ")}</span>
            <span className="text-[9px] text-white/30 ml-auto">Stage: {rival.stage}</span>
          </div>

          {/* Catchphrase */}
          {rival.founder.catchphrase && (
            <blockquote className="border-l-2 border-white/10 pl-3 italic text-[10px] text-white/40">
              &quot;{rival.founder.catchphrase}&quot;
              <span className="not-italic text-white/20 ml-2">— {rival.founder.name}</span>
            </blockquote>
          )}

          {/* Narrative tags */}
          {rival.activeNarrativeTags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {rival.activeNarrativeTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-2 py-0.5 border border-white/10 text-white/30 uppercase tracking-widest"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Recent rival moves feed ──────────────────────────────────────────────────

function RivalMovesFeed({ moves }: { moves: RivalMove[] }) {
  const recent = [...moves].reverse().slice(0, 8);
  if (recent.length === 0) return null;

  return (
    <div className="game-card p-4 hud-corner">
      <div className="flex items-center gap-2 mb-4">
        <Swords className="w-4 h-4 text-rose-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Latest Rival Moves</h3>
      </div>
      <div className="space-y-2">
        {recent.map((move) => (
          <div
            key={move.id}
            className={cn(
              "border-l-2 pl-3 py-1",
              move.severity === "critical" ? "border-rose-500/60" :
              move.severity === "warning"  ? "border-amber-500/60" :
              move.severity === "positive" ? "border-emerald-500/60" :
              "border-white/10"
            )}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] text-white/30 uppercase tracking-widest">Mo. {move.month}</span>
              <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">
                {move.rivalName}
              </span>
              <span
                className={cn(
                  "ml-auto text-[9px] uppercase tracking-widest font-bold",
                  move.severity === "critical" ? "text-rose-400" :
                  move.severity === "warning"  ? "text-amber-400" :
                  move.severity === "positive" ? "text-emerald-400" :
                  "text-white/30"
                )}
              >
                {move.severity}
              </span>
            </div>
            <p className="text-[10px] text-white font-bold">{move.title}</p>
            <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{move.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Counter-action panel ─────────────────────────────────────────────────────

function CounterActionsPanel({
  actions,
  startupId,
  onResult,
}: {
  actions: CounterActionAvailability[];
  startupId: string;
  onResult: (msg: string, ok: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);

  function execute(actionId: string) {
    startTransition(async () => {
      const result = await performCounterAction(startupId, actionId);
      setConfirming(null);
      onResult(result.message, result.success);
    });
  }

  const available = actions.filter((a) => a.available);
  const locked = actions.filter((a) => !a.available);

  return (
    <div className="game-card p-4 hud-corner">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Counter-Actions</h3>
        <span className="ml-auto text-[9px] text-white/30 uppercase">
          {available.length} available
        </span>
      </div>

      <div className="space-y-2">
        {available.map(({ action }) => (
          <div key={action.id} className="border border-white/10 bg-white/3 p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <span className="text-[10px] font-bold text-white">{action.title}</span>
                <span
                  className={cn(
                    "ml-2 text-[9px] uppercase tracking-widest",
                    action.riskLevel === "high"   ? "text-rose-400" :
                    action.riskLevel === "medium" ? "text-amber-400" :
                    "text-emerald-400"
                  )}
                >
                  {action.riskLevel} risk
                </span>
              </div>
              <span className="text-[9px] text-white/40 whitespace-nowrap">
                {action.cost > 0 ? `$${action.cost.toLocaleString()}` : "FREE"}
              </span>
            </div>
            <p className="text-[10px] text-white/40 mb-2">{action.description}</p>

            {/* Effect preview */}
            <div className="flex flex-wrap gap-1 mb-2">
              {action.effects.socialTrustDelta && (
                <span className={cn("text-[9px] px-1.5 py-0.5 border",
                  action.effects.socialTrustDelta > 0 ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : "border-rose-500/30 text-rose-400 bg-rose-500/5"
                )}>
                  Trust {action.effects.socialTrustDelta > 0 ? "+" : ""}{action.effects.socialTrustDelta}
                </span>
              )}
              {action.effects.brandRiskDelta && (
                <span className={cn("text-[9px] px-1.5 py-0.5 border",
                  action.effects.brandRiskDelta < 0 ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : "border-rose-500/30 text-rose-400 bg-rose-500/5"
                )}>
                  Brand Risk {action.effects.brandRiskDelta > 0 ? "+" : ""}{action.effects.brandRiskDelta}
                </span>
              )}
              {action.effects.socialHypeDelta && (
                <span className="text-[9px] px-1.5 py-0.5 border border-amber-500/30 text-amber-400 bg-amber-500/5">
                  Hype {action.effects.socialHypeDelta > 0 ? "+" : ""}{action.effects.socialHypeDelta}
                </span>
              )}
              {action.effects.revenueDelta && (
                <span className={cn("text-[9px] px-1.5 py-0.5 border",
                  action.effects.revenueDelta > 0 ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : "border-rose-500/30 text-rose-400 bg-rose-500/5"
                )}>
                  Rev {action.effects.revenueDelta > 0 ? "+" : ""}${Math.abs(action.effects.revenueDelta).toLocaleString()}
                </span>
              )}
              {action.effects.rivalryScoreReduction && (
                <span className="text-[9px] px-1.5 py-0.5 border border-cyan-500/30 text-cyan-400 bg-cyan-500/5">
                  Rivalry −{action.effects.rivalryScoreReduction}
                </span>
              )}
            </div>

            {confirming === action.id ? (
              <div className="flex gap-2">
                <button
                  onClick={() => execute(action.id)}
                  disabled={isPending}
                  className="flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-colors disabled:opacity-50"
                >
                  {isPending ? "EXECUTING..." : "CONFIRM"}
                </button>
                <button
                  onClick={() => setConfirming(null)}
                  disabled={isPending}
                  className="flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(action.id)}
                disabled={isPending}
                className="w-full py-1.5 text-[9px] font-bold uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
              >
                EXECUTE
              </button>
            )}
          </div>
        ))}

        {/* Locked actions */}
        {locked.map(({ action, reason }) => (
          <div key={action.id} className="border border-white/5 p-3 opacity-40">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-white/50">{action.title}</span>
              <span className="text-[9px] text-white/20 ml-auto">LOCKED</span>
            </div>
            <p className="text-[9px] text-white/30">{reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Final comparison ─────────────────────────────────────────────────────────

function RunComparison({ comparison }: { comparison: RivalRunComparison }) {
  return (
    <div className="game-card p-4 hud-corner">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-violet-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Arena — Final Standings</h3>
      </div>

      {/* Player row */}
      <div className="flex items-center justify-between p-3 border border-cyan-500/20 bg-cyan-500/5 mb-3">
        <div>
          <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">YOU</span>
          <div className="text-sm font-black text-white mt-0.5">{comparison.playerOutcome}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/40">Valuation</div>
          <div className="text-sm font-bold text-cyan-400">${(comparison.playerValuation / 1000).toFixed(0)}K</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/40">Revenue</div>
          <div className="text-sm font-bold text-cyan-400">${comparison.playerRevenue.toLocaleString()}/mo</div>
        </div>
      </div>

      {/* Rival rows */}
      {comparison.rivals.map((entry) => (
        <div
          key={entry.id}
          className={cn(
            "flex items-start gap-3 p-3 border mb-2",
            entry.playerWon
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-rose-500/20 bg-rose-500/5"
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {entry.playerWon
                ? <TrendingDown className="w-3 h-3 text-emerald-400" />
                : <TrendingUp className="w-3 h-3 text-rose-400" />
              }
              <span className="text-[10px] font-bold text-white">{entry.name}</span>
              <span className={cn(
                "text-[9px] ml-auto",
                ARCHETYPE_META[entry.archetype].color
              )}>
                {ARCHETYPE_META[entry.archetype].label}
              </span>
            </div>
            <p className="text-[10px] text-white/40 leading-tight">{entry.summary}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[9px] text-white/30">Val.</div>
            <div className="text-[10px] font-bold text-white/60">
              ${(entry.finalValuation / 1000).toFixed(0)}K
            </div>
          </div>
        </div>
      ))}

      {/* Overall summary */}
      <div className="mt-3 border-t border-white/5 pt-3">
        <p className="text-[11px] text-white/60 italic">{comparison.overallSummary}</p>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function NoRivalsYet({ currentMonth }: { currentMonth: number }) {
  return (
    <div className="game-card p-8 text-center hud-corner">
      <Skull className="w-8 h-8 text-white/20 mx-auto mb-3" />
      <p className="text-white/40 text-sm uppercase tracking-wider font-bold mb-2">
        No Rivals Detected
      </p>
      <p className="text-white/30 text-xs max-w-sm mx-auto">
        {currentMonth === 0
          ? "Rivals are generated when your first simulation month runs. Advance the simulation to encounter your competitors."
          : "Rivals will emerge once your startup gains traction. Keep operating."}
      </p>
    </div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────

export function RivalsClient({
  startupId,
  rivals,
  moveHistory,
  availableCounterActions,
  comparison,
  startupStatus,
  currentMonth,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isRunOver = startupStatus === "completed" || startupStatus === "dead";

  function handleCounterResult(message: string, ok: boolean) {
    if (ok) {
      toast.success(message);
    } else {
      toast.error(message);
    }
  }

  return (
    <div className="space-y-5">
      {/* Active run: threat summary bar */}
      {!isRunOver && rivals.length > 0 && (
        <div className="game-card p-4 hud-corner">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span className="text-[10px] text-white/40 uppercase tracking-widest">Threat Status</span>
            </div>
            {rivals.map((r) => {
              const threat = threatLevel(r);
              return (
                <div key={r.id} className="flex items-center gap-1.5">
                  <span className={cn("text-[10px] font-bold", threat.color)}>{r.name}</span>
                  <span className={cn("text-[9px] px-1.5 py-0.5", threat.bg, threat.color, "uppercase tracking-wider")}>
                    {threat.label}
                  </span>
                </div>
              );
            })}
            <div className="ml-auto flex items-center gap-1 text-[9px] text-white/30">
              <AlertTriangle className="w-3 h-3" />
              <span>Rivals act each month during simulation</span>
            </div>
          </div>
        </div>
      )}

      {/* Rival cards */}
      {rivals.length === 0 ? (
        <NoRivalsYet currentMonth={currentMonth} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rivals.map((rival) => (
            <RivalCard
              key={rival.id}
              rival={rival}
              isExpanded={expandedId === rival.id}
              onToggle={() => setExpandedId(expandedId === rival.id ? null : rival.id)}
            />
          ))}
        </div>
      )}

      {/* Recent rival moves */}
      {moveHistory.length > 0 && <RivalMovesFeed moves={moveHistory} />}

      {/* Counter-actions — only during active run */}
      {!isRunOver && rivals.length > 0 && (
        <CounterActionsPanel
          actions={availableCounterActions}
          startupId={startupId}
          onResult={handleCounterResult}
        />
      )}

      {/* Final comparison — end of run */}
      {isRunOver && comparison && <RunComparison comparison={comparison} />}

      {/* End-of-run CTA when no comparison yet */}
      {isRunOver && !comparison && rivals.length === 0 && (
        <div className="game-card p-6 text-center hud-corner">
          <CheckCircle2 className="w-6 h-6 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-xs">No rival data recorded for this run.</p>
        </div>
      )}

      {/* Info footer */}
      <div className="flex items-start gap-2 text-[10px] text-white/20">
        <Zap className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <p>
          Rivals make moves automatically each month during simulation. Social actions influence rival behavior.
          Counter-actions cost cash and affect your social metrics and rival rivalry scores.
        </p>
      </div>
    </div>
  );
}
