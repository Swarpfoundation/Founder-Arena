"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RewardPopup } from "@/components/game/RewardPopup";
import { EventRevealPanel } from "@/components/game/EventRevealPanel";
import type {
  FounderPlaystyle,
  StrategySignal,
  StrategyStack,
  StrategySynergy,
  FounderArchetypeSummary,
  StrategyLevel,
} from "@/lib/strategy/types";
import { PLAYSTYLE_META } from "@/lib/strategy/strategy-catalog";
import { getRunStepLabel, getShortRunStepLabel } from "@/lib/game-time/time-scale";

// ─── Accent palette by playstyle color ────────────────────────────────────────

const COLOR_CLASSES: Record<string, { border: string; bg: string; text: string; bar: string }> = {
  cyan:    { border: "border-cyan-500/30",    bg: "bg-cyan-500/10",    text: "text-cyan-400",    bar: "bg-cyan-400" },
  violet:  { border: "border-violet-500/30",  bg: "bg-violet-500/10",  text: "text-violet-400",  bar: "bg-violet-400" },
  amber:   { border: "border-amber-500/30",   bg: "bg-amber-500/10",   text: "text-amber-400",   bar: "bg-amber-400" },
  rose:    { border: "border-rose-500/30",    bg: "bg-rose-500/10",    text: "text-rose-400",    bar: "bg-rose-400" },
  emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-400", bar: "bg-emerald-400" },
};

function getColor(playstyle: FounderPlaystyle) {
  const meta = PLAYSTYLE_META[playstyle];
  return COLOR_CLASSES[meta.color] ?? COLOR_CLASSES["cyan"];
}

