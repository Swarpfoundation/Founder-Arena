import Link from "next/link";
import { ArrowLeft, BookOpen, Info, Shield, Signal } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";
import { isAdminEmail } from "@/lib/market-data/admin";
import {
  getLatestMarketDataRun,
  getLatestMarketSignals,
} from "@/lib/market-data/snapshot-builder";
import { getProviderStatus } from "@/lib/market-data/service";
import { getMarketAnalystNarrativeForSnapshot } from "@/lib/ai/get-market-narrative";
import { getCurrentSeason } from "@/lib/seasons/season-catalog";
import { GameScene } from "@/components/game/GameScene";
import { GameHudBar } from "@/components/game/GameHudBar";
import {
  MacroRadarPanel,
  MarketOpportunityFeed,
  ScenarioDossier,
  SeasonCommandPanel,
  SectorHeatMap,
  StartupMarketContext,
} from "@/components/game/MarketWarMap";
import { GenerateSnapshotForm } from "./generate-snapshot-form";
import { AdminSignalsPanel } from "./admin-signals-panel";
import {
  MACRO_FACTOR_CONFIGS,
  getMacroFactorPresentation,
  getMarketCtas,
  getMarketOpportunityFeed,
  getMarketScenarioPresentation,
  getSeasonCommandPresentation,
  getSectorHeatMap,
  getStartupMarketContext,
} from "@/lib/game/market-scene";
import { getNextObjective, getStartupRunStep } from "@/lib/game/objectives";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const user = await getCurrentUser();
  const isAdmin = isAdminEmail(user?.email);

  const snapshots = await db.marketSnapshot.findMany({
    orderBy: { month: "asc" },
    include: { events: true, dataRun: true },
    take: 24,
  });

  const currentSnapshot = snapshots.length > 0
    ? snapshots.find((snapshot) => {
        const now = new Date();
        const snapshotMonth = new Date(snapshot.month);
        return snapshotMonth.getMonth() === now.getMonth() && snapshotMonth.getFullYear() === now.getFullYear();
      }) ?? snapshots[snapshots.length - 1]
    : null;

  const currentEvent = currentSnapshot?.events[0] ?? null;
  const macro = currentSnapshot?.metadata as Record<string, unknown> | null;
  const macroScores = macro && typeof macro === "object" && "macro" in macro
    ? (macro.macro as Record<string, number>)
    : null;
  const sectorTrends = currentSnapshot?.sectorTrends
    ? (currentSnapshot.sectorTrends as Record<string, number>)
    : null;
  const sourceMode = currentSnapshot?.dataRun?.mode ?? "seeded";
  const confidence = macro && typeof macro === "object" && "confidence" in macro
    ? (macro.confidence as number)
    : undefined;
  const topSignals = macro && typeof macro === "object" && "topSignals" in macro
    ? (macro.topSignals as unknown as Array<{ title: string; direction: string; severity: number }>)
    : undefined;
  const limitations = macro && typeof macro === "object" && "limitations" in macro
    ? (macro.limitations as string[])
    : undefined;

  const latestRun = isAdmin ? await getLatestMarketDataRun() : null;
  const latestSignals = isAdmin ? await getLatestMarketSignals(10) : [];
  const providerStatus = isAdmin
    ? getProviderStatus().map((provider) => ({
        name: provider.name,
        configured: provider.configured,
        available: provider.available,
        envVar: provider.envVar,
      }))
    : [];

  const aiNarrative = currentSnapshot
    ? await getMarketAnalystNarrativeForSnapshot(currentSnapshot.id)
    : null;

  const activeStartup = user
    ? await db.startup.findFirst({
        where: {
          userId: user.id,
          status: { in: ["active", "funded", "pitching", "draft"] },
        },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          sector: true,
          status: true,
          cash: true,
          monthlyBurn: true,
          pitchDeck: { select: { id: true } },
          vcReviews: { orderBy: { createdAt: "desc" }, take: 1, select: { decision: true } },
          termSheets: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
          simulationMonths: { orderBy: { monthNumber: "asc" }, select: { monthNumber: true } },
        },
      })
    : null;

  const season = getCurrentSeason();
  const totalSeasonEntries = await db.leaderboardEntry.count({ where: { season: season.slug, category: "overall" } });
  const marketState = {
    scenarioKey: currentSnapshot?.scenarioKey ?? null,
    condition: currentSnapshot?.condition ?? null,
    macro: macroScores,
    sectorTrends,
    event: currentEvent
      ? {
          name: currentEvent.name,
          description: currentEvent.description,
          severity: currentEvent.severity,
        }
      : null,
  };
  const scenario = getMarketScenarioPresentation({
    key: currentSnapshot?.scenarioKey,
    name: currentSnapshot?.scenarioKey?.replace(/_/g, " "),
    description: currentSnapshot?.description,
    condition: currentSnapshot?.condition,
  });
  const macroFactors = MACRO_FACTOR_CONFIGS.map((factor) =>
    getMacroFactorPresentation(factor.key, macroScores?.[factor.key] ?? 0)
  );
  const sectors = getSectorHeatMap(marketState);
  const seasonCommand = getSeasonCommandPresentation(season, totalSeasonEntries);
  const startupContext = getStartupMarketContext(activeStartup, marketState);
  const opportunityFeed = getMarketOpportunityFeed(marketState, activeStartup);
  const ctas = getMarketCtas({ isLoggedIn: Boolean(user), activeStartupId: activeStartup?.id });
  const objective = activeStartup ? getNextObjective(activeStartup) : undefined;
  const currentStep = activeStartup ? getStartupRunStep(activeStartup) : undefined;

  return (
    <GameScene
      eyebrow="Arena Intel"
      title="Market War Map"
      subtitle="Read the macro battlefield before committing your next sprint."
      accent="cyan"
      actions={
        <div className="flex flex-wrap gap-2">
          {ctas.map((cta) => (
            <Link
              key={cta.href}
              href={cta.href}
              className={cn(
                "inline-flex items-center gap-2 border px-3 py-2 text-xs font-black uppercase tracking-wider hover:bg-white/10",
                cta.tone === "cyan" && "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
                cta.tone === "amber" && "border-amber-500/25 bg-amber-500/10 text-amber-300",
                cta.tone === "white" && "border-white/10 bg-white/[0.03] text-white/45"
              )}
            >
              {cta.label}
            </Link>
          ))}
        </div>
      }
      sidePanel={
        <div className="space-y-4">
          <SeasonCommandPanel season={seasonCommand} />
          <StartupMarketContext context={startupContext} />
          <section className="border border-white/10 bg-white/[0.03] p-4 text-white/55 hud-corner">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-white">Gameplay Intel</p>
                <p className="mt-1 text-xs leading-relaxed text-white/48">
                  Market intelligence is simplified for gameplay and not financial advice. Signals are deterministic game context.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">Source: {sourceMode}</span>
                  {confidence !== undefined && <span className="border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">Confidence: {confidence}%</span>}
                </div>
              </div>
            </div>
          </section>
        </div>
      }
    >
      {activeStartup && (
        <GameHudBar
          startupId={activeStartup.id}
          startupName={activeStartup.name}
          currentStep={currentStep}
          cash={activeStartup.cash}
          monthlyBurn={activeStartup.monthlyBurn}
          objective={objective}
        />
      )}

      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to Command Deck
      </Link>

      {isAdmin && (
        <div className="space-y-5">
          <GenerateSnapshotForm />
          <AdminSignalsPanel
            signals={latestSignals}
            providers={providerStatus}
            latestRun={latestRun ?? undefined}
          />
        </div>
      )}

      {currentSnapshot ? (
        <>
          <ScenarioDossier
            scenario={scenario}
            event={marketState.event}
            sourceMode={sourceMode}
            confidence={confidence}
          />

          {aiNarrative && (
            <section className="border border-violet-500/20 bg-violet-500/[0.045] p-5 text-violet-300 hud-corner">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <h2 className="text-sm font-black uppercase tracking-[0.24em] text-white">AI Market Brief</h2>
                <span className="ml-auto text-[10px] font-black uppercase tracking-wider opacity-70">Confidence {aiNarrative.confidence}%</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/78">{aiNarrative.executiveBrief}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="border border-white/10 bg-black/20 p-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-white/35">Investor Climate</p>
                  <p className="mt-1 text-sm text-white/62">{aiNarrative.investorClimate}</p>
                </div>
                <div className="border border-white/10 bg-black/20 p-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-white/35">Gameplay Note</p>
                  <p className="mt-1 text-sm text-white/62">{aiNarrative.gameplayNote}</p>
                </div>
              </div>
            </section>
          )}

          <MacroRadarPanel factors={macroFactors} />
          <SectorHeatMap sectors={sectors} />
          <MarketOpportunityFeed items={opportunityFeed} />

          {topSignals && topSignals.length > 0 && (
            <section className="space-y-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-white">
                  <Signal className="h-4 w-4 text-cyan-300" />
                  Top Signals
                </h2>
                <p className="mt-1 text-xs text-white/38">Highest-impact market signal feed</p>
              </div>
              <div className="grid gap-2">
                {topSignals.map((signal, index) => (
                  <div key={`${signal.title}-${index}`} className="flex items-center gap-3 border border-white/10 bg-white/[0.03] px-4 py-3 hud-corner">
                    <div className={cn(
                      "h-2 w-2 shrink-0",
                      signal.direction === "positive" ? "bg-emerald-400" : signal.direction === "negative" ? "bg-rose-400" : "bg-slate-400"
                    )} />
                    <span className="min-w-0 flex-1 truncate text-sm text-white/70">{signal.title}</span>
                    <span className="text-xs font-black uppercase tracking-wider text-white/35">{signal.direction}</span>
                    <span className="text-xs tabular-nums text-white/35">{signal.severity}/100</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {limitations && limitations.length > 0 && (
            <section className="space-y-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-white">
                  <Shield className="h-4 w-4 text-cyan-300" />
                  Intel Limitations
                </h2>
                <p className="mt-1 text-xs text-white/38">How to interpret the arena map</p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {limitations.map((limitation) => (
                  <div key={limitation} className="border border-white/10 bg-white/[0.03] p-3 text-sm leading-relaxed text-white/48 hud-corner">
                    {limitation}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white">Scenario Timeline</h2>
              <p className="mt-1 text-xs text-white/38">Historical arena snapshots</p>
            </div>
            <div className="grid gap-2">
              {snapshots.map((snapshot) => {
                const active = snapshot.id === currentSnapshot.id;
                const snapScenario = getMarketScenarioPresentation({
                  key: snapshot.scenarioKey,
                  name: snapshot.scenarioKey?.replace(/_/g, " "),
                  description: snapshot.description,
                  condition: snapshot.condition,
                });
                return (
                  <div
                    key={snapshot.id}
                    className={cn(
                      "flex items-start gap-3 border p-3 hud-corner",
                      active ? "border-cyan-500/30 bg-cyan-500/[0.06] text-cyan-300" : "border-white/10 bg-white/[0.025] text-white/45"
                    )}
                  >
                    <CalendarStamp date={snapshot.month} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black uppercase tracking-wider text-white">{snapScenario.label}</span>
                        <span className={cn(
                          "border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                          snapScenario.tone === "emerald" && "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
                          snapScenario.tone === "rose" && "border-rose-500/25 bg-rose-500/10 text-rose-300",
                          snapScenario.tone === "cyan" && "border-cyan-500/25 bg-cyan-500/10 text-cyan-300"
                        )}>
                          {snapScenario.direction}
                        </span>
                        {active && <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300">Active</span>}
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-white/42">{snapshot.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <section className="border border-white/10 bg-white/[0.03] p-8 text-center hud-corner">
          <h2 className="text-xl font-black uppercase tracking-wider text-white">No Market Data</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
            Market snapshots have not been seeded yet. Seed market data to activate the Arena Map.
          </p>
        </section>
      )}
    </GameScene>
  );
}

function CalendarStamp({ date }: { date: Date }) {
  return (
    <div className="grid w-16 shrink-0 place-items-center border border-white/10 bg-black/20 px-2 py-1.5 text-center">
      <span className="text-[9px] font-black uppercase tracking-wider text-white/35">{date.toISOString().slice(0, 4)}</span>
      <span className="text-xs font-black text-white">{date.toISOString().slice(5, 7)}</span>
    </div>
  );
}
