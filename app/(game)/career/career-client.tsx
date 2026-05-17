"use client";

import Link from "next/link";
import type { CareerPageData } from "@/lib/actions/career";
import type { FounderRankKey } from "@/lib/career/types";
import { BADGE_CATALOG } from "@/lib/career/badge-catalog";
import { formatRunDuration, getRunStepLabel } from "@/lib/game-time/time-scale";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RANK_COLORS: Record<FounderRankKey, string> = {
  rookie: "text-white/60 border-white/20 bg-white/5",
  builder: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  operator: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  closer: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  veteran: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  arena_legend: "text-amber-300 border-amber-400/60 bg-amber-500/20",
};

const OUTCOME_COLORS: Record<string, string> = {
  BREAKOUT: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  SERIES_A_READY: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  ACQUISITION_TARGET: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  SEED_READY: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  SMALL_PROFITABLE: "text-teal-400 bg-teal-500/10 border-teal-500/30",
  ZOMBIE: "text-white/40 bg-white/5 border-white/10",
  DEAD: "text-rose-400 bg-rose-500/10 border-rose-500/30",
};

const RARITY_COLORS = {
  common: "border-white/20 bg-white/5 text-white/60",
  rare: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  legendary: "border-amber-400/60 bg-amber-500/15 text-amber-300",
};

const PLAYSTYLE_META: Record<string, { title: string; icon: string; color: string }> = {
  product_led: { title: "Product-Led Growth", icon: "⚙", color: "text-cyan-400" },
  enterprise_sales: { title: "Enterprise Sales", icon: "💼", color: "text-violet-400" },
  regulated_operator: { title: "Regulated Operator", icon: "🛡", color: "text-violet-400" },
  technical_builder: { title: "Technical Moat", icon: "🔧", color: "text-cyan-400" },
  hype_machine: { title: "Hype Machine", icon: "⚡", color: "text-amber-400" },
  cockroach: { title: "Cockroach Founder", icon: "🪳", color: "text-rose-400" },
  community_led: { title: "Community-Led", icon: "🤝", color: "text-emerald-400" },
  rival_killer: { title: "Rival Killer", icon: "⚔", color: "text-rose-400" },
  capital_blitzscaler: { title: "Capital Blitzscaler", icon: "💰", color: "text-amber-400" },
  trust_builder: { title: "Trust Builder", icon: "✦", color: "text-emerald-400" },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) return <span className="text-white/30 text-xs">—</span>;
  const cls = OUTCOME_COLORS[outcome] ?? "text-white/40 bg-white/5 border-white/10";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 border uppercase tracking-wider ${cls}`}>
      {outcome.replace(/_/g, " ")}
    </span>
  );
}

function ReputationBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 relative">
        <div
          className="h-full bg-amber-400 transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-bold text-amber-400 tabular-nums w-8 text-right">{score}</span>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-[10px] text-white/30 font-bold tracking-widest uppercase mb-3">
      {label}
    </p>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  accent = "cyan",
}: {
  label: string;
  value: string | number;
  accent?: "cyan" | "amber" | "violet" | "rose" | "emerald";
}) {
  const colorMap = {
    cyan: "text-cyan-400",
    amber: "text-amber-400",
    violet: "text-violet-400",
    rose: "text-rose-400",
    emerald: "text-emerald-400",
  };
  return (
    <div className="game-card p-4 hud-corner">
      <p className="text-[9px] text-white/30 font-bold tracking-wider uppercase mb-1">{label}</p>
      <p className={`text-xl font-black tabular-nums ${colorMap[accent]}`}>{value}</p>
    </div>
  );
}

// ─── Profile Header ───────────────────────────────────────────────────────────

function ProfileHeader({ data }: { data: CareerPageData }) {
  const rankClass = RANK_COLORS[data.founderRank] ?? RANK_COLORS.rookie;
  return (
    <div className="game-card p-6 hud-corner border-amber-500/20">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Identity */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-[10px] font-bold px-3 py-1 border uppercase tracking-widest ${rankClass}`}>
              {data.founderRank.replace(/_/g, " ")}
            </span>
            {data.reputationScore >= 50 && (
              <span className="text-[10px] text-amber-400/60 font-bold tracking-wider">
                REP {data.reputationScore}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-amber-300 tracking-tight">{data.founderTitle}</h2>
          {data.userName && (
            <p className="text-xs text-white/40 mt-1">{data.userName} · {data.userEmail}</p>
          )}
        </div>

        {/* Reputation */}
        <div className="w-full md:w-56">
          <p className="text-[9px] text-white/30 font-bold tracking-wider uppercase mb-1">Reputation Score</p>
          <ReputationBar score={data.reputationScore} />
          <p className="text-[9px] text-white/20 mt-1">
            {data.reputationScore < 100
              ? `${100 - data.reputationScore} pts to cap`
              : "Maximum reputation"}
          </p>
        </div>

        {/* Core stats */}
        <div className="grid grid-cols-3 gap-3 md:w-52">
          <div className="text-center">
            <p className="text-lg font-black text-white tabular-nums">{data.totalStartups}</p>
            <p className="text-[8px] text-white/30 uppercase tracking-wide">Runs</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-emerald-400 tabular-nums">{data.completedStartups}</p>
            <p className="text-[8px] text-white/30 uppercase tracking-wide">Won</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-rose-400 tabular-nums">{data.deadStartups}</p>
            <p className="text-[8px] text-white/30 uppercase tracking-wide">Dead</p>
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div className="mt-4 border-t border-white/5 pt-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Level {data.level} XP</p>
          <p className="text-[9px] text-cyan-400 font-bold tabular-nums">{data.xp} / {data.xpForNextLevel}</p>
        </div>
        <div className="h-1 bg-white/10 relative">
          <div
            className="h-full bg-cyan-400 transition-all"
            style={{ width: `${Math.min(100, Math.round((data.xp / data.xpForNextLevel) * 100))}%` }}
          />
        </div>
      </div>

      {/* Next rank */}
      {data.nextRankLabel && (
        <p className="mt-3 text-[9px] text-white/30">
          <span className="text-amber-400/60 font-bold">NEXT RANK:</span>{" "}
          {data.nextRankLabel} — {data.nextRankRequirement}
        </p>
      )}
    </div>
  );
}

