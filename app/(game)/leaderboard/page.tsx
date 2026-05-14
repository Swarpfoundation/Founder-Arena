import Link from "next/link";
import { db } from "@/lib/db";
import { GameCard } from "@/components/game/GameCard";
import { OutcomeBadge } from "@/components/game/OutcomeBadge";
import { isDemoSamplesEnabled, SAMPLE_LEADERBOARD_ENTRIES } from "@/lib/onboarding/demo-samples";

import { cn } from "@/lib/utils";
import { Trophy, Medal, Award } from "lucide-react";
import { getSectorIcon } from "@/lib/assets";

const CATEGORIES = [
  { key: "all", label: "Global" },
  { key: "ai", label: "AI" },
  { key: "fintech", label: "Fintech" },
  { key: "web3", label: "Web3" },
  { key: "gaming", label: "Gaming" },
  { key: "saas", label: "SaaS" },
  { key: "healthcare", label: "Healthcare" },
];


interface LeaderboardPageProps {
  searchParams: Promise<{ category?: string; season?: string }>;
}

const CornerBorders = () => (
  <>
    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/40 pointer-events-none" />
    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/40 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/40 pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/40 pointer-events-none" />
  </>
);

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { category = "all", season = "beta-season-1" } = await searchParams;

  const where: {
    season?: string;
    category?: string;
  } = { season };

  if (category && category !== "all") {
    where.category = category;
  }

  const entries = await db.leaderboardEntry.findMany({
    where,
    orderBy: { score: "desc" },
    take: 50,
    include: {
      startup: {
        include: { user: true },
      },
    },
  });

  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  const rankMeta = [
    { glow: "cyan" as const, icon: Trophy, textClass: "text-cyan-400", label: "1st" },
    { glow: "violet" as const, icon: Medal, textClass: "text-violet-400", label: "2nd" },
    { glow: "emerald" as const, icon: Award, textClass: "text-emerald-400", label: "3rd" },
  ];

  return (
    <div>
      <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 md:px-8">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-white/40 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-cyan-400/40 uppercase mb-2">Global Rankings</div>
            <h1 className="text-3xl font-bold text-white text-glow-cyan">Leaderboard</h1>
            <p className="text-white/40 mt-1">Top performing startups in Founder Arena.</p>
          </div>
          <Link href="/startup/new">
            <div className="px-4 py-2 border border-cyan-500/40 text-cyan-400 text-sm font-medium hover:bg-cyan-500/10 hover:border-cyan-400 transition-colors cursor-pointer">
              Create Startup
            </div>
          </Link>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.key;
            return (
              <Link
                key={cat.key}
                href={`/leaderboard?category=${cat.key}&season=${season}`}
              >
                <div className={cn(
                  "px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer",
                  isActive
                    ? "border-cyan-400 bg-cyan-500/10 text-cyan-300"
                    : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/70"
                )}>
                  {cat.label}
                </div>
              </Link>
            );
          })}
        </div>

        {entries.length === 0 ? (
          <div className="space-y-6">
            <GameCard >
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

            {isDemoSamplesEnabled() && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] uppercase tracking-[0.4em] border border-white/10 px-2 py-1 text-white/40">Example</span>
                  <span className="text-xs text-white/40">What leaderboard entries look like</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-70">
                  {SAMPLE_LEADERBOARD_ENTRIES.slice(0, 3).map((entry, index) => {
                    const rankMetaFallback = [
                      { glow: "cyan" as const, icon: Trophy, textClass: "text-cyan-400", label: "1st" },
                      { glow: "violet" as const, icon: Medal, textClass: "text-violet-400", label: "2nd" },
                      { glow: "emerald" as const, icon: Award, textClass: "text-emerald-400", label: "3rd" },
                    ];
                    const meta = rankMetaFallback[index] ?? rankMetaFallback[0];
                    const Icon = meta.icon;
                    return (
                      <GameCard
                        key={entry.name}
                        glow={meta.glow}
                        className="relative h-full flex flex-col items-center text-center"
                      >
                        <CornerBorders />
                        <Icon className={cn("w-8 h-8 mb-3", meta.textClass)} />
                        <div className={cn("text-2xl font-black mb-1", meta.textClass)}>
                          #{index + 1}
                        </div>
                        <div className="font-bold text-lg leading-tight mb-1">
                          {entry.name}
                        </div>
                        <div className="text-xs text-white/40 mb-3">
                          by {entry.founderName}
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {entry.score.toLocaleString()}
                        </div>
                        <div className="text-xs text-white/40 mb-2">
                          ${entry.valuation.toLocaleString()} val
                        </div>
                        <OutcomeBadge outcome={entry.outcome} className="text-xs px-2.5 py-1" />
                      </GameCard>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Podium */}
            {topThree.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {topThree.map((entry, index) => {
                  const meta = rankMeta[index];
                  const Icon = meta.icon;
                  return (
                    <Link
                      key={entry.id}
                      href={entry.startup.publicSlug ? `/s/${entry.startup.publicSlug}` : `/startup/${entry.startupId}`}
                      className="block"
                    >
                      <GameCard
                        glow={meta.glow}
                        className="relative h-full flex flex-col items-center text-center hover:scale-[1.02] transition-transform cursor-pointer"
                      >
                        <CornerBorders />
                        <Icon className={cn("w-8 h-8 mb-3", meta.textClass)} />
                        <div className={cn("text-2xl font-black mb-1", meta.textClass)}>
                          #{index + 1}
                        </div>
                        <div className="font-bold text-lg leading-tight mb-1">
                          {entry.startup.name}
                        </div>
                        <div className="text-xs text-white/40 mb-3">
                          by {entry.startup.user.name ?? "Unknown Founder"}
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {entry.score.toLocaleString()}
                        </div>
                        <div className="text-xs text-white/40 mb-2">
                          ${entry.valuation.toLocaleString()} val
                        </div>
                        {entry.outcome && (
                          <OutcomeBadge outcome={entry.outcome} className="text-xs px-2.5 py-1" />
                        )}
                      </GameCard>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* List */}
            {rest.length > 0 && (
              <div className="space-y-2">
                {rest.map((entry, index) => {
                  const rank = index + 4;
                  return (
                    <Link
                      key={entry.id}
                      href={entry.startup.publicSlug ? `/s/${entry.startup.publicSlug}` : `/startup/${entry.startupId}`}
                      className="block"
                    >
                      <GameCard
                        className="relative p-0 hover:bg-secondary/60 transition-colors cursor-pointer"
                      >
                        <CornerBorders />
                        <div className="flex items-center gap-4 px-4 py-3">
                          <div className="w-10 text-center font-bold text-white/40 tabular-nums">
                            {rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold truncate">{entry.startup.name}</span>
                              <span className="text-[10px] uppercase tracking-[0.4em] border border-white/10 px-2 py-0.5 text-white/40 flex items-center gap-1">
                                {(() => {
                                  const SectorIcon = getSectorIcon(entry.startup.sector);
                                  return <SectorIcon className="w-3 h-3" size={12} />;
                                })()}
                                {entry.startup.sector}
                              </span>
                            </div>
                            <div className="text-xs text-white/40 mt-0.5">
                              by {entry.startup.user.name ?? "Unknown Founder"} • {entry.survivalMonths} months
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold">{entry.score.toLocaleString()}</div>
                            <div className="text-xs text-white/40">
                              ${entry.valuation.toLocaleString()} val
                            </div>
                          </div>
                          {entry.outcome && (
                            <div className="hidden sm:block shrink-0">
                              <OutcomeBadge outcome={entry.outcome} className="text-xs px-2.5 py-1" />
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
    </div>
  );
}
