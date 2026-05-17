import Link from "next/link";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-helpers";
import { getOrCreateFounderProfile } from "@/lib/game/founder-progression";
import { signOut } from "@/lib/auth";
import { GameCard } from "@/components/game/GameCard";
import { MetricPanel } from "@/components/game/MetricPanel";
import { StatusBadge } from "@/components/game/StatusBadge";
import { LevelBadge } from "@/components/game/LevelBadge";
import { SectionHeader } from "@/components/game/SectionHeader";
import { OutcomeBadge } from "@/components/game/OutcomeBadge";
import { ProgressBar } from "@/components/game/ProgressBar";
import {
  Trophy,
  Target,
  Skull,
  DollarSign,
  Award,
  ArrowLeft,
  Rocket,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { ShareButtons } from "@/components/social/ShareButtons";
import { generateShareText } from "@/lib/social/share-text";
import { getAchievementIcon } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { getAchievementTier, getTierBadgeClass } from "@/lib/assets/achievement-tier";

const CornerBorders = () => (
  <>
    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/40 pointer-events-none" />
    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/40 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/40 pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/40 pointer-events-none" />
  </>
);

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireCurrentUser();
  const profile = await getOrCreateFounderProfile(user.id);

  const [startups, achievements, leaderboardEntries] = await Promise.all([
    db.startup.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        simulationMonths: { select: { monthNumber: true, status: true } },
        employees: { select: { status: true } },
        fundingRounds: { select: { amountRaised: true } },
      },
    }),
    db.founderAchievement.findMany({
      where: { founderProfileId: profile.id },
      orderBy: { unlockedAt: "desc" },
    }),
    db.leaderboardEntry.findMany({
      where: { userId: user.id },
      orderBy: { score: "desc" },
      include: { startup: true },
      take: 10,
    }),
  ]);

  const xpForNext =
    profile.level < 10
      ? profile.level * 100 + (profile.level - 1) * 50
      : 99999;
  const xpProgress = Math.min(
    100,
    Math.round((profile.xp / xpForNext) * 100)
  );

  return (
    <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 md:px-8">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Hero Header */}
      <GameCard glow="violet" className="relative mb-8">
        <CornerBorders />
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <LevelBadge level={profile.level} size="lg" />
          <div className="flex-1">
            <div className="text-[10px] tracking-[0.4em] text-cyan-400/40 uppercase mb-2">Founder Profile</div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white text-glow-violet">
              {user.name ?? "Founder"}
            </h1>
            <p className="text-white/40 mt-1">
              Level {profile.level} Founder • {profile.totalStartups} venture
              {profile.totalStartups !== 1 ? "s" : ""} started
            </p>
          </div>
          <Link href="/dashboard">
            <div className="px-3 py-1.5 border border-white/10 text-white/40 text-xs font-medium hover:border-white/30 hover:text-white/70 transition-colors cursor-pointer">
              Dashboard
            </div>
          </Link>
          {profile.publicSlug && (
            <Link href={`/f/${profile.publicSlug}`}>
              <div className="px-3 py-1.5 border border-white/10 text-white/40 text-xs font-medium hover:border-white/30 hover:text-white/70 transition-colors cursor-pointer inline-flex items-center">
                <ExternalLink className="w-4 h-4 mr-1.5" />
                View Public Profile
              </div>
            </Link>
          )}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="px-3 py-1.5 border border-rose-500/20 text-rose-400 text-xs font-medium hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-400 transition-colors cursor-pointer inline-flex items-center">
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign Out
            </button>
          </form>
        </div>
      </GameCard>

      {/* Share */}
      {profile.publicSlug && (
        <div className="mb-8">
          <ShareButtons
            url={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/f/${profile.publicSlug}`}
            shareText={generateShareText({
              type: "founder_profile",
              name: user.name ?? "Founder",
              level: profile.level,
              bestScore: profile.bestScore,
              totalStartups: profile.totalStartups,
            })}
          />
        </div>
      )}

      {/* XP Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">
            Experience
          </span>
          <span className="text-sm text-white/40">
            {profile.xp} / {xpForNext} XP
          </span>
        </div>
        <ProgressBar value={xpProgress} size="lg" />
      </div>

      {/* Stats Row */}
      <SectionHeader title="Stats" accent="cyan" />
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-10">
        <MetricPanel
          label="Total Startups"
          value={profile.totalStartups}
          icon={<Rocket className="w-4 h-4" />}
        />
        <MetricPanel
          label="Completed"
          value={profile.completedStartups}
          icon={<Target className="w-4 h-4" />}
        />
        <MetricPanel
          label="Dead"
          value={profile.deadStartups}
          icon={<Skull className="w-4 h-4" />}
        />
        <MetricPanel
          label="Best Score"
          value={profile.bestScore.toLocaleString()}
          icon={<Trophy className="w-4 h-4" />}
        />
        <MetricPanel
          label="Best Valuation"
          value={`$${profile.bestValuation.toLocaleString()}`}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <MetricPanel
          label="Achievements"
          value={achievements.length}
          icon={<Award className="w-4 h-4" />}
        />
      </div>

      {/* Achievements */}
      {achievements.length > 0 ? (
        <div className="mb-10">
          <SectionHeader
            title="Achievements"
            subtitle="Milestones unlocked on your journey"
            accent="violet"
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.map((ach) => (
              <GameCard key={ach.id} className="relative">
                <CornerBorders />
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
                          <span className={cn("text-[10px] uppercase tracking-wider px-1.5 py-0.5 border", getTierBadgeClass(tier))}>
                            {tier}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">
                      Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-white/40 mt-2">
                      {ach.description}
                    </p>
                  </div>
                </div>
              </GameCard>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-10">
          <SectionHeader
            title="Achievements"
            subtitle="Milestones unlocked on your journey"
            accent="violet"
          />
          <GameCard className="relative text-center py-8">
            <CornerBorders />
            <Award className="w-8 h-8 text-white/40 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">No achievements yet</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              Complete startups, submit pitches, hire employees, and survive Founder Weeks to unlock achievements.
            </p>
          </GameCard>
        </div>
      )}

      {/* Startup History */}
      {startups.length > 0 ? (
        <div className="mb-10">
          <SectionHeader
            title="Startup History"
            subtitle="Your past and current ventures"
            accent="cyan"
          />
          <div className="space-y-3">
            {startups.map((startup) => {
              const isDone =
                startup.status === "completed" || startup.status === "dead";
              return (
                <Link
                  key={startup.id}
                  href={
                    isDone && startup.publicSlug
                      ? `/s/${startup.publicSlug}`
                      : `/startup/${startup.id}`
                  }
                  className="block group"
                >
                  <GameCard
                    className="relative group-hover:-translate-y-0.5 transition-transform"
                  >
                    <CornerBorders />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-white">
                            {startup.name}
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.4em] border border-white/10 px-2 py-0.5 text-white/40">
                            {startup.sector}
                          </span>
                          <StatusBadge status={startup.status} />
                        </div>
                        <div className="text-xs text-white/40 mt-1">
                          {startup.simulationMonths.length} Founder Weeks • Score:{" "}
                          {startup.finalScore ?? "—"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">
                          ${startup.valuation.toLocaleString()}
                        </div>
                        <div className="text-xs text-white/40">
                          valuation
                        </div>
                      </div>
                    </div>
                  </GameCard>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-10">
          <SectionHeader
            title="Startup History"
            subtitle="Your past and current ventures"
            accent="cyan"
          />
          <GameCard className="relative text-center py-8">
            <CornerBorders />
            <Rocket className="w-8 h-8 text-white/40 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">No startups yet</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto mb-4">
              Create your first startup to see it here.
            </p>
            <Link href="/startup/new">
              <div className="px-3 py-1.5 border border-cyan-500/40 text-cyan-400 text-xs font-medium hover:bg-cyan-500/10 hover:border-cyan-400 transition-colors cursor-pointer inline-block">
                Create Startup
              </div>
            </Link>
          </GameCard>
        </div>
      )}

      {/* Leaderboard Placements */}
      {leaderboardEntries.length > 0 ? (
        <div className="mb-10">
          <SectionHeader
            title="Leaderboard Placements"
            subtitle="Your highest scoring runs"
            accent="violet"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {leaderboardEntries.map((entry, index) => (
              <Link
                key={entry.id}
                href={
                  entry.startup.publicSlug
                    ? `/s/${entry.startup.publicSlug}`
                    : `/startup/${entry.startupId}`
                }
                className="block group"
              >
                <GameCard
                  glow="violet"
                  className="relative group-hover:-translate-y-0.5 transition-transform"
                >
                  <CornerBorders />
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-white text-sm">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate">
                        {entry.startup.name}
                      </h4>
                      <div className="text-xs text-white/40 mt-0.5">
                        {entry.category} • {entry.season}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">
                        {entry.score.toLocaleString()}
                      </div>
                      <OutcomeBadge
                        outcome={entry.outcome ?? ""}
                        className="text-xs px-2 py-0.5 mt-1"
                      />
                    </div>
                  </div>
                </GameCard>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-10">
          <SectionHeader
            title="Leaderboard Placements"
            subtitle="Your highest scoring runs"
            accent="violet"
          />
          <GameCard className="relative text-center py-8">
            <CornerBorders />
            <Trophy className="w-8 h-8 text-white/40 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">No placements yet</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto mb-4">
              Complete a startup simulation to appear on the leaderboard.
            </p>
            <Link href="/leaderboard">
              <div className="px-3 py-1.5 border border-white/10 text-white/40 text-xs font-medium hover:border-white/30 hover:text-white/70 transition-colors cursor-pointer inline-block">
                View Leaderboard
              </div>
            </Link>
          </GameCard>
        </div>
      )}
    </div>
  );
}