// ─── Career Stats Grid ────────────────────────────────────────────────────────

function CareerStatsGrid({ data }: { data: CareerPageData }) {
  const totalRev = data.totalRevenueGenerated;
  return (
    <div>
      <SectionHeader label="Career Stats" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Breakouts" value={data.totalBreakouts} accent="amber" />
        <StatTile label="Acquisitions" value={data.totalAcquisitions} accent="emerald" />
        <StatTile label="Survived 12 Weeks" value={data.totalSurvived12} accent="cyan" />
        <StatTile label="Survival Rate" value={`${data.survivalRate}%`} accent="violet" />
        <StatTile label="Founder Weeks Played" value={data.totalMonthsPlayed} accent="cyan" />
        <StatTile label="Total Revenue" value={fmt(totalRev)} accent="amber" />
        <StatTile label="Best Score" value={data.bestScore} accent="violet" />
        <StatTile label="Best Valuation" value={fmt(data.bestValuation)} accent="emerald" />
      </div>
    </div>
  );
}

// ─── Best Run Card ────────────────────────────────────────────────────────────

function BestRunCard({ run, data }: { run: CareerPageData["bestRun"]; data: CareerPageData }) {
  if (!run) {
    return (
      <div>
        <SectionHeader label="Best Run" />
        <div className="game-card p-6 hud-corner text-center border-amber-500/20 bg-amber-500/5">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.32em] text-amber-400/60">Legacy Empty</p>
          <p className="text-white/55 text-sm">No completed runs yet. Finish or fail a startup to stamp your first founder record.</p>
          <Link href="/startup/new">
            <div className="mt-4 inline-block px-6 py-2 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold tracking-wider uppercase cursor-pointer hover:bg-cyan-500/20 transition-colors">
              DEPLOY STARTUP
            </div>
          </Link>
        </div>
      </div>
    );
  }
  const ps = run.dominantPlaystyle ? PLAYSTYLE_META[run.dominantPlaystyle] : null;
  return (
    <div>
      <SectionHeader label="Best Run" />
      <div className="game-card p-5 hud-corner border-amber-500/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-black text-white">{run.startupName}</p>
            <p className="text-xs text-white/40 mt-0.5">{run.sector} · {getRunStepLabel(run.monthsSurvived)}</p>
          </div>
          <OutcomeBadge outcome={run.outcome} />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wide">Score</p>
            <p className="text-lg font-black text-amber-400 tabular-nums">{run.score}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wide">Valuation</p>
            <p className="text-lg font-black text-violet-400 tabular-nums">{fmt(run.valuation)}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wide">Revenue</p>
            <p className="text-lg font-black text-emerald-400 tabular-nums">{fmt(run.revenue)}</p>
          </div>
        </div>
        {ps && (
          <div className="mt-3 border-t border-white/5 pt-3 flex items-center gap-2">
            <span className="text-base">{ps.icon}</span>
            <span className={`text-xs font-bold ${ps.color}`}>{ps.title}</span>
          </div>
        )}
        {run.rivalSummary && (
          <p className="mt-2 text-[10px] text-white/30">{run.rivalSummary}</p>
        )}
        <Link href={`/startup/${run.startupId}`}>
          <p className="mt-3 text-[9px] text-cyan-400/60 hover:text-cyan-400 transition-colors uppercase tracking-wider font-bold cursor-pointer">
            View startup →
          </p>
        </Link>
      </div>
    </div>
  );
}

