import Link from "next/link";
import { notFound } from "next/navigation";
import { getGrowthState } from "@/lib/actions/growth";
import { GameCard } from "@/components/game/GameCard";
import { SectionHeader } from "@/components/game/SectionHeader";
import { StatusBadge } from "@/components/game/StatusBadge";
import { ReadinessScoreCard } from "@/components/growth/ReadinessScoreCard";
import { GrowthOfferCardWrapper } from "@/components/growth/GrowthOfferCardWrapper";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";
import {
  MetricValuationIcon,
  MetricCashIcon,
  MetricRevenueIcon,
  MetricProductIcon,
} from "@/components/assets";
import { OutcomeDeadIcon, OutcomeAcquiredIcon } from "@/components/assets";

export const dynamic = "force-dynamic";

export default async function GrowthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let state;
  try {
    state = await getGrowthState(id);
  } catch {
    notFound();
  }

  const { startup, eligibility, offers, roundOffers, growthHistory, isDead, isAcquired } = state;

  return (
    <div>
      <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 md:px-8">
        <div className="mb-6">
          <Link
            href={`/startup/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Startup
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Growth Phase</h1>
            <p className="text-white/40 mt-1">
              {startup.name} — {startup.sector}
            </p>
          </div>
          <StatusBadge status={isDead ? "dead" : isAcquired ? "completed" : startup.status} />
        </div>

        {/* Locked states */}
        {isDead && (
          <GameCard glow="rose" className="mb-8 border-rose-500/20">
            <div className="flex items-center gap-3 mb-3">
              <OutcomeDeadIcon className="w-6 h-6 text-rose-400" size={24} />
              <h2 className="text-lg font-bold text-rose-300">Startup Shut Down</h2>
            </div>
            <p className="text-sm text-rose-200/80">
              This startup has shut down. Growth opportunities are no longer available.
              {startup.deathReason && ` Cause of death: ${startup.deathReason}`}
            </p>
            <div className="mt-4">
              <Link href={`/s/${startup.publicSlug ?? id}`}>
                <Button variant="outline" size="sm">
                  View Public Result
                </Button>
              </Link>
            </div>
          </GameCard>
        )}

        {isAcquired && (
          <GameCard glow="emerald" className="mb-8 border-emerald-500/20">
            <div className="flex items-center gap-3 mb-3">
              <OutcomeAcquiredIcon className="w-6 h-6 text-emerald-400" size={24} />
              <h2 className="text-lg font-bold text-emerald-300">Successfully Exited</h2>
            </div>
            <p className="text-sm text-emerald-200/80">
              This startup has been acquired. Congratulations on the exit!
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link href={`/s/${startup.publicSlug ?? id}`}>
                <Button variant="outline" size="sm">
                  View Public Result
                </Button>
              </Link>
              <Link href="/startup/new">
                <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
                  Start New Startup
                </Button>
              </Link>
            </div>
          </GameCard>
        )}

        {!isDead && !isAcquired && (
          <>
            {/* Readiness Cards */}
            <div className="mb-8">
              <SectionHeader
                title="Growth Readiness"
                subtitle="Your startup's readiness for next-stage opportunities"
                accent="violet"
                className="mb-4"
              />
              <div className="grid gap-4 md:grid-cols-3">
                <ReadinessScoreCard title="Series A Readiness" result={eligibility.seriesA} />
                <ReadinessScoreCard title="Series B Readiness" result={eligibility.seriesB} />
                <ReadinessScoreCard title="Acquisition Readiness" result={eligibility.acquisition} />
              </div>
            </div>

            {/* Current Metrics */}
            <GameCard className="mb-8">
              <SectionHeader title="Current Position" accent="cyan" className="mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/5 bg-white/5 p-3">
                  <div className="text-xs text-white/40 uppercase tracking-wider">Valuation</div>
                  <div className="text-lg font-bold text-white flex items-center gap-1">
                    <MetricValuationIcon className="w-4 h-4 text-cyan-400" size={16} />
                    ${startup.valuation.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/5 bg-white/5 p-3">
                  <div className="text-xs text-white/40 uppercase tracking-wider">Cash</div>
                  <div className="text-lg font-bold text-white flex items-center gap-1">
                    <MetricCashIcon className="w-4 h-4 text-emerald-400" size={16} />
                    ${startup.cash.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/5 bg-white/5 p-3">
                  <div className="text-xs text-white/40 uppercase tracking-wider">Revenue</div>
                  <div className="text-lg font-bold text-white flex items-center gap-1">
                    <MetricRevenueIcon className="w-4 h-4 text-violet-400" size={16} />
                    ${startup.revenue.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/5 bg-white/5 p-3">
                  <div className="text-xs text-white/40 uppercase tracking-wider">Product</div>
                  <div className="text-lg font-bold text-white flex items-center gap-1">
                    <MetricProductIcon className="w-4 h-4 text-amber-400" size={16} />
                    {startup.productProgress}%
                  </div>
                </div>
              </div>
            </GameCard>

            {/* Growth Round Offers */}
            {roundOffers.length > 0 && (
              <div className="mb-8">
                <SectionHeader
                  title="Growth Round Offers"
                  subtitle="Institutional funding opportunities"
                  accent="cyan"
                  className="mb-4"
                />
                <div className="grid gap-4">
                  {roundOffers.map((offer) => (
                    <GrowthOfferCardWrapper key={offer.offerId} offer={offer} startupId={id} />
                  ))}
                </div>
              </div>
            )}

            {/* Strategic Offers */}
            {offers.length > 0 && (
              <div className="mb-8">
                <SectionHeader
                  title="Strategic Opportunities"
                  subtitle="Corporate and strategic actor interest"
                  accent="violet"
                  className="mb-4"
                />
                <div className="grid gap-4">
                  {offers.map((offer) => (
                    <GrowthOfferCardWrapper key={offer.offerId} offer={offer} startupId={id} />
                  ))}
                </div>
              </div>
            )}

            {offers.length === 0 && roundOffers.length === 0 && (
              <GameCard className="mb-8 text-center py-8">
                <Lock className="w-8 h-8 text-white/40 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">No Offers Yet</h3>
                <p className="text-xs text-white/40 max-w-sm mx-auto">
                  Your metrics are not yet strong enough to attract strategic interest.
                  Focus on revenue growth, product progress, and team building.
                </p>
              </GameCard>
            )}

            {/* Offer History */}
            {growthHistory.length > 0 && (
              <div className="mb-8">
                <SectionHeader
                  title="Offer History"
                  subtitle="Previously received and resolved offers"
                  accent="cyan"
                  className="mb-4"
                />
                <div className="grid gap-3">
                  {growthHistory.map((offer) => (
                    <GameCard key={offer.id} >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-white/40 uppercase tracking-wider">
                            {offer.actorName}
                          </div>
                          <div className="font-medium text-white">{offer.headline}</div>
                        </div>
                        <StatusBadge status={offer.status} />
                      </div>
                    </GameCard>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


