import Link from "next/link";
import { db } from "@/lib/db";
import { GameCard } from "@/components/game/GameCard";
import { StatusBadge } from "@/components/game/StatusBadge";
import { isDemoSamplesEnabled, SAMPLE_GRAVEYARD_ENTRIES } from "@/lib/onboarding/demo-samples";

import { Cross, Calendar, Users, TrendingDown, ExternalLink } from "lucide-react";
import { OutcomeDeadIcon, MetricCashIcon, MetricValuationIcon } from "@/components/assets";
import { generateShareText } from "@/lib/social/share-text";
import { TwitterShareButton } from "@/components/social/TwitterShareButton";
import { CopyLinkButton } from "@/components/social/CopyLinkButton";

const CornerBorders = () => (
  <>
    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/40 pointer-events-none" />
    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/40 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/40 pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/40 pointer-events-none" />
  </>
);

export const dynamic = "force-dynamic";

export default async function GraveyardPage() {
  const deadStartups = await db.startup.findMany({
    where: { status: "dead" },
    orderBy: { completedAt: "desc" },
    include: {
      simulationMonths: { orderBy: { monthNumber: "asc" } },
      fundingRounds: true,
      employees: true,
      user: true,
    },
    take: 50,
  });

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
            <div className="text-[10px] tracking-[0.4em] text-cyan-400/40 uppercase mb-2">Memorial</div>
            <h1 className="text-3xl font-bold text-white text-glow-cyan">Startup Graveyard</h1>
            <p className="text-white/40 mt-1">
              Memorial for startups that didn&apos;t make it. Learn from their mistakes.
            </p>
          </div>
          <Link href="/startup/new">
            <div className="px-4 py-2 border border-cyan-500/40 text-cyan-400 text-sm font-medium hover:bg-cyan-500/10 hover:border-cyan-400 transition-colors cursor-pointer">
              Create New Startup
            </div>
          </Link>
        </div>

        {deadStartups.length === 0 ? (
          <div className="space-y-6">
            <GameCard >
              <div className="relative p-8 text-center">
                <CornerBorders />
                <Cross className="w-10 h-10 text-rose-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No graveyard entries yet</h3>
                <p className="text-sm text-white/40 max-w-md mx-auto">
                  No startups have died yet. Either you&apos;re incredibly lucky, or you haven&apos;t played enough. Most founders fail a few times before they win.
                </p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Link href="/startup/new">
                    <div className="px-3 py-1.5 border border-cyan-500/40 text-cyan-400 text-xs font-medium hover:bg-cyan-500/10 hover:border-cyan-400 transition-colors cursor-pointer">
                      Create your first startup
                    </div>
                  </Link>
                  <Link href="/how-to-play">
                    <div className="px-3 py-1.5 border border-white/10 text-white/40 text-xs font-medium hover:border-white/30 hover:text-white/70 transition-colors cursor-pointer">
                      Learn How to Play
                    </div>
                  </Link>
                </div>
              </div>
            </GameCard>

            {isDemoSamplesEnabled() && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] uppercase tracking-[0.4em] border border-white/10 px-2 py-1 text-white/40">Example</span>
                  <span className="text-xs text-white/40">What graveyard entries look like</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-70">
                  {SAMPLE_GRAVEYARD_ENTRIES.map((startup) => (
                    <GameCard
                      key={startup.name}
                      className="relative h-full flex flex-col"
                    >
                      <CornerBorders />
                      <div className="flex items-start justify-between mb-4">
                        <div className="min-w-0">
                          <h3 className="font-bold text-lg leading-tight truncate">{startup.name}</h3>
                          <p className="text-xs text-white/40 mt-0.5">
                            by {startup.founderName}
                          </p>
                        </div>
                        <StatusBadge status="dead" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-3.5 h-3.5 text-white/40 shrink-0" />
                          <span className="text-white/40">Survived</span>
                          <span className="font-medium ml-auto">{startup.monthsSurvived}mo</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingDown className="w-3.5 h-3.5 text-white/40 shrink-0" />
                          <span className="text-white/40">Valuation</span>
                          <span className="font-medium ml-auto">
                            ${startup.valuation.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-auto">
                        <div className="bg-rose-500/10 border border-rose-500/20 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <OutcomeDeadIcon className="w-3.5 h-3.5 text-rose-400" size={14} />
                            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
                              Cause of Death
                            </span>
                          </div>
                          <p className="text-sm text-rose-200 leading-snug">{startup.deathReason}</p>
                        </div>
                      </div>
                    </GameCard>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deadStartups.map((startup) => {
              const monthsSurvived = startup.simulationMonths.length;
              const latestRound = startup.fundingRounds[0];
              const teamSize = startup.employees.filter((e) => e.status === "active").length;

              return (
                <Link
                  key={startup.id}
                  href={startup.publicSlug ? `/s/${startup.publicSlug}` : `/startup/${startup.id}`}
                  className="block"
                >
                  <GameCard
                    className="relative h-full flex flex-col hover:bg-secondary/60 transition-colors cursor-pointer"
                  >
                    <CornerBorders />
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg leading-tight truncate">{startup.name}</h3>
                        <p className="text-xs text-white/40 mt-0.5">
                          by {startup.user.name ?? "Unknown Founder"}
                        </p>
                        {startup.publicSlug && (
                          <div className="flex items-center gap-2 mt-2">
                            <CopyLinkButton url={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/s/${startup.publicSlug}`} label="Copy" />
                            <TwitterShareButton
                              text={generateShareText(
                                { type: "startup_death", name: startup.name, monthsSurvived: startup.simulationMonths.length, deathReason: startup.deathReason },
                                `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/s/${startup.publicSlug}`
                              )}
                            />
                            <Link href={`/s/${startup.publicSlug}`}>
                              <div className="px-2 py-1 border border-white/10 text-white/40 text-xs font-medium hover:border-white/30 hover:text-white/70 transition-colors cursor-pointer inline-flex items-center">
                                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                View
                              </div>
                            </Link>
                          </div>
                        )}
                      </div>
                      <StatusBadge status="dead" />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-white/40 shrink-0" />
                        <span className="text-white/40">Survived</span>
                        <span className="font-medium ml-auto">{monthsSurvived}mo</span>
                      </div>
                      {latestRound && (
                        <div className="flex items-center gap-2 text-sm">
                          <MetricCashIcon className="w-3.5 h-3.5 text-white/40 shrink-0" size={14} />
                          <span className="text-white/40">Raised</span>
                          <span className="font-medium ml-auto">
                            ${Number(latestRound.amountRaised).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <MetricValuationIcon className="w-3.5 h-3.5 text-white/40 shrink-0" size={14} />
                        <span className="text-white/40">Valuation</span>
                        <span className="font-medium ml-auto">
                          ${startup.valuation.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-3.5 h-3.5 text-white/40 shrink-0" />
                        <span className="text-white/40">Team</span>
                        <span className="font-medium ml-auto">{teamSize}</span>
                      </div>
                    </div>

                    {/* Death Reason */}
                    {startup.deathReason && (
                      <div className="mt-auto">
                        <div className="bg-rose-500/10 border border-rose-500/20 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Cross className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
                              Cause of Death
                            </span>
                          </div>
                          <p className="text-sm text-rose-200 leading-snug">{startup.deathReason}</p>
                        </div>
                      </div>
                    )}

                    {startup.finalSummary && (
                      <p className="text-xs text-white/40 italic mt-3 line-clamp-2">
                        &ldquo;{startup.finalSummary}&rdquo;
                      </p>
                    )}
                  </GameCard>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
