import Link from "next/link";
import { Trophy, Medal, Award, Zap, Shield, Swords, Briefcase, Users, TrendingUp, Clock, Star } from "lucide-react";
import { GameCard } from "@/components/game/GameCard";
import { OutcomeBadge } from "@/components/game/OutcomeBadge";
import { cn } from "@/lib/utils";
import { getSectorIcon } from "@/lib/assets";
import { getLeaderboardPageData } from "@/lib/actions/leaderboard";
import type { LeaderboardEntryDisplay, SeasonChallengeProgress, PlayerPositionData, ArenaFeedPublicItem } from "@/lib/seasons/types";

export const dynamic = "force-dynamic";

// ─── Category Tabs ────────────────────────────────────────────────────────────

const CATEGORY_TABS = [
  { key: "overall", label: "Overall", icon: Trophy },
  { key: "revenue", label: "Revenue", icon: TrendingUp },
  { key: "valuation", label: "Valuation", icon: Star },
  { key: "survival", label: "Survival", icon: Clock },
  { key: "ai", label: "AI", icon: Zap },
  { key: "fintech", label: "Fintech", icon: Briefcase },
  { key: "web3", label: "Web3", icon: Shield },
  { key: "gaming", label: "Gaming", icon: Swords },
  { key: "saas", label: "SaaS", icon: Users },
  { key: "healthcare", label: "Health", icon: Shield },
];

// ─── Score label by category ──────────────────────────────────────────────────

function scoreLabel(category: string, entry: LeaderboardEntryDisplay): string {
  if (category === "revenue") return `$${entry.revenue.toLocaleString()}/mo`;
  if (category === "valuation") return `$${entry.valuation.toLocaleString()}`;
  if (category === "survival") return `${entry.survivalMonths} mo`;
  return entry.score.toLocaleString();
}

function scoreSub(category: string, entry: LeaderboardEntryDisplay): string {
  if (category === "revenue") return `${entry.score.toLocaleString()} pts`;
  if (category === "valuation") return `${entry.score.toLocaleString()} pts`;
  if (category === "survival") return `score ${entry.score.toLocaleString()}`;
  return `$${entry.valuation.toLocaleString()} val`;
}

// ─── Corner Borders ───────────────────────────────────────────────────────────

const CornerBorders = () => (
  <>
    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/40 pointer-events-none" />
    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/40 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/40 pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/40 pointer-events-none" />
  </>
);

// ─── Feed Category Color ──────────────────────────────────────────────────────

function feedCategoryStyle(cat: ArenaFeedPublicItem["category"]): string {
  switch (cat) {
    case "leaderboard_move": return "text-cyan-400 border-cyan-500/40";
    case "outcome_achieved": return "text-violet-400 border-violet-500/40";
    case "season_milestone": return "text-amber-400 border-amber-500/40";
    case "rival_defeated": return "text-rose-400 border-rose-500/40";
    case "boardroom_drama": return "text-orange-400 border-orange-500/40";
    default: return "text-white/40 border-white/10";
  }
}

// ─── Challenge Category Icon ──────────────────────────────────────────────────

function challengeIcon(cat: SeasonChallengeProgress["challenge"]["category"]): string {
  switch (cat) {
    case "product": return "⚡";
    case "survival": return "🪳";
    case "rivalry": return "⚔️";
    case "boardroom": return "🎭";
    case "community": return "🛡️";
  }
}

// ─── Page Props ───────────────────────────────────────────────────────────────

interface LeaderboardPageProps {
  searchParams: Promise<{ tab?: string; season?: string }>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { tab = "overall", season = "beta-season-1" } = await searchParams;
  const data = await getLeaderboardPageData(tab, season);

  const topThree = data.entries.slice(0, 3);
  const rest = data.entries.slice(3);

  const rankMeta = [
    { glow: "cyan" as const, icon: Trophy, textClass: "text-cyan-400", label: "1st" },
    { glow: "violet" as const, icon: Medal, textClass: "text-violet-400", label: "2nd" },
    { glow: "emerald" as const, icon: Award, textClass: "text-emerald-400", label: "3rd" },
  ];

