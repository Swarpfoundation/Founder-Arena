import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicFounderProfileBySlug } from "@/lib/public/public-profile";
import { GameCard } from "@/components/game/GameCard";
import { MetricPanel } from "@/components/game/MetricPanel";
import { LevelBadge } from "@/components/game/LevelBadge";
import { SectionHeader } from "@/components/game/SectionHeader";
import { OutcomeBadge } from "@/components/game/OutcomeBadge";
import { StatusBadge } from "@/components/game/StatusBadge";
import { ShareButtons } from "@/components/social/ShareButtons";
import { generateShareText } from "@/lib/social/share-text";

import {
  Target,
  Award,
  Rocket,
} from "lucide-react";
import { getSectorIcon, getAchievementIcon } from "@/lib/assets";
import { getAchievementTier, getTierBadgeClass } from "@/lib/assets/achievement-tier";
import { cn } from "@/lib/utils";
import {
  MetricTrophyIcon,
  MetricValuationIcon,
  OutcomeDeadIcon,
  AchievementFirstPitchIcon,
} from "@/components/assets";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicFounderProfileBySlug(slug);

  if (!profile) {
    return { title: "Founder Not Found | Founder Arena" };
  }

  const title = `${profile.displayName} — Level ${profile.level} Founder | Founder Arena`;
  const description = `Founder Arena profile: ${profile.totalStartups} ventures, best score ${profile.bestScore.toLocaleString()}, best valuation $${profile.bestValuation.toLocaleString()}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary", title, description },
  };
}

export default async function PublicFounderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPublicFounderProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://founder-arena.vercel.app"}/f/${slug}`;
  const shareText = generateShareText(
    {
      type: "founder_profile",
      name: profile.displayName,
      level: profile.level,
      bestScore: profile.bestScore,
      totalStartups: profile.totalStartups,
    },
    profileUrl
  );

  return (
    <div>
      <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 md:px-8">
        <div className="mb-6">
          <Link href="/" className="text-sm text-white/40 hover:text-white">
            ← Founder Arena
          </Link>
        </div>

        {/* Header */}
        <GameCard glow="violet" className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <LevelBadge level={profile.level} size="lg" />
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                {profile.displayName}
              </h1>
              <p className="text-white/40 mt-1">
                Level {profile.level} Founder • {profile.totalStartups} venture
                {profile.totalStartups !== 1 ? "s" : ""} started
              </p>
            </div>
          </div>
        </GameCard>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-10">
          <MetricPanel label="Total Startups" value={profile.totalStartups} icon={<Rocket className="w-4 h-4" />} />
          <MetricPanel label="Completed" value={profile.completedStartups} icon={<Target className="w-4 h-4" />} />
          <MetricPanel label="Dead" value={profile.deadStartups} icon={<OutcomeDeadIcon className="w-4 h-4" size={16} />} />
          <MetricPanel label="Best Score" value={profile.bestScore.toLocaleString()} icon={<MetricTrophyIcon className="w-4 h-4" size={16} />} />
          <MetricPanel label="Best Valuation" value={`$${profile.bestValuation.toLocaleString()}`} icon={<MetricValuationIcon className="w-4 h-4" size={16} />} />
          <MetricPanel label="Achievements" value={profile.achievements.length} icon={<AchievementFirstPitchIcon className="w-4 h-4" size={16} />} />
        </div>

        {/* Share */}
        <div className="mb-10">
          <ShareButtons url={profileUrl} shareText={shareText} />
        </div>

        {/* Achievements */}
        {profile.achievements.length > 0 ? (
          <div className="mb-10">
            <SectionHeader title="Achievements" subtitle="Milestones unlocked" accent="violet" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profile.achievements.map((ach) => (
                <GameCard key={ach.key} >
                  <div className="flex items-start gap-4">
                    {(() => {
                      const Icon = getAchievementIcon(ach.key);
                      return <Icon className="w-8 h-8 text-violet-400 shrink-0" size={32} />;
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white">{ach.title}</h3>
                        {(() => {
                          const tier = getAchievementTier(ach.key);
                          return (
                            <span className={cn("text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border", getTierBadgeClass(tier))}>
                              {tier}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">
                        Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-white/40 mt-2">{ach.description}</p>
                    </div>
                  </div>
                </GameCard>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-10">
            <SectionHeader title="Achievements" subtitle="Milestones unlocked" accent="violet" />
            <GameCard className="text-center py-8">
              <Award className="w-8 h-8 text-white/40 mx-auto mb-3" />
              <p className="text-sm text-white/40">No public achievements yet.</p>
            </GameCard>
          </div>
        )}

        {/* Startup History */}
        {profile.startups.length > 0 ? (
          <div className="mb-10">
            <SectionHeader title="Startup History" subtitle="Public ventures" accent="cyan" />
            <div className="space-y-3">
              {profile.startups.map((startup) => (
                <Link
                  key={startup.name + startup.publicSlug}
                  href={startup.publicSlug ? `/s/${startup.publicSlug}` : "#"}
                  className="block group"
                >
                  <GameCard className="group-hover:-translate-y-0.5 transition-transform">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-white">{startup.name}</span>
                          <span className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white/60 capitalize">
                            {(() => {
                              const SectorIcon = getSectorIcon(startup.sector);
                              return <SectorIcon className="w-3 h-3 text-cyan-400" size={12} />;
                            })()}
                            {startup.sector}
                          </span>
                          <StatusBadge status={startup.status} />
                          {startup.finalOutcome && <OutcomeBadge outcome={startup.finalOutcome} />}
                        </div>
                        <div className="text-xs text-white/40 mt-1">
                          {startup.monthsSurvived} months • Score: {startup.finalScore ?? "—"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">${startup.valuation.toLocaleString()}</div>
                        <div className="text-xs text-white/40">valuation</div>
                      </div>
                    </div>
                  </GameCard>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-10">
            <SectionHeader title="Startup History" subtitle="Public ventures" accent="cyan" />
            <GameCard className="text-center py-8">
              <Rocket className="w-8 h-8 text-white/40 mx-auto mb-3" />
              <p className="text-sm text-white/40">No public startups yet.</p>
            </GameCard>
          </div>
        )}

        {/* Leaderboard Placements */}
        {profile.leaderboardEntries.length > 0 ? (
          <div className="mb-10">
            <SectionHeader title="Leaderboard Placements" subtitle="Top scoring runs" accent="violet" />
            <div className="grid gap-4 md:grid-cols-2">
              {profile.leaderboardEntries.map((entry, index) => (
                <GameCard key={`${entry.startupName}-${index}`} glow="violet" >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-white text-sm">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate">{entry.startupName}</h4>
                      <div className="text-xs text-white/40 mt-0.5">
                        {entry.category} • {entry.season} • {entry.survivalMonths} months
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">{entry.score.toLocaleString()}</div>
                      {entry.outcome && <OutcomeBadge outcome={entry.outcome} className="text-xs px-2 py-0.5 mt-1" />}
                    </div>
                  </div>
                </GameCard>
              ))}
            </div>
          </div>
        ) : null}

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/startup/new">
            <div className="relative inline-flex items-center justify-center gap-2 px-6 py-3 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all cursor-pointer w-full sm:w-auto">
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400" />
              <span className="text-cyan-400 font-bold text-xs tracking-wider uppercase">PLAY FOUNDER ARENA</span>
            </div>
          </Link>
          <Link href="/leaderboard">
            <div className="relative inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer w-full sm:w-auto">
              <span className="text-white/60 font-bold text-xs tracking-wider uppercase">VIEW LEADERBOARD</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
