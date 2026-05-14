import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";
import { isAdminEmail } from "@/lib/market-data/admin";
import {
  getLatestMarketDataRun,
  getLatestMarketSignals,
} from "@/lib/market-data/snapshot-builder";
import { getProviderStatus } from "@/lib/market-data/service";
import { getMarketAnalystNarrativeForSnapshot } from "@/lib/ai/get-market-narrative";
import { GameCard } from "@/components/game/GameCard";
import { SectionHeader } from "@/components/game/SectionHeader";

import { cn } from "@/lib/utils";
import {
  Activity, BrainCircuit, Bitcoin, Scale, TrendingUp, Globe,
  ShoppingCart, Building2, Flame, Snowflake, Zap, AlertTriangle,
  CalendarClock, BarChart3, Info, Shield, Signal, BookOpen,
} from "lucide-react";
import { getSectorIcon } from "@/lib/assets";
import { GenerateSnapshotForm } from "./generate-snapshot-form";
import { AdminSignalsPanel } from "./admin-signals-panel";

const CornerBorders = () => (
  <>
    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/40 pointer-events-none" />
    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/40 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/40 pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/40 pointer-events-none" />
  </>
);

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
    ? snapshots.find((s) => {
        const now = new Date();
        const sMonth = new Date(s.month);
        return sMonth.getMonth() === now.getMonth() && sMonth.getFullYear() === now.getFullYear();
      }) ?? snapshots[snapshots.length - 1]
    : null;

  const currentEvent = currentSnapshot?.events[0];
  const macro = currentSnapshot?.metadata as Record<string, Record<string, number> | string | number | string[]> | null;
  const macroScores = macro && typeof macro === "object" && "macro" in macro
    ? (macro.macro as Record<string, number>)
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

  const aiNarrative = currentSnapshot
    ? await getMarketAnalystNarrativeForSnapshot(currentSnapshot.id)
    : null;

  const hotSectors: string[] = [];
  const coldSectors: string[] = [];

  if (currentSnapshot?.sectorTrends) {
    const trends = currentSnapshot.sectorTrends as Record<string, number>;
    for (const [sector, value] of Object.entries(trends)) {
      if (sector === "default") continue;
      if (value > 1.05) hotSectors.push(sector);
      if (value < 0.95) coldSectors.push(sector);
    }
  }

  const latestRun = isAdmin ? await getLatestMarketDataRun() : null;
  const latestSignals = isAdmin ? await getLatestMarketSignals(10) : [];
  const providerStatus = isAdmin
    ? getProviderStatus().map((p) => ({
        name: p.name,
        configured: p.configured,
        available: p.available,
        envVar: p.envVar,
      }))
    : [];

  const macroItems = [
    { label: "VC Climate", key: "vcClimate", icon: <Activity className="w-4 h-4" /> },
    { label: "AI Demand", key: "aiDemand", icon: <BrainCircuit className="w-4 h-4" /> },
    { label: "Crypto Sentiment", key: "cryptoSentiment", icon: <Bitcoin className="w-4 h-4" /> },
    { label: "Regulation Pressure", key: "regulationPressure", icon: <Scale className="w-4 h-4" /> },
    { label: "Inflation Pressure", key: "inflationPressure", icon: <TrendingUp className="w-4 h-4" /> },
    { label: "Geopolitical Risk", key: "geopoliticalRisk", icon: <Globe className="w-4 h-4" /> },
    { label: "Consumer Spending", key: "consumerSpending", icon: <ShoppingCart className="w-4 h-4" /> },
    { label: "Enterprise Spending", key: "enterpriseSpending", icon: <Building2 className="w-4 h-4" /> },
  ];

  const eventSeverity = (severity: number) => {
    if (severity >= 70) return { label: "Critical", classes: "border-rose-500/40 text-rose-300 bg-rose-500/10" };
    if (severity >= 40) return { label: "High", classes: "border-amber-500/40 text-amber-300 bg-amber-500/10" };
    return { label: "Moderate", classes: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10" };
  };

  const conditionBadge = (condition: string) => {
    if (condition === "bullish") return { label: "Bullish", classes: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10" };
    if (condition === "bearish") return { label: "Bearish", classes: "border-rose-500/40 text-rose-300 bg-rose-500/10" };
    return { label: "Neutral", classes: "border-slate-500/40 text-slate-300 bg-slate-500/10" };
  };

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
            <div className="text-[10px] tracking-[0.4em] text-cyan-400/40 uppercase mb-2">Macro Conditions</div>
            <h1 className="text-3xl font-bold text-white text-glow-cyan">Market Intelligence</h1>
            <p className="text-white/40 mt-1">
              Current macro conditions and how they affect startups.
            </p>
          </div>
          <Link href="/startup/new">
            <div className="px-4 py-2 border border-cyan-500/40 text-cyan-400 text-sm font-medium hover:bg-cyan-500/10 hover:border-cyan-400 transition-colors cursor-pointer">
              Create Startup
            </div>
          </Link>
        </div>

        {/* Disclaimer */}
        <GameCard className="relative mb-6">
          <CornerBorders />
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white/40">
                Market intelligence is simplified for gameplay and not financial advice.
                Signals are aggregated into deterministic game effects.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 border border-white/10 px-2 py-0.5 text-xs text-white/40">
                  <Signal className="w-3 h-3" />
                  Source: {sourceMode}
                </span>
                {confidence !== undefined && (
                  <span className="inline-flex items-center gap-1 border border-white/10 px-2 py-0.5 text-xs text-white/40">
                    Confidence: {confidence}%
                  </span>
                )}
                {latestRun && (
                  <span className="inline-flex items-center gap-1 border border-white/10 px-2 py-0.5 text-xs text-white/40">
                    <CalendarClock className="w-3 h-3" />
                    Last run: {new Date(latestRun.completedAt ?? latestRun.startedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </GameCard>

        {/* Admin generation form */}
        {isAdmin && (
          <div className="mb-8">
            <GenerateSnapshotForm />
          </div>
        )}

        {/* Admin signals panel */}
        {isAdmin && (
          <AdminSignalsPanel
            signals={latestSignals}
            providers={providerStatus}
            latestRun={latestRun ?? undefined}
          />
        )}

        {currentSnapshot ? (
          <>
            {/* AI Market Analyst Brief */}
            {aiNarrative && (
              <GameCard glow="violet" className="relative mb-8">
                <CornerBorders />
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-violet-400" />
                  <h2 className="text-lg font-bold">AI Market Brief</h2>
                  <span className="text-xs text-white/40 ml-auto">
                    Confidence: {aiNarrative.confidence}%
                  </span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed mb-4">
                  {aiNarrative.executiveBrief}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Investor Climate</div>
                    <p className="text-sm">{aiNarrative.investorClimate}</p>
                  </div>
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Gameplay Note</div>
                    <p className="text-sm text-violet-300">{aiNarrative.gameplayNote}</p>
                  </div>
                </div>
                {aiNarrative.riskWatchlist.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Risk Watchlist</div>
                    <div className="flex flex-wrap gap-2">
                      {aiNarrative.riskWatchlist.map((r, i) => (
                        <span key={i} className="text-xs border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-rose-300">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {aiNarrative.opportunityMap.length > 0 && (
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Opportunities</div>
                    <div className="flex flex-wrap gap-2">
                      {aiNarrative.opportunityMap.map((o, i) => (
                        <span key={i} className="text-xs border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                          {o}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-white/40 mt-4 italic">
                  Current game market snapshot indicates conditions only. Not financial advice.
                </p>
              </GameCard>
            )}

            {/* Current Scenario */}
            <GameCard glow="cyan" className="relative mb-8">
              <CornerBorders />
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-bold">Current Scenario</h2>
                  </div>
                  <p className="text-sm text-white/40 capitalize">
                    {currentSnapshot.scenarioKey?.replace(/_/g, " ") ?? "Unknown"}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 border px-3 py-1 text-xs font-bold uppercase tracking-wider self-start",
                    conditionBadge(currentSnapshot.condition).classes
                  )}
                >
                  {conditionBadge(currentSnapshot.condition).label}
                </span>
              </div>
              <p className="text-sm text-white/90 leading-relaxed mb-4">
                {currentSnapshot.description}
              </p>

              {currentEvent && (
                <div className="border border-white/10 bg-background/50 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-sm">{currentEvent.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs font-medium",
                          eventSeverity(currentEvent.severity).classes
                        )}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {eventSeverity(currentEvent.severity).label}
                      </span>
                      <span className="text-xs text-white/40">
                        Severity {currentEvent.severity}/100
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-white/40">{currentEvent.description}</p>
                </div>
              )}
            </GameCard>

            {/* Top Signals */}
            {topSignals && topSignals.length > 0 && (
              <div className="mb-8">
                <SectionHeader title="Top Signals" subtitle="Highest-impact market signals" className="mb-4" />
                <div className="space-y-2">
                  {topSignals.map((sig, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 border border-white/5 bg-white/5 px-4 py-3"
                    >
                      <div className={cn(
                        "w-2 h-2 shrink-0",
                        sig.direction === "positive" ? "bg-emerald-400" :
                        sig.direction === "negative" ? "bg-rose-400" : "bg-slate-400"
                      )} />
                      <span className="text-sm flex-1">{sig.title}</span>
                      <span className={cn(
                        "text-xs font-medium",
                        sig.direction === "positive" ? "text-emerald-400" :
                        sig.direction === "negative" ? "text-rose-400" : "text-slate-400"
                      )}>
                        {sig.direction}
                      </span>
                      <span className="text-xs text-white/40 tabular-nums">
                        {sig.severity}/100
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Macro Cards */}
            {macroScores && (
              <div className="mb-8">
                <SectionHeader title="Macro Conditions" subtitle="Aggregated economic indicators" className="mb-4" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {macroItems.map((item) => {
                    const value = macroScores[item.key] ?? 0;
                    const absVal = Math.abs(value);
                    const isPositive = value > 0;
                    const isNegative = value < 0;
                    const barColor = isPositive ? "bg-emerald-500" : isNegative ? "bg-rose-500" : "bg-slate-500";
                    const textColor = isPositive ? "text-emerald-400" : isNegative ? "text-rose-400" : "text-slate-400";

                    return (
                      <GameCard key={item.key} className="relative p-4">
                        <CornerBorders />
                        <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-2">
                          <span className="text-primary">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        <div className={cn("text-2xl font-bold mb-2", textColor)}>
                          {value > 0 ? "+" : ""}{value}
                        </div>
                        <div className="w-full bg-muted h-1.5 overflow-hidden">
                          <div
                            className={cn("h-1.5 transition-all", barColor)}
                            style={{ width: `${Math.min(100, absVal)}%` }}
                          />
                        </div>
                      </GameCard>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hot/Cold Sectors */}
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              <GameCard glow={hotSectors.length > 0 ? "emerald" : false} className="relative">
                <CornerBorders />
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold">Hot Sectors</h3>
                </div>
                {hotSectors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {hotSectors.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300"
                      >
                        {(() => {
                          const SectorIcon = getSectorIcon(s);
                          return <SectorIcon className="w-3.5 h-3.5" size={14} />;
                        })()}
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/40">
                    No sectors are significantly outperforming right now.
                  </p>
                )}
              </GameCard>

              <GameCard glow={coldSectors.length > 0 ? "rose" : false} className="relative">
                <CornerBorders />
                <div className="flex items-center gap-2 mb-3">
                  <Snowflake className="w-5 h-5 text-rose-400" />
                  <h3 className="font-bold">Cold Sectors</h3>
                </div>
                {coldSectors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {coldSectors.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-300"
                      >
                        {(() => {
                          const SectorIcon = getSectorIcon(s);
                          return <SectorIcon className="w-3.5 h-3.5" size={14} />;
                        })()}
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/40">
                    No sectors are significantly underperforming right now.
                  </p>
                )}
              </GameCard>
            </div>

            {/* Limitations */}
            {limitations && limitations.length > 0 && (
              <div className="mb-8">
                <SectionHeader title="Limitations" subtitle="How to interpret this data" className="mb-4" />
                <div className="space-y-2">
                  {limitations.map((lim, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-white/40">
                      <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{lim}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="mb-8">
              <SectionHeader title="Scenario Timeline" subtitle="Historical market snapshots" className="mb-4" />
              <div className="space-y-2">
                {snapshots.map((snap) => {
                  const isActive = snap.id === currentSnapshot.id;
                  const cond = conditionBadge(snap.condition);
                  return (
                    <div
                      key={snap.id}
                      className={cn(
                        "flex items-start gap-3 p-3 border transition-colors",
                        isActive
                          ? "bg-primary/5 border-primary/30 glow-cyan"
                          : "border-white/5 hover:bg-white/5"
                      )}
                    >
                      <div className="flex flex-col items-center gap-1 pt-0.5">
                        <CalendarClock className="w-4 h-4 text-white/40" />
                        <div className="text-xs text-white/40 tabular-nums">
                          {snap.month.toISOString().slice(0, 7)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("font-medium text-sm", isActive && "text-primary")}>
                            {snap.scenarioKey?.replace(/_/g, " ") ?? "Unknown"}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center border px-2 py-0.5 text-xs font-medium",
                              cond.classes
                            )}
                          >
                            {cond.label}
                          </span>
                          {snap.dataRun && (
                            <span className="text-xs text-white/40">
                              ({snap.dataRun.mode})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{snap.description}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        {isActive && (
                          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <GameCard className="relative">
            <CornerBorders />
            <div className="p-8 text-center">
              <BarChart3 className="w-10 h-10 text-white/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Market Data</h3>
              <p className="text-sm text-white/40 max-w-md mx-auto">
                Market snapshots haven&apos;t been seeded yet. Run <code>npx tsx prisma/seed.ts</code> to populate market data and see macro conditions.
              </p>
            </div>
          </GameCard>
        )}
      </div>
    </div>
  );
}