  return (
    <div>
      <div className="max-w-7xl mx-auto pt-24 pb-16 px-4 md:px-8">

        {/* Back nav */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-white/40 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Season Banner */}
        <div className="relative border border-cyan-500/20 bg-cyan-500/5 p-5 mb-8 overflow-hidden">
          <CornerBorders />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-[10px] tracking-[0.4em] text-cyan-400/60 uppercase mb-1">
                {data.season.status === "active" ? "ACTIVE SEASON" : "ENDED SEASON"}
              </div>
              <h1 className="text-2xl font-bold text-white text-glow-cyan">
                {data.season.name}
              </h1>
              <p className="text-sm text-white/50 mt-0.5 italic">{data.season.tagline}</p>
            </div>
            <div className="flex flex-col sm:items-end gap-1">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "text-[10px] font-bold tracking-widest uppercase px-2 py-1 border",
                  data.season.status === "active"
                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                    : "border-white/20 text-white/40"
                )}>
                  {data.season.status}
                </div>
              </div>
              <div className="text-xs text-white/30">{data.totalEntries} entries this season</div>
            </div>
          </div>
          {/* Background lore */}
          <div className="mt-3 text-xs text-white/20 italic">{data.season.lore}</div>
        </div>

        {/* Layout: main content + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

          {/* ─── Main Column ─────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2">
              {CATEGORY_TABS.map((cat) => {
                const isActive = data.category === cat.key;
                const CatIcon = cat.icon;
                return (
                  <Link key={cat.key} href={`/leaderboard?tab=${cat.key}&season=${season}`}>
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer",
                      isActive
                        ? "border-cyan-400 bg-cyan-500/10 text-cyan-300"
                        : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/70"
                    )}>
                      <CatIcon className="w-3 h-3" />
                      {cat.label}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Podium + list */}
            {data.entries.length === 0 ? (
              <GameCard>
                <div className="relative p-8 text-center">
                  <CornerBorders />
                  <Trophy className="w-10 h-10 text-white/40 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
                  <p className="text-sm text-white/40 max-w-md mx-auto">
                    No startups have completed the simulation in this category yet. Be the first to reach the leaderboard!
                  </p>
                  <Link href="/startup/new" className="inline-block mt-4">
                    <div className="px-3 py-1.5 border border-cyan-500/40 text-cyan-400 text-xs font-medium hover:bg-cyan-500/10 hover:border-cyan-400 transition-colors cursor-pointer inline-block">
                      Create your startup
                    </div>
                  </Link>
                </div>
              </GameCard>
            ) : (
              <div className="space-y-4">

                {/* Podium */}
                {topThree.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {topThree.map((entry, index) => {
                      const meta = rankMeta[index];
                      const Icon = meta.icon;
                      const href = entry.publicSlug ? `/s/${entry.publicSlug}` : `/startup/${entry.startupId}`;
                      return (
                        <Link key={entry.id} href={href} className="block">
                          <GameCard glow={meta.glow} className="relative h-full flex flex-col items-center text-center hover:scale-[1.02] transition-transform cursor-pointer p-5">
                            <CornerBorders />
                            <Icon className={cn("w-7 h-7 mb-2", meta.textClass)} />
                            <div className={cn("text-2xl font-black mb-1", meta.textClass)}>
                              #{entry.rank}
                            </div>
                            <div className="font-bold text-base leading-tight mb-0.5">
                              {entry.startupName}
                            </div>
                            <div className="text-xs text-white/40 mb-2">
                              by {entry.founderName}
                            </div>
                            {entry.founderTitle && (
                              <div className="text-[10px] text-violet-400/80 mb-2 uppercase tracking-widest">{entry.founderTitle}</div>
                            )}
                            <div className="text-xl font-bold text-white mb-0.5">
                              {scoreLabel(data.category, entry)}
                            </div>
                            <div className="text-xs text-white/30 mb-2">
                              {scoreSub(data.category, entry)}
                            </div>
                            {entry.outcome && (
                              <OutcomeBadge outcome={entry.outcome} className="text-xs px-2.5 py-1" />
                            )}
                            {entry.dominantPlaystyle && (
                              <div className="mt-2 text-[10px] text-white/30 uppercase tracking-widest">
                                {entry.dominantPlaystyle}
                              </div>
                            )}
                          </GameCard>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* List */}
                {rest.length > 0 && (
                  <div className="space-y-1.5">
                    {rest.map((entry) => {
                      const SectorIcon = getSectorIcon(entry.sector);
                      const href = entry.publicSlug ? `/s/${entry.publicSlug}` : `/startup/${entry.startupId}`;
                      return (
                        <Link key={entry.id} href={href} className="block">
                          <GameCard className="relative p-0 hover:bg-secondary/60 transition-colors cursor-pointer">
                            <CornerBorders />
                            <div className="flex items-center gap-4 px-4 py-3">
                              <div className="w-8 text-center font-bold text-white/40 tabular-nums text-sm">
                                {entry.rank}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm truncate">{entry.startupName}</span>
                                  <span className="text-[10px] uppercase tracking-[0.3em] border border-white/10 px-1.5 py-0.5 text-white/40 flex items-center gap-1">
                                    <SectorIcon className="w-2.5 h-2.5" size={10} />
                                    {entry.sector}
                                  </span>
                                  {entry.dominantPlaystyle && (
                                    <span className="text-[10px] text-violet-400/60 hidden sm:inline">{entry.dominantPlaystyle}</span>
                                  )}
                                </div>
                                <div className="text-xs text-white/30 mt-0.5">
                                  by {entry.founderName}
                                  {entry.founderTitle && <span className="text-violet-400/60 ml-1">· {entry.founderTitle}</span>}
                                  {" "}· {entry.survivalMonths} months
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-bold text-sm">{scoreLabel(data.category, entry)}</div>
                                <div className="text-xs text-white/30">{scoreSub(data.category, entry)}</div>
                              </div>
                              {entry.outcome && (
                                <div className="hidden sm:block shrink-0">
                                  <OutcomeBadge outcome={entry.outcome} className="text-xs px-2 py-0.5" />
                                </div>
                              )}
                            </div>
                          </GameCard>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Sidebar ──────────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Create CTA */}
            <div className="text-right">
              <Link href="/startup/new">
                <div className="px-4 py-2 border border-cyan-500/40 text-cyan-400 text-sm font-medium hover:bg-cyan-500/10 hover:border-cyan-400 transition-colors cursor-pointer inline-block">
                  + Enter Arena
                </div>
              </Link>
            </div>

            {/* Player Position */}
            {data.playerPosition ? (
              <div className="relative border border-violet-500/30 bg-violet-500/5 p-4">
                <CornerBorders />
                <div className="text-[10px] tracking-[0.3em] text-violet-400/60 uppercase mb-3">Your Position</div>
                <div className="text-3xl font-black text-violet-300 mb-0.5">
                  #{data.playerPosition.bestRank}
                </div>
                <div className="text-sm text-white/60 mb-1">
                  {data.playerPosition.startupName}
                </div>
                <div className="text-xs text-white/30">
                  Score: {data.playerPosition.bestScore?.toLocaleString()} · {data.playerPosition.category}
                </div>
                {data.playerPosition.outcome && (
                  <div className="mt-2">
                    <OutcomeBadge outcome={data.playerPosition.outcome} className="text-xs px-2 py-0.5" />
                  </div>
                )}
                {data.playerPosition.startupId && (
                  <Link href={`/startup/${data.playerPosition.startupId}`} className="block mt-3">
                    <div className="text-xs text-violet-400/70 hover:text-violet-300 transition-colors">
                      View startup →
                    </div>
                  </Link>
                )}
              </div>
            ) : (
              <div className="relative border border-white/10 p-4">
                <CornerBorders />
                <div className="text-[10px] tracking-[0.3em] text-white/30 uppercase mb-2">Your Position</div>
                <p className="text-xs text-white/30">
                  Complete a run to see where you rank.
                </p>
                <Link href="/startup/new" className="block mt-2">
                  <div className="text-xs text-cyan-400/70 hover:text-cyan-300 transition-colors">
                    Start a run →
                  </div>
                </Link>
              </div>
            )}

            {/* Season Challenges */}
            <div className="relative border border-amber-500/20 bg-amber-500/5 p-4">
              <CornerBorders />
              <div className="text-[10px] tracking-[0.3em] text-amber-400/60 uppercase mb-3">Season Challenges</div>
              <div className="space-y-3">
                {data.season.challenges.map((ch) => {
                  const progress = data.challengeProgress?.find((p) => p.challenge.id === ch.id);
                  const completed = progress?.completed ?? false;
                  const pct = progress?.pct ?? 0;
                  return (
                    <div key={ch.id} className={cn(
                      "relative p-3 border text-xs transition-colors",
                      completed
                        ? "border-amber-500/40 bg-amber-500/10"
                        : "border-white/10"
                    )}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span>{challengeIcon(ch.category)}</span>
                          <span className={cn("font-semibold", completed ? "text-amber-300" : "text-white/70")}>
                            {ch.title}
                          </span>
                        </div>
                        {completed && (
                          <span className="text-amber-400 text-[10px] uppercase tracking-widest shrink-0">Done</span>
                        )}
                      </div>
                      <p className="text-white/30 leading-relaxed mb-2">{ch.description}</p>
                      {progress && !completed && (
                        <div className="mb-1.5">
                          <div className="h-1 bg-white/10 w-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500/60 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-white/30 mt-0.5">
                            {progress.current} / {progress.target}
                          </div>
                        </div>
                      )}
                      <div className="text-amber-400/60 text-[10px]">{ch.reward}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Arena Public Feed */}
            {data.publicFeed.length > 0 && (
              <div className="relative border border-white/10 p-4">
                <CornerBorders />
                <div className="text-[10px] tracking-[0.3em] text-white/30 uppercase mb-3">Arena Feed</div>
                <div className="space-y-2.5">
                  {data.publicFeed.slice(0, 8).map((item) => (
                    <div key={item.id} className={cn(
                      "border-l-2 pl-2 text-xs",
                      item.category === "leaderboard_move" ? "border-cyan-500/40" :
                      item.category === "outcome_achieved" ? "border-violet-500/40" :
                      item.category === "season_milestone" ? "border-amber-500/40" :
                      "border-white/10"
                    )}>
                      <div className={cn(
                        "font-semibold text-[10px] uppercase tracking-widest mb-0.5",
                        feedCategoryStyle(item.category)
                      )}>
                        {item.title}
                      </div>
                      <div className="text-white/40 leading-relaxed">{item.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