const LEVEL_BADGE: Record<StrategyLevel, { label: string; cls: string }> = {
  dormant:  { label: "DORMANT",  cls: "text-white/20 border-white/10 bg-white/5" },
  emerging: { label: "EMERGING", cls: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  active:   { label: "ACTIVE",   cls: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
  dominant: { label: "DOMINANT", cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
};

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  value,
  color,
  thresholds = [25, 50, 75],
}: {
  value: number;
  color: string;
  thresholds?: number[];
}) {
  return (
    <div className="relative h-2 bg-white/5 w-full overflow-hidden">
      <div
        className={cn("h-full transition-all duration-500", color)}
        style={{ width: `${Math.min(100, value)}%` }}
      />
      {thresholds.map((t) => (
        <div
          key={t}
          className="absolute top-0 h-full w-px bg-white/20"
          style={{ left: `${t}%` }}
        />
      ))}
    </div>
  );
}

// ─── Stack card ───────────────────────────────────────────────────────────────

function StackCard({
  stack,
  isDominant,
  isSecondary,
}: {
  stack: StrategyStack;
  isDominant: boolean;
  isSecondary: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = PLAYSTYLE_META[stack.playstyle];
  const col = getColor(stack.playstyle);
  const badge = LEVEL_BADGE[stack.level];

  const nextSynergy = stack.synergies.find(
    (s) => !stack.activeSynergies.some((a) => a.id === s.id)
  );
  const nextThreshold = nextSynergy?.unlockLevel === "dominant" ? 75 : 50;

  return (
    <div
      className={cn(
        "game-card hud-corner cursor-pointer transition-all",
        isDominant && "ring-1 ring-amber-400/40",
        isSecondary && "ring-1 ring-cyan-400/20",
        stack.level === "dormant" && "opacity-50"
      )}
      onClick={() => setExpanded((e) => !e)}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">{meta.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white leading-tight">{stack.title}</p>
                {isDominant && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold uppercase tracking-wider">
                    DOMINANT
                  </span>
                )}
                {isSecondary && !isDominant && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold uppercase tracking-wider">
                    SECONDARY
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/40 mt-0.5">{stack.description}</p>
            </div>
          </div>
          <span className={cn("text-[9px] px-2 py-0.5 border font-bold uppercase tracking-wider shrink-0", badge.cls)}>
            {badge.label}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Progress</span>
            <span className={cn("text-xs font-bold", col.text)}>{stack.progress}/100</span>
          </div>
          <ProgressBar value={stack.progress} color={col.bar} />
        </div>

        {/* Active synergies preview */}
        {stack.activeSynergies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {stack.activeSynergies.map((s) => (
              <span key={s.id} className={cn("text-[9px] px-2 py-0.5 border font-bold uppercase tracking-wider", col.border, col.bg, col.text)}>
                {s.title}
              </span>
            ))}
          </div>
        )}

        {/* Next unlock hint */}
        {nextSynergy && stack.level !== "dormant" && (
          <p className="mt-2 text-[10px] text-white/30">
            {nextThreshold - stack.progress > 0
              ? `+${nextThreshold - stack.progress} pts → unlock "${nextSynergy.title}"`
              : `"${nextSynergy.title}" ready to unlock`}
          </p>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/5 p-4 space-y-4">
          {/* Strengths */}
          <div>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2">Strengths</p>
            <ul className="space-y-1">
              {stack.strengths.map((s) => (
                <li key={s} className="text-xs text-white/60 flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-emerald-400 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Trade-offs */}
          {stack.tradeoffs.length > 0 && (
            <div>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-2">Trade-offs</p>
              <ul className="space-y-1">
                {stack.tradeoffs.map((t) => (
                  <li key={t} className="text-xs text-white/60 flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-amber-400 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* All synergies */}
          {stack.synergies.length > 0 && (
            <div>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2">Synergies</p>
              <div className="space-y-2">
                {stack.synergies.map((s) => {
                  const isActive = stack.activeSynergies.some((a) => a.id === s.id);
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "p-2 border",
                        isActive ? `${col.border} ${col.bg}` : "border-white/5 bg-white/2"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", isActive ? col.text : "text-white/30")}>
                          {s.title}
                        </span>
                        <span className={cn("text-[9px] font-bold uppercase", isActive ? "text-emerald-400" : "text-white/20")}>
                          {isActive ? "ACTIVE" : `Needs ${s.unlockLevel === "dominant" ? "75" : "50"}pts`}
                        </span>
                      </div>
                      <p className={cn("text-[10px]", isActive ? "text-white/60" : "text-white/25")}>
                        {s.description}
                      </p>
                      {isActive && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(s.effects).map(([k, v]) =>
                            v ? (
                              <span key={k} className="text-[9px] px-1 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
                                {k.replace(/Delta$/, "").replace(/([A-Z])/g, " $1").trim()}: {(v as number) > 0 ? "+" : ""}{v as number}
                              </span>
                            ) : null
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent signals */}
          {stack.recentSignals.length > 0 && (
            <div>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2">Recent signals</p>
              <div className="space-y-1">
                {stack.recentSignals.slice(0, 3).map((sig) => (
                  <div key={sig.id} className="flex items-start gap-2">
                    <span className="text-[9px] text-white/20 font-mono shrink-0 pt-0.5">{getShortRunStepLabel(sig.month)}</span>
                    <span className="text-[10px] text-white/50">{sig.reason}</span>
                    <span className={cn("ml-auto text-[9px] font-bold shrink-0", col.text)}>+{sig.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Active synergies panel ───────────────────────────────────────────────────

function ActiveSynergiesPanel({ synergies }: { synergies: StrategySynergy[] }) {
  if (synergies.length === 0) {
    return (
      <div className="game-card p-4 hud-corner">
        <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mb-2">Active Synergies</p>
        <p className="text-sm text-white/30">No synergy signal yet. Run another sprint to push a stack toward activation.</p>
      </div>
    );
  }

  return (
    <div className="game-card p-4 hud-corner space-y-3">
      <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
        Active Synergies ({synergies.length})
      </p>
      {synergies.map((s) => {
        const col = getColor(s.playstyle);
        return (
          <div key={s.id} className={cn("p-3 border", col.border, col.bg)}>
            <div className="flex items-center justify-between mb-1">
              <span className={cn("text-xs font-bold uppercase tracking-wider", col.text)}>{s.title}</span>
              <span className="text-[9px] text-white/40 uppercase">{PLAYSTYLE_META[s.playstyle].title}</span>
            </div>
            <p className="text-[10px] text-white/60 mb-2">{s.description}</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(s.effects).map(([k, v]) =>
                v ? (
                  <span key={k} className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
                    {k.replace(/Delta$/, "").replace(/([A-Z])/g, " $1").trim()}: {(v as number) > 0 ? "+" : ""}{v as number}
                  </span>
                ) : null
              )}
            </div>
            {s.tradeoffs.length > 0 && (
              <p className="text-[9px] text-amber-400/70 mt-1">⚠ {s.tradeoffs[0]}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Warnings panel ───────────────────────────────────────────────────────────

function WarningsPanel({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="game-card p-4 hud-corner border-amber-500/30">
      <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-3">
        Strategy Warnings ({warnings.length})
      </p>
      <div className="space-y-2">
        {warnings.map((w, i) => (
          <div key={i} className="flex items-start gap-2 p-2 bg-amber-500/5 border border-amber-500/20">
            <span className="text-amber-400 text-xs shrink-0">⚠</span>
            <p className="text-xs text-amber-200/80">{w}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recommendations panel ────────────────────────────────────────────────────

function RecommendationsPanel({ recs }: { recs: string[] }) {
  if (recs.length === 0) return null;
  return (
    <div className="game-card p-4 hud-corner">
      <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-3">
        Strategic Recommendations
      </p>
      <div className="space-y-2">
        {recs.map((r, i) => (
          <div key={i} className="flex items-start gap-2 p-2 bg-cyan-500/5 border border-cyan-500/15">
            <span className="text-cyan-400 text-xs shrink-0">→</span>
            <p className="text-xs text-white/70">{r}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recent signals feed ──────────────────────────────────────────────────────

function SignalsFeed({ signals }: { signals: StrategySignal[] }) {
  const recent = [...signals].reverse().slice(0, 10);
  if (recent.length === 0) return null;
  return (
    <div className="game-card p-4 hud-corner">
      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-3">
        Recent Strategy Signals
      </p>
      <div className="space-y-1.5">
        {recent.map((sig) => {
          const meta = PLAYSTYLE_META[sig.playstyle];
          const col = getColor(sig.playstyle);
          return (
            <div key={sig.id} className="flex items-start gap-2">
              <span className="text-[9px] text-white/20 font-mono shrink-0 pt-0.5 w-6">{getShortRunStepLabel(sig.month)}</span>
              <span className="text-base leading-none shrink-0">{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-white/60">{sig.reason}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={cn("text-[9px] font-bold", col.text)}>{meta.title.split(" ")[0]}</span>
                <span className={cn("text-[9px] font-mono", col.text)}>+{sig.weight}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Overview panel ───────────────────────────────────────────────────────────

function OverviewPanel({
  dominantPlaystyle,
  secondaryPlaystyles,
  totalSignals,
  currentMonth,
}: {
  dominantPlaystyle: FounderPlaystyle | null;
  secondaryPlaystyles: FounderPlaystyle[];
  totalSignals: number;
  currentMonth: number;
}) {
  const domMeta = dominantPlaystyle ? PLAYSTYLE_META[dominantPlaystyle] : null;
  const domCol = dominantPlaystyle ? getColor(dominantPlaystyle) : null;

  return (
    <div className="game-card p-4 hud-corner">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">
            Founder Archetype
          </p>
          {domMeta && domCol ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{domMeta.icon}</span>
                <h2 className={cn("text-lg font-black tracking-tight", domCol.text)}>
                  {domMeta.title}
                </h2>
              </div>
              <p className="text-sm text-white/60">{domMeta.description}</p>
            </>
          ) : (
            <>
              <p className="text-lg font-black text-white/30 tracking-tight">Undetermined</p>
              <p className="text-sm text-white/40">
                Keep making decisions to form a recognizable founder strategy.
              </p>
            </>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Signals</p>
          <p className="text-xl font-black text-white">{totalSignals}</p>
          <p className="text-[9px] text-white/30">through {getShortRunStepLabel(currentMonth)}</p>
        </div>
      </div>

      {secondaryPlaystyles.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Secondary</p>
          <div className="flex flex-wrap gap-2">
            {secondaryPlaystyles.map((p) => {
              const m = PLAYSTYLE_META[p];
              const c = getColor(p);
              return (
                <span key={p} className={cn("text-[10px] px-2 py-1 border font-bold uppercase tracking-wider flex items-center gap-1", c.border, c.bg, c.text)}>
                  {m.icon} {m.title}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {domMeta && (
        <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Strengths</p>
            {domMeta.strengths.slice(0, 2).map((s) => (
              <p key={s} className="text-[10px] text-white/50">• {s}</p>
            ))}
          </div>
          <div>
            <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider mb-1">Trade-offs</p>
            {domMeta.tradeoffs.slice(0, 2).map((t) => (
              <p key={t} className="text-[10px] text-white/50">• {t}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Archetype run summary (end of run) ──────────────────────────────────────

function ArchetypeSummaryPanel({ summary }: { summary: FounderArchetypeSummary }) {
  const col = summary.dominantPlaystyle ? getColor(summary.dominantPlaystyle) : null;
  return (
    <div className={cn("game-card p-5 hud-corner border-2", col?.border ?? "border-white/10")}>
      <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-3">
        FINAL FOUNDER ARCHETYPE
      </p>
      <h2 className={cn("text-2xl font-black tracking-tight mb-2", col?.text ?? "text-white/60")}>
        {summary.title}
      </h2>
      <p className="text-sm text-white/70 mb-4 leading-relaxed">{summary.finalRunNarrative}</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2">Strengths</p>
          {summary.strengths.map((s) => (
            <p key={s} className="text-xs text-white/60 mb-1">+ {s}</p>
          ))}
        </div>
        <div>
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-2">Trade-offs</p>
          {summary.weaknesses.map((w) => (
            <p key={w} className="text-xs text-white/60 mb-1">− {w}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

interface StrategyClientProps {
  startupId: string;
  startupStatus: string;
  currentMonth: number;
  sector: string;
  signals: StrategySignal[];
  stacks: StrategyStack[];
  dominantPlaystyle: FounderPlaystyle | null;
  secondaryPlaystyles: FounderPlaystyle[];
  activeSynergies: StrategySynergy[];
  warnings: string[];
  recommendations: string[];
  totalSignals: number;
  archetypeSummary: FounderArchetypeSummary | null;
}

export function StrategyClient({
  startupId,
  startupStatus,
  currentMonth,
  signals,
  stacks,
  dominantPlaystyle,
  secondaryPlaystyles,
  activeSynergies,
  warnings,
  recommendations,
  totalSignals,
  archetypeSummary,
}: StrategyClientProps) {
  const isOver = startupStatus === "completed" || startupStatus === "dead";

  // Split stacks: active/emerging first, then dormant
  const visibleStacks = stacks.filter((s) => s.level !== "dormant" || s.progress > 0);
  const dormantStacks = stacks.filter((s) => s.level === "dormant" && s.progress === 0);
  const [showDormant, setShowDormant] = useState(false);

  if (totalSignals === 0) {
    return (
      <div className="space-y-5">
        <div className="game-card p-8 text-center hud-corner border-violet-500/20 bg-violet-500/5">
          <p className="text-violet-400/70 text-[10px] font-black uppercase tracking-[0.32em] mb-2">
            Founder Pattern Unknown
          </p>
          <h2 className="text-lg font-black uppercase tracking-wider text-white mb-2">No Strategy Signals Yet</h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Your founder strategy emerges from the choices you make. Simulate sprints, hire
            team members, take social actions, and counter rivals to unlock a recognizable
            founder archetype.
          </p>
          <Link href={`/startup/${startupId}/operate`} className="mt-5 inline-flex border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-cyan-400 hover:bg-cyan-500/20">
            Generate Signals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* End-of-run archetype panel */}
      {isOver && archetypeSummary && (
        <ArchetypeSummaryPanel summary={archetypeSummary} />
      )}

      {/* Overview */}
      <OverviewPanel
        dominantPlaystyle={dominantPlaystyle}
        secondaryPlaystyles={secondaryPlaystyles}
        totalSignals={totalSignals}
        currentMonth={currentMonth}
      />

      {/* Warnings */}
      {warnings.length > 0 && <WarningsPanel warnings={warnings} />}

      {/* Active synergies */}
      {activeSynergies.length > 0 && (
        <div className="space-y-3">
          <EventRevealPanel
            event={{
              type: "strategy",
              severity: activeSynergies.length > 1 ? "high" : "medium",
              eyebrow: "Strategy Unlock",
              title: "Synergy Online",
              subtitle: `${activeSynergies[0].title} is active. Your playstyle now changes how the run resolves pressure.`,
              accent: "violet",
              primaryCta: { label: "Inspect Synergy", href: `/startup/${startupId}/strategy` },
              affectedStats: [
                { label: "Stack", value: PLAYSTYLE_META[activeSynergies[0].playstyle].title, accent: "violet" },
                { label: "Synergies", value: activeSynergies.length, accent: "amber" },
                { label: "Week", value: getRunStepLabel(currentMonth), accent: "cyan" },
              ],
              displayKey: `strategy:${startupId}:${activeSynergies[0].id}:${currentMonth}`,
            }}
            dismissible
            sessionGuard
          />
          <RewardPopup
            title="Strategy Synergy Online"
            description={`${activeSynergies[0].title} is active. Your playstyle now changes how the run resolves pressure.`}
            accent="amber"
            ctaLabel="Inspect Synergy"
            ctaHref={`/startup/${startupId}/strategy`}
          />
        </div>
      )}
      <ActiveSynergiesPanel synergies={activeSynergies} />

      {/* Strategy stacks */}
      {visibleStacks.length > 0 && (
        <div>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-3">
            Strategy Stacks ({visibleStacks.length})
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {visibleStacks.map((s) => (
              <StackCard
                key={s.playstyle}
                stack={s}
                isDominant={s.playstyle === dominantPlaystyle}
                isSecondary={secondaryPlaystyles.includes(s.playstyle)}
              />
            ))}
          </div>

          {dormantStacks.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowDormant((v) => !v)}
                className="text-[10px] text-white/20 hover:text-white/40 font-bold uppercase tracking-wider transition-colors"
              >
                {showDormant ? "▲ Hide" : "▼ Show"} {dormantStacks.length} dormant strategies
              </button>
              {showDormant && (
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  {dormantStacks.map((s) => (
                    <StackCard
                      key={s.playstyle}
                      stack={s}
                      isDominant={false}
                      isSecondary={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && <RecommendationsPanel recs={recommendations} />}

      {/* Recent signals */}
      <SignalsFeed signals={signals} />
    </div>
  );
}
