import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicStartupBySlug } from "@/lib/public/public-startup";

import { GameCard } from "@/components/game/GameCard";
import { MetricPanel } from "@/components/game/MetricPanel";
import { OutcomeBadge } from "@/components/game/OutcomeBadge";
import { StatusBadge } from "@/components/game/StatusBadge";
import { SectionHeader } from "@/components/game/SectionHeader";
import { ShareButtons } from "@/components/social/ShareButtons";
import { generateShareText } from "@/lib/social/share-text";
import {
  Trophy,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Building,
  Wrench,
  Flame,
  Shield,
  Zap,
  ExternalLink,
} from "lucide-react";
import { getSectorIcon } from "@/lib/assets";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const startup = await getPublicStartupBySlug(slug);

  if (!startup) {
    return { title: "Result Not Found | Founder Arena" };
  }

  const title = `${startup.name} — ${startup.finalOutcome ?? startup.status} | Founder Arena`;
  const description = startup.tagline
    ? `${startup.tagline}. Final score: ${startup.finalScore ?? 0}. Valuation: $${startup.valuation.toLocaleString()}.`
    : `Startup result on Founder Arena. Final score: ${startup.finalScore ?? 0}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function PublicStartupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const startup = await getPublicStartupBySlug(slug);

  if (!startup || !startup.publicSlug) {
    notFound();
  }

  const isDead = startup.status === "dead";
  const isCompleted = startup.status === "completed";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://founder-arena.vercel.app";
  const pageUrl = `${baseUrl}/s/${slug}`;

  const shareText = generateShareText(
    isDead
      ? {
          type: "startup_death",
          name: startup.name,
          monthsSurvived: startup.monthsSurvived,
          deathReason: startup.deathReason,
        }
      : {
          type: "startup_success",
          name: startup.name,
          monthsSurvived: startup.monthsSurvived,
          valuation: startup.valuation,
          outcome: startup.finalOutcome ?? "completed",
        },
    pageUrl
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
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.4em] text-cyan-400/40 mb-2">PUBLIC RECORD</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white text-glow-cyan tracking-tight">{startup.name}</h1>
          {startup.tagline && <p className="text-white/40 mt-2 text-lg">{startup.tagline}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white/60 capitalize">
              {(() => {
                const SectorIcon = getSectorIcon(startup.sector);
                return <SectorIcon className="w-3 h-3 text-cyan-400" size={12} />;
              })()}
              {startup.sector}
            </span>
            <StatusBadge status={isDead ? "dead" : isCompleted ? "completed" : startup.status} />
            {startup.finalOutcome && <OutcomeBadge outcome={startup.finalOutcome} />}
          </div>
        </div>

        {/* Share */}
        <div className="mb-8">
          <ShareButtons url={pageUrl} shareText={shareText} />
        </div>

        {/* Metrics */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricPanel label="Final Score" value={startup.finalScore ?? 0} icon={<Trophy className="w-4 h-4" />} />
          <MetricPanel label="Valuation" value={`$${startup.valuation.toLocaleString()}`} icon={<TrendingUp className="w-4 h-4" />} />
          <MetricPanel label="Revenue" value={`$${startup.revenue.toLocaleString()}`} icon={<DollarSign className="w-4 h-4" />} />
          <MetricPanel label="Weeks" value={startup.monthsSurvived} icon={<Calendar className="w-4 h-4" />} />
        </div>

        {/* Story Card */}
        <GameCard className="mb-8">
          <SectionHeader title="Startup Story" className="mb-4" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {startup.fundingRaised !== null && (
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">Funding Raised</div>
                  <div className="font-medium">${startup.fundingRaised.toLocaleString()}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-violet-400" />
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Team Size</div>
                <div className="font-medium">{startup.teamSize}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Office</div>
                <div className="font-medium capitalize">{startup.workSetup.replace(/_/g, " ")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Product</div>
                <div className="font-medium">{startup.productProgress}%</div>
              </div>
            </div>
            {startup.leaderboardScore !== null && (
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">Leaderboard</div>
                  <div className="font-medium">{startup.leaderboardScore.toLocaleString()}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-rose-400" />
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Burn</div>
                <div className="font-medium">${startup.revenue.toLocaleString()}/mo</div>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-3">
            {startup.simulationHighlights.biggestCrisis && (
              <div className="flex items-start gap-3 border border-rose-500/20 bg-rose-500/5 p-3">
                <Shield className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-rose-300 uppercase tracking-wider">Biggest Crisis</div>
                  <p className="text-sm text-white/80 mt-0.5">{startup.simulationHighlights.biggestCrisis}</p>
                </div>
              </div>
            )}
            {startup.simulationHighlights.keyLesson && (
              <div className="flex items-start gap-3 border border-cyan-500/20 bg-cyan-500/5 p-3">
                <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">Key Lesson</div>
                  <p className="text-sm text-white/80 mt-0.5">{startup.simulationHighlights.keyLesson}</p>
                </div>
              </div>
            )}
          </div>
        </GameCard>

        {/* Final Summary */}
        {startup.finalSummary && (
          <GameCard className="mb-8">
            <SectionHeader title="Final Summary" className="mb-3" />
            <p className="text-sm text-white/90 leading-relaxed">{startup.finalSummary}</p>
          </GameCard>
        )}

        {/* Death Reason */}
        {isDead && startup.deathReason && (
          <GameCard glow="rose" className="mb-8 border-rose-500/30 bg-rose-500/10">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-300">Cause of Death</h3>
                <p className="text-sm text-rose-200/80 mt-1 leading-relaxed">{startup.deathReason}</p>
              </div>
            </div>
          </GameCard>
        )}

        {/* Founder Link */}
        {startup.founderSlug && (
          <GameCard className="mb-8" >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Founded by</div>
                <div className="font-medium">{startup.founderName}</div>
              </div>
              <Link href={`/f/${startup.founderSlug}`}>
                <div className="relative inline-flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <span className="text-white/60 font-bold text-[10px] tracking-wider uppercase">VIEW PROFILE</span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                </div>
              </Link>
            </div>
          </GameCard>
        )}

        {/* Leaderboard */}
        {startup.leaderboardScore !== null && (
          <GameCard className="mb-8" glow="violet">
            <SectionHeader title="Leaderboard" subtitle={startup.leaderboardCategory ?? ""} className="mb-4" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="text-center sm:text-left">
                <div className="text-xs text-white/40 uppercase tracking-wider">Score</div>
                <div className="text-lg font-bold">{startup.leaderboardScore.toLocaleString()}</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-xs text-white/40 uppercase tracking-wider">Category</div>
                <div className="text-lg font-bold capitalize">{startup.leaderboardCategory ?? "overall"}</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-xs text-white/40 uppercase tracking-wider">Weeks</div>
                <div className="text-lg font-bold">{startup.monthsSurvived}</div>
              </div>
            </div>
          </GameCard>
        )}

        {/* CTAs */}
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
          {startup.founderSlug && (
            <Link href={`/f/${startup.founderSlug}`}>
              <div className="relative inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer w-full sm:w-auto">
                <span className="text-white/60 font-bold text-xs tracking-wider uppercase">FOUNDER PROFILE</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