// ─── Playstyle Mastery ────────────────────────────────────────────────────────

function PlaystyleMasteryPanel({ data }: { data: CareerPageData }) {
  const entries = Object.entries(PLAYSTYLE_META).map(([id, meta]) => ({
    id,
    ...meta,
    stat: data.playstyleStats[id],
  }));

  const hasSome = entries.some((e) => e.stat && e.stat.timesDominant > 0);

  return (
    <div>
      <SectionHeader label="Playstyle Mastery" />
      {!hasSome && (
        <div className="game-card p-4 text-center border-violet-500/20 bg-violet-500/5">
          <p className="text-white/45 text-xs">No playstyle pattern detected yet. Sprint decisions, hires, social actions, and boardroom responses will reveal your founder archetype.</p>
        </div>
      )}
      <div className="space-y-2">
        {entries
          .filter((e) => e.stat && e.stat.timesDominant > 0)
          .sort((a, b) => (b.stat?.timesDominant ?? 0) - (a.stat?.timesDominant ?? 0))
          .map((e) => {
            const s = e.stat!;
            return (
              <div key={e.id} className="game-card p-3 flex items-center gap-4">
                <span className="text-lg w-6 text-center">{e.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${e.color}`}>{e.title}</p>
                  <p className="text-[9px] text-white/30">
                    Dominant {s.timesDominant}× · {s.completedRuns} completed · {s.failedRuns} dead
                  </p>
                </div>
                {s.bestOutcome && <OutcomeBadge outcome={s.bestOutcome} />}
                <div className="text-right">
                  <p className="text-xs font-black text-amber-400 tabular-nums">{s.bestScore}</p>
                  <p className="text-[8px] text-white/20">best score</p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── Sector Mastery ───────────────────────────────────────────────────────────

function SectorMasteryPanel({ data }: { data: CareerPageData }) {
  const entries = Object.values(data.sectorStats).sort(
    (a, b) => b.bestScore - a.bestScore
  );
  if (entries.length === 0) {
    return (
      <div>
        <SectionHeader label="Sector Mastery" />
        <div className="game-card p-4 text-center border-cyan-500/20 bg-cyan-500/5">
          <p className="text-white/45 text-xs">No sector mastery yet. Deploy a startup and finish a run to begin comparing markets.</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      <SectionHeader label="Sector Mastery" />
      <div className="space-y-2">
        {entries.map((s) => (
          <div key={s.sector} className="game-card p-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white">{s.sector}</p>
              <p className="text-[9px] text-white/30">
                {s.completed} won · {s.failed} dead · {s.breakoutCount > 0 ? `${s.breakoutCount} breakout` : ""}
              </p>
            </div>
            <OutcomeBadge outcome={s.bestOutcome} />
            <div className="text-right">
              <p className="text-xs font-black text-violet-400 tabular-nums">{fmt(s.bestValuation)}</p>
              <p className="text-[8px] text-white/20">best val.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rival Legacy ─────────────────────────────────────────────────────────────

function RivalLegacyPanel({ data }: { data: CareerPageData }) {
  const r = data.rivalStats;
  return (
    <div>
      <SectionHeader label="Rival Legacy" />
      <div className="game-card p-5 hud-corner">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-black text-white tabular-nums">{r.rivalsFaced}</p>
            <p className="text-[9px] text-white/30 uppercase tracking-wide">Rivals Faced</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-400 tabular-nums">{r.rivalsDefeated}</p>
            <p className="text-[9px] text-white/30 uppercase tracking-wide">Defeated</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-rose-400 tabular-nums">{r.rivalLosses}</p>
            <p className="text-[9px] text-white/30 uppercase tracking-wide">Losses</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-amber-400 tabular-nums">
              {r.rivalsFaced > 0 ? Math.round((r.rivalsDefeated / r.rivalsFaced) * 100) : 0}%
            </p>
            <p className="text-[9px] text-white/30 uppercase tracking-wide">Win Rate</p>
          </div>
        </div>
        {r.mostDangerousRivalName && (
          <p className="text-[10px] text-white/30 border-t border-white/5 pt-3">
            <span className="text-rose-400 font-bold">Most dangerous rival:</span>{" "}
            {r.mostDangerousRivalName}
          </p>
        )}
        {r.rivalsFaced === 0 && (
          <p className="text-white/20 text-xs text-center">No rival encounters yet. Fund a startup and compete.</p>
        )}
      </div>
    </div>
  );
}

// ─── Legacy Badges ────────────────────────────────────────────────────────────

function BadgesWall({ data }: { data: CareerPageData }) {
  const unlockedIds = new Set(data.legacyBadges.map((b) => b.id));

  const unlocked = data.legacyBadges.slice().reverse();
  const locked = BADGE_CATALOG.filter((b) => !unlockedIds.has(b.id));

  return (
    <div>
      <SectionHeader label={`Legacy Badges (${data.legacyBadges.length} / ${BADGE_CATALOG.length})`} />
      {unlocked.length > 0 && (
        <div className="mb-4">
          <p className="text-[9px] text-emerald-400/60 font-bold uppercase tracking-wider mb-2">Unlocked</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {unlocked.map((b) => (
              <div
                key={b.id}
                className={`game-card p-3 border ${RARITY_COLORS[b.rarity]}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{b.icon}</span>
                  <span className="text-xs font-bold">{b.title}</span>
                </div>
                <p className="text-[9px] opacity-60">{b.description}</p>
                <p className="text-[8px] opacity-30 mt-1 uppercase tracking-wider">
                  {b.rarity} · {new Date(b.unlockedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <p className="text-[9px] text-white/20 font-bold uppercase tracking-wider mb-2">Locked</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {locked.map((b) => (
              <div
                key={b.id}
                className="game-card p-3 border border-white/5 opacity-40"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg grayscale">{b.icon}</span>
                  <span className="text-xs font-bold text-white/50">{b.title}</span>
                </div>
                <p className="text-[9px] text-white/30">{b.requirement}</p>
                <p className="text-[8px] text-white/20 mt-1 uppercase tracking-wider">{b.rarity}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Recent Runs Timeline ─────────────────────────────────────────────────────

function RecentRunsTimeline({ data }: { data: CareerPageData }) {
  const runs = data.recentRuns;
  if (runs.length === 0) {
    return (
      <div>
        <SectionHeader label="Recent Runs" />
        <div className="game-card p-4 text-center">
          <p className="text-white/30 text-xs">No runs recorded yet.</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      <SectionHeader label={`Recent Runs (${runs.length})`} />
      <div className="space-y-2">
        {runs.map((run) => {
          const ps = run.dominantPlaystyle ? PLAYSTYLE_META[run.dominantPlaystyle] : null;
          return (
            <Link key={run.startupId} href={`/startup/${run.startupId}`}>
              <div className="game-card p-3 flex items-center gap-4 hover:border-cyan-500/30 transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{run.startupName}</p>
                  <p className="text-[9px] text-white/30">
                    {run.sector} · {run.monthsSurvived}/{formatRunDuration()}
                    {ps ? ` · ${ps.icon} ${ps.title}` : ""}
                  </p>
                </div>
                <OutcomeBadge outcome={run.outcome} />
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-amber-400 tabular-nums">{run.score}</p>
                  <p className="text-[8px] text-white/20">{fmt(run.valuation)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Next Challenge ───────────────────────────────────────────────────────────

function NextChallengePanel({ data }: { data: CareerPageData }) {
  return (
    <div className="game-card p-5 hud-corner border-cyan-500/20">
      <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase mb-2">
        Recommended Next Challenge
      </p>
      <p className="text-sm text-white/80 leading-relaxed">{data.nextChallenge}</p>
      <div className="mt-4 flex items-center gap-3">
        <Link href="/startup/new">
          <div className="inline-block px-5 py-2 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold tracking-wider uppercase cursor-pointer hover:bg-cyan-500/20 transition-colors">
            DEPLOY NEW STARTUP
          </div>
        </Link>
        <Link href="/leaderboard">
          <div className="inline-block px-5 py-2 border border-white/10 text-white/40 text-xs font-bold tracking-wider uppercase cursor-pointer hover:text-white/60 hover:border-white/20 transition-colors">
            RANKINGS
          </div>
        </Link>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function CareerClient({ data }: { data: CareerPageData }) {
  return (
    <div className="space-y-8">
      <ProfileHeader data={data} />
      <CareerStatsGrid data={data} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BestRunCard run={data.bestRun} data={data} />
        <RivalLegacyPanel data={data} />
      </div>

      <PlaystyleMasteryPanel data={data} />
      <SectorMasteryPanel data={data} />
      <BadgesWall data={data} />
      <RecentRunsTimeline data={data} />
      <NextChallengePanel data={data} />
    </div>
  );
}
