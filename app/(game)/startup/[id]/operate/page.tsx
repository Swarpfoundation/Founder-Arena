import Link from "next/link";
import { notFound } from "next/navigation";
import { getStartupById } from "@/lib/actions/startup";
import { getSimulationState } from "@/lib/actions/simulation";
import { db } from "@/lib/db";
import { ShareButtons } from "@/components/social/ShareButtons";
import { generateShareText } from "@/lib/social/share-text";
import { OperateClient } from "./operate-client";
import { GameCard } from "@/components/game/GameCard";
import { StatusBadge } from "@/components/game/StatusBadge";
import { SectionHeader } from "@/components/game/SectionHeader";
import { OutcomeBadge } from "@/components/game/OutcomeBadge";
import { MetricPanel } from "@/components/game/MetricPanel";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { MetricRevenueIcon } from "@/components/assets";

export const dynamic = "force-dynamic";

export default async function OperatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let simState;
  try {
    simState = await getSimulationState(id);
  } catch {
    notFound();
  }

  const startup = simState.startup;
  const history = startup.simulationMonths;

  // If not funded, show locked state
  if (startup.status !== "funded" && startup.status !== "active" && startup.status !== "dead" && startup.status !== "completed") {
    return (
      <div>
        <div className="max-w-5xl mx-auto pt-24 pb-12 px-4 md:px-8">
          <div className="mb-6">
            <Link
              href={`/startup/${id}`}
              className="inline-flex items-center gap-1 text-sm text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Startup
            </Link>
          </div>
          <GameCard glow="violet" className="hud-corner">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">Operating Center Locked</h2>
              <p className="text-sm text-white/40 mt-1">
                You need to complete funding before you can operate your company.
              </p>
            </div>
            <Link href={`/startup/${id}/terms`}>
              <div className="relative inline-flex items-center gap-2 px-4 py-2 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all group cursor-pointer">
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400" />
                <span className="text-cyan-400 font-bold text-sm">Review Term Sheet</span>
              </div>
            </Link>
          </GameCard>
        </div>
      </div>
    );
  }

  const totalUsers = history.reduce((sum, m) => sum + m.userGrowth, 0) + 100;

  return (
    <div>
      <div className="max-w-5xl mx-auto pt-24 pb-12 px-4 md:px-8">
        <div className="mb-6">
          <Link
            href={`/startup/${id}`}
            className="inline-flex items-center gap-1 text-sm text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Startup
          </Link>
        </div>

        {/* Header */}
        <div className="mb-5">
          <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase mb-1">Operating Center</p>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {startup.status === "dead"
              ? "Final Month"
              : startup.status === "completed"
              ? "Month 12"
              : `Month ${simState.currentMonth + 1}`}
          </h1>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "CASH", value: `$${(startup.cash / 1000).toFixed(0)}K`, color: "text-cyan-400", border: "border-cyan-500/20" },
            { label: "BURN", value: `$${((simState.trueMonthlyBurn ?? startup.monthlyBurn) / 1000).toFixed(0)}K/mo`, color: "text-rose-400", border: "border-rose-500/20" },
            { label: "USERS", value: totalUsers.toLocaleString(), color: "text-emerald-400", border: "border-emerald-500/20" },
            { label: "MORALE", value: `${startup.teamMorale}%`, color: "text-amber-400", border: "border-amber-500/20" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`game-card p-3 ${stat.border} hud-corner`}
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Operate Client */}
        {(startup.status === "funded" || startup.status === "active") && (
          <OperateClient
            startupId={id}
            currentMonth={simState.currentMonth}
            availableDecisions={simState.availableDecisions}
            monthlyEvent={simState.monthlyEvent ?? undefined}
            eventChoices={simState.eventChoices}
            cash={startup.cash}
            monthlyBurn={simState.trueMonthlyBurn ?? startup.monthlyBurn}
            revenue={startup.revenue}
            teamMorale={startup.teamMorale}
            activeMission={simState.activeMission}
            pendingMissions={simState.pendingMissions}
            nextMoves={simState.nextMoves}
            advisor={simState.advisor}
            missionCoach={simState.missionCoach}
            costBreakdown={simState.costBreakdown}
          />
        )}

        {/* History / Mission Log */}
        {history.length > 0 && (
          <div className="mt-12">
            <h3 className="text-sm font-bold text-white mb-3 tracking-wider uppercase">Monthly Mission Log</h3>
            <div className="space-y-2">
              {history.map((month, i) => {
                const missionMeta = (month.metadata as Record<string, unknown> | null)?.missionResult as Record<string, unknown> | undefined;
                return (
                  <div
                    key={month.id}
                    className={cn(
                      "flex items-center gap-3 p-3",
                      i === history.length - 1
                        ? "bg-cyan-500/10 border border-cyan-500/20"
                        : "bg-white/5"
                    )}
                  >
                    <div className="w-10 h-10 bg-slate-800 flex items-center justify-center border border-slate-700 flex-shrink-0">
                      <span className="text-xs font-black text-cyan-400">M{month.monthNumber}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Rev</span>{" "}
                        <span className="text-emerald-400 font-bold">${(month.revenue / 1000).toFixed(0)}K</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Burn</span>{" "}
                        <span className="text-rose-400 font-bold">${(month.burnRate / 1000).toFixed(0)}K</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Users</span>{" "}
                        <span className="text-cyan-400 font-bold">+{month.userGrowth}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!!missionMeta?.missionTitle && (
                        <span className={cn(
                          "hidden sm:inline text-[10px] uppercase tracking-wider border px-2 py-0.5",
                          missionMeta.missionOutcome === "completed"
                            ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                            : missionMeta.missionOutcome === "failed"
                            ? "text-rose-400 border-rose-500/20 bg-rose-500/10"
                            : "text-violet-400 border-violet-500/20 bg-violet-500/10"
                        )}>
                          {String(missionMeta.missionTitle).slice(0, 20)}{missionMeta.missionOutcome === "completed" ? " ✓" : ""}
                        </span>
                      )}
                      {month.eventTitle && (
                        <span className="hidden sm:inline text-[10px] text-amber-400 uppercase tracking-wider border border-amber-500/20 bg-amber-500/10 px-2 py-0.5">
                          {month.eventTitle}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Final Outcome */}
        {(startup.status === "dead" || startup.status === "completed") && (
          <div className="mt-12">
            <FinalOutcome startupId={id} />
          </div>
        )}
      </div>
    </div>
  );
}

async function FinalOutcome({ startupId }: { startupId: string }) {
  const startup = await getStartupById(startupId);
  const history = startup.simulationMonths;
  const entry = await db.leaderboardEntry.findFirst({
    where: { startupId },
    orderBy: { createdAt: "desc" },
  });

  const { classifyFinalOutcome } = await import("@/lib/simulation/engine");
  const { calculateTotalBurn } = await import("@/lib/economy/cost-engine");
  type SeniorityLevel = "junior" | "mid" | "senior" | "lead";

  // Use true monthly burn (payroll + office + operating) so capital
  // efficiency in the displayed outcome matches the leaderboard math.
  const activeEmployees = startup.employees
    .filter((e) => e.status === "active")
    .map((e) => ({
      role: e.role,
      seniority: e.seniority as SeniorityLevel,
      region: startup.region,
    }));
  const trueBurn = calculateTotalBurn(
    activeEmployees,
    startup.workSetup,
    startup.sector,
    startup.stage,
    startup.revenue,
    0
  ).totalMonthlyBurn;

  const state = {
    cash: startup.cash,
    monthlyBurn: trueBurn,
    revenue: startup.revenue,
    valuation: startup.valuation,
    productProgress: startup.productProgress,
    investorScore: startup.investorScore ?? 50,
    marketScore: startup.marketScore ?? 50,
    riskScore: startup.riskScore ?? 50,
  };

  const monthsSurvived = history.length;
  const outcome = classifyFinalOutcome(state, monthsSurvived, history);

  const isDead = startup.status === "dead";

  return (
    <GameCard glow={isDead ? "rose" : "violet"} className="hud-corner">
      <SectionHeader title="Final Report" accent="violet" className="mb-4" />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <OutcomeBadge outcome={outcome.outcome} />
        <StatusBadge status={isDead ? "dead" : "completed"} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricPanel label="Outcome" value={outcome.outcome} />
        <MetricPanel label="Survived" value={`${monthsSurvived} months`} />
        <MetricPanel label="Final Valuation" value={`$${startup.valuation.toLocaleString()}`} />
        <MetricPanel label="Final Score" value={outcome.founderScore} />
      </div>

      <GameCard className="mb-6 hud-corner">
        <div className="text-sm text-white/40 mb-1">Reason</div>
        <p className="text-sm text-white">{outcome.reason}</p>
      </GameCard>

      {isDead && startup.deathReason && (
        <GameCard glow="rose" className="mb-6 border-rose-500/30 hud-corner">
          <div className="text-sm text-rose-300 font-medium">Cause of Death</div>
          <p className="text-sm text-rose-200 mt-1">{startup.deathReason}</p>
        </GameCard>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricPanel label="Founder Score" value={outcome.founderScore} />
        <MetricPanel label="Leaderboard Score" value={entry?.score ?? 0} />
      </div>

      {startup.publicSlug && (
        <>
          <GameCard className="mb-6 hud-corner">
            <div className="text-sm font-medium mb-2 text-white">Public Result Page</div>
            <Link
              href={`/s/${startup.publicSlug}`}
              className="text-sm text-cyan-400 hover:underline break-all"
            >
              /s/{startup.publicSlug}
            </Link>
            <p className="text-xs text-white/40 mt-2">
              Your public page hides private pitch details and only shows the result story.
            </p>
          </GameCard>
          <div className="mb-6">
            <ShareButtons
              url={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/s/${startup.publicSlug}`}
              shareText={generateShareText(
                isDead
                  ? { type: "startup_death", name: startup.name, monthsSurvived, deathReason: startup.deathReason }
                  : { type: "startup_success", name: startup.name, monthsSurvived, valuation: startup.valuation, outcome: outcome.outcome }
              )}
            />
          </div>
        </>
      )}

      {!isDead && (
        <GameCard glow="violet" className="mb-6 border-violet-500/30 hud-corner">
          <div className="text-sm font-medium text-violet-300 mb-1">Growth Phase Unlocked</div>
          <p className="text-sm text-white/40 mb-3">
            Your startup is strong enough to attract strategic interest. Explore growth rounds, acquisitions, and partnerships.
          </p>
          <Link href={`/startup/${startup.id}/growth`}>
            <div className="relative inline-flex items-center gap-2 px-4 py-2 border border-violet-400/30 bg-violet-400/10 hover:bg-violet-400/20 transition-all group cursor-pointer">
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-violet-400" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-violet-400" />
              <MetricRevenueIcon className="w-4 h-4 text-violet-400" size={16} />
              <span className="text-violet-400 font-bold text-sm">Enter Growth Phase</span>
            </div>
          </Link>
        </GameCard>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard">
          <div className="relative inline-flex items-center gap-2 px-4 py-2 border border-white/20 bg-white/5 hover:bg-white/10 transition-all group cursor-pointer">
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/40" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/40" />
            <span className="text-white/80 font-bold text-sm">Back to Dashboard</span>
          </div>
        </Link>
        {isDead && (
          <Link href="/graveyard">
            <div className="relative inline-flex items-center gap-2 px-4 py-2 border border-white/20 bg-white/5 hover:bg-white/10 transition-all group cursor-pointer">
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/40" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/40" />
              <span className="text-white/80 font-bold text-sm">View Graveyard</span>
            </div>
          </Link>
        )}
        {entry && (
          <Link href="/leaderboard">
            <div className="relative inline-flex items-center gap-2 px-4 py-2 border border-white/20 bg-white/5 hover:bg-white/10 transition-all group cursor-pointer">
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/40" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/40" />
              <span className="text-white/80 font-bold text-sm">View Leaderboard</span>
            </div>
          </Link>
        )}
        <Link href="/startup/new">
          <div className="relative inline-flex items-center gap-2 px-4 py-2 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all group cursor-pointer">
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400" />
            <span className="text-cyan-400 font-bold text-sm">Create New Startup</span>
          </div>
        </Link>
      </div>
    </GameCard>
  );
}
