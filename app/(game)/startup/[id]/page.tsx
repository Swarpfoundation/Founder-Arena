import Link from "next/link";
import { notFound } from "next/navigation";
import { getStartupById } from "@/lib/actions/startup";
import { getTermSheet } from "@/lib/actions/terms";
import { getNextBestActionForStartup } from "@/lib/onboarding/progress";
import { GameCard } from "@/components/game/GameCard";
import { StatusBadge } from "@/components/game/StatusBadge";
import { OutcomeBadge } from "@/components/game/OutcomeBadge";
import { NextBestActionInline } from "@/components/onboarding/NextBestAction";
import {
  ArrowLeft,
  Users,
  FileText,
  MessageSquare,
  Wind,
  CloudRain,
  ChevronRight,
  Zap,
  Target,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MetricValuationIcon,
} from "@/components/assets";

export const dynamic = "force-dynamic";

export default async function StartupProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let startup;
  try {
    startup = await getStartupById(id);
  } catch {
    notFound();
  }

  const termSheet = await getTermSheet(id).catch(() => null);
  const latestRound = startup.fundingRounds[0];
  const latestReview = startup.vcReviews[0];

  const nextAction = getNextBestActionForStartup(startup);

  const analysis = startup.aiAnalysis as Record<string, unknown> | null;

  const activeEmployees = startup.employees.filter((e) => e.status === "active");
  const teamPayroll = activeEmployees.reduce((sum, e) => sum + e.salary, 0);

  // Primary CTA computed inline below as needed.
  void termSheet;
  void latestReview;

  // Calculate changes from simulation months
  const months = startup.simulationMonths;
  const lastMonth = months[months.length - 1];
  const prevMonth = months[months.length - 2];

  function pctChange(current: number, previous: number): string {
    if (!previous || previous === 0) return "—";
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(0)}%`;
  }

  const cashChange = lastMonth && prevMonth ? pctChange(lastMonth.cashEnd, prevMonth.cashEnd) : "—";
  const revenueChange = lastMonth && prevMonth ? pctChange(lastMonth.revenue, prevMonth.revenue) : "—";
  const teamChange = lastMonth && prevMonth ? pctChange(lastMonth.employeeCount, prevMonth.employeeCount) : "—";

  const maxChartVal = Math.max(
    1,
    ...months.map((m) => Math.max(m.revenue, m.burnRate))
  );

  return (
    <div className="max-w-5xl mx-auto pt-24 pb-12 px-4 md:px-8 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <div className="w-10 h-10 game-card flex items-center justify-center text-cyan-400">
            <ArrowLeft className="w-5 h-5" />
          </div>
        </Link>
        <div>
          <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">
            Unit Profile // {id}
          </p>
          <h1 className="text-2xl font-black text-white tracking-tight text-glow-cyan">
            {startup.name}
          </h1>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] font-bold px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 uppercase tracking-wider">
            {startup.stage}
          </span>
        </div>
      </div>

      {/* Next Best Action */}
      {nextAction && (
        <div>
          <NextBestActionInline action={nextAction} />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="game-card p-4 hud-corner">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-violet-400" />
            <span className="text-[10px] text-white/40 font-bold tracking-wider">VALUATION</span>
          </div>
          <p className="text-xl font-black text-white">${startup.valuation.toLocaleString()}</p>
          <p className="text-[10px] font-bold mt-1 text-white/30">—</p>
        </div>

        <div className="game-card p-4 hud-corner">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] text-white/40 font-bold tracking-wider">CASH</span>
          </div>
          <p className="text-xl font-black text-white">${startup.cash.toLocaleString()}</p>
          <p className={`text-[10px] font-bold mt-1 ${cashChange.startsWith("+") ? "text-emerald-400" : cashChange.startsWith("-") ? "text-rose-400" : "text-white/30"}`}>
            {cashChange}
          </p>
        </div>

        <div className="game-card p-4 hud-corner">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUpIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-white/40 font-bold tracking-wider">REVENUE</span>
          </div>
          <p className="text-xl font-black text-white">${startup.revenue.toLocaleString()}</p>
          <p className={`text-[10px] font-bold mt-1 ${revenueChange.startsWith("+") ? "text-emerald-400" : revenueChange.startsWith("-") ? "text-rose-400" : "text-white/30"}`}>
            {revenueChange}
          </p>
        </div>

        <div className="game-card p-4 hud-corner">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] text-white/40 font-bold tracking-wider">TEAM</span>
          </div>
          <p className="text-xl font-black text-white">{activeEmployees.length}</p>
          <p className={`text-[10px] font-bold mt-1 ${teamChange.startsWith("+") ? "text-emerald-400" : teamChange.startsWith("-") ? "text-rose-400" : "text-white/30"}`}>
            {teamChange}
          </p>
        </div>
      </div>

      {/* Mission Roadmap Preview */}
      {startup.missions.length > 0 && (
        <GameCard glow="violet" className="border-violet-500/20 hud-corner">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">Mission Roadmap</h3>
            <span className="ml-auto text-[10px] text-violet-400/60 font-bold uppercase tracking-wider">
              {startup.missions.filter((m) => m.status === "completed").length}/{startup.missions.length} Completed
            </span>
          </div>
          {(() => {
            const active = startup.missions.find((m) => m.status === "active");
            return active ? (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white font-bold">{active.title}</span>
                  <span className="text-[10px] text-violet-400">{active.progress}%</span>
                </div>
                <div className="h-1.5 bg-white/5 overflow-hidden">
                  <div className="h-full bg-violet-400" style={{ width: `${active.progress}%` }} />
                </div>
                <p className="text-[10px] text-white/40 mt-1">{active.category} &middot; Mission {active.sequence}</p>
              </div>
            ) : null;
          })()}
          <div className="flex flex-wrap gap-1.5">
            {startup.missions.slice(0, 6).map((m) => (
              <span
                key={m.id}
                className={cn(
                  "inline-flex items-center gap-1 border px-2 py-0.5 text-[9px] uppercase tracking-wider",
                  m.status === "completed"
                    ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                    : m.status === "active"
                    ? "text-violet-400 border-violet-500/20 bg-violet-500/10"
                    : m.status === "failed"
                    ? "text-rose-400 border-rose-500/20 bg-rose-500/10"
                    : "text-white/30 border-white/10 bg-white/5"
                )}
              >
                {m.status === "completed" ? "✓" : m.status === "failed" ? "✗" : m.sequence}
                {" "}
                {m.title.slice(0, 18)}
              </span>
            ))}
            {startup.missions.length > 6 && (
              <span className="text-[9px] text-white/30 px-1">+{startup.missions.length - 6} more</span>
            )}
          </div>
        </GameCard>
      )}

      {/* Performance Telemetry */}
      <div className="game-card p-4 hud-corner">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wider uppercase">Performance Telemetry</h3>
        </div>
        {months.length > 0 ? (
          <>
            <div className="h-32 flex items-end gap-2">
              {months.map((h) => {
                const revH = maxChartVal > 0 ? (h.revenue / maxChartVal) * 100 : 0;
                const burnH = maxChartVal > 0 ? (h.burnRate / maxChartVal) * 100 : 0;
                return (
                  <div key={h.monthNumber} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center gap-0.5" style={{ height: "100px" }}>
                      <div
                        className="w-2 bg-emerald-400/60"
                        style={{ height: `${revH}%` }}
                      />
                      <div
                        className="w-2 bg-rose-400/60"
                        style={{ height: `${burnH}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-white/30 font-bold">M{h.monthNumber}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-400" />
                <span className="text-[10px] text-white/40">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-rose-400" />
                <span className="text-[10px] text-white/40">Burn</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-white/40">No simulation data available.</p>
        )}
      </div>

      {/* Problem / Solution */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="game-card p-4 hud-corner">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">Problem</h3>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">{startup.problem}</p>
        </div>
        <div className="game-card p-4 hud-corner">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">Solution</h3>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">{startup.solution}</p>
        </div>
      </div>

      {/* AI Idea Analysis — Strengths & Risks */}
      {analysis && (
        <>
          {Array.isArray(analysis.strengths) && analysis.strengths.length > 0 && (
            <div className="game-card p-4 hud-corner">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-wider uppercase">Strengths</h3>
              </div>
              <div className="space-y-2">
                {analysis.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-white/80">{String(s)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(analysis.risks) && analysis.risks.length > 0 && (
            <div className="game-card p-4 hud-corner">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white tracking-wider uppercase">Risk Analysis</h3>
              </div>
              <div className="space-y-2">
                {analysis.risks.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-white/80">{String(r)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Market Exposure */}
      {(() => {
        const exposure = analysis?.marketExposure as Record<string, unknown> | undefined;
        if (!exposure) return null;
        return (
          <div className="game-card p-4 hud-corner">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-wider uppercase">Market Exposure</h3>
            </div>
            <div className="space-y-4">
              {!!exposure.explanation && (
                <p className="text-sm text-white/80 leading-relaxed">
                  {String(exposure.explanation)}
                </p>
              )}
              {Array.isArray(exposure.tailwinds) && exposure.tailwinds.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5" />
                    Tailwinds
                  </h4>
                  <ul className="space-y-1.5">
                    {exposure.tailwinds.map((t: unknown, i: number) => (
                      <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 bg-emerald-400 shrink-0" />
                        {String(t)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(exposure.headwinds) && exposure.headwinds.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5" />
                    Headwinds
                  </h4>
                  <ul className="space-y-1.5">
                    {exposure.headwinds.map((h: unknown, i: number) => (
                      <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 bg-rose-400 shrink-0" />
                        {String(h)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Link
                href="/market"
                className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View market conditions
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        );
      })()}

      {/* Existing supplementary data in v2 style */}

      {/* Final Result */}
      {(startup.status === "completed" || startup.status === "dead") && (
        <div className="game-card p-4 hud-corner">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-white/40" />
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">Final Result</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">Outcome</span>
              {startup.finalOutcome ? (
                <OutcomeBadge outcome={startup.finalOutcome} />
              ) : (
                <span className="text-sm font-medium">—</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">Score</span>
              <span className="text-sm font-bold text-white">{startup.finalScore ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">Months</span>
              <span className="text-sm font-bold text-white">{startup.simulationMonths.length}</span>
            </div>
            {startup.publicSlug && (
              <Link
                href={`/s/${startup.publicSlug}`}
                className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Public result
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
            {startup.status === "dead" && (
              <Link
                href="/graveyard"
                className="inline-flex items-center gap-1 text-sm text-rose-400 hover:text-rose-300 transition-colors"
              >
                View in Graveyard
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
            {startup.status === "completed" && (
              <Link
                href={`/startup/${id}/growth`}
                className="inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                Enter Growth Phase
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <Link
              href="/career"
              className="inline-flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              View career legacy
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Team */}
      {activeEmployees.length > 0 && (
        <div className="game-card p-4 hud-corner">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">Team</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">Size</span>
              <span className="text-sm font-bold text-white">{activeEmployees.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">Payroll</span>
              <span className="text-sm font-bold text-white">${teamPayroll.toLocaleString()}/mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">Office</span>
              <span className="text-sm font-bold text-white capitalize">{startup.workSetup.replace(/_/g, " ")}</span>
            </div>
            <Link
              href={`/startup/${id}/team`}
              className="inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Manage team
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Funding */}
      {latestRound && (
        <div className="game-card p-4 hud-corner">
          <div className="flex items-center gap-2 mb-3">
            <MetricValuationIcon className="w-4 h-4 text-cyan-400" size={16} />
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">Funding</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">Round</span>
              <span className="text-sm font-bold text-white capitalize">{latestRound.roundType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">Amount</span>
              <span className="text-sm font-bold text-white">${Number(latestRound.amountRaised).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">Equity</span>
              <span className="text-sm font-bold text-white">{Number(latestRound.equitySold)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Term Sheet */}
      {termSheet && !latestRound && (
        <div className="game-card p-4 hud-corner">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">Term Sheet</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={termSheet.status} />
            </div>
            <p className="text-sm text-white/40">
              ${Number(termSheet.proposedAmount).toLocaleString()} for {Number(termSheet.proposedEquity)}%
            </p>
            <Link
              href={`/startup/${id}/terms`}
              className="inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              View term sheet
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Latest Review */}
      {latestReview && !termSheet && (
        <div className="game-card p-4 hud-corner">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">Latest Review</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {latestReview.decision === "proposal" ? (
                <span className="inline-flex items-center gap-1.5 border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-cyan-400 capitalize">
                  {latestReview.decision}
                </span>
              ) : latestReview.decision === "reject" ? (
                <span className="inline-flex items-center gap-1.5 border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-rose-400 capitalize">
                  {latestReview.decision}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white/60 capitalize">
                  {latestReview.decision}
                </span>
              )}
            </div>
            <p className="text-sm text-white/40">Score: {latestReview.overallScore ?? "N/A"}/100</p>
            <Link
              href={`/startup/${id}/review`}
              className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View full review
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
        <Link href={`/startup/${id}/operate`}>
          <div className="p-3 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all text-xs font-bold tracking-wider uppercase text-center cursor-pointer">
            OPERATE
          </div>
        </Link>
        <Link href={`/startup/${id}/team`}>
          <div className="p-3 border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-all text-xs font-bold tracking-wider uppercase text-center cursor-pointer">
            CREW
          </div>
        </Link>
        <Link href={`/startup/${id}/social`}>
          <div className="p-3 border border-pink-500/30 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-all text-xs font-bold tracking-wider uppercase text-center cursor-pointer">
            ARENA
          </div>
        </Link>
        <Link href={`/startup/${id}/rivals`}>
          <div className="p-3 border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-bold tracking-wider uppercase text-center cursor-pointer">
            RIVALS
          </div>
        </Link>
        <Link href={`/startup/${id}/growth`}>
          <div className="p-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-bold tracking-wider uppercase text-center cursor-pointer">
            GROWTH
          </div>
        </Link>
        <Link href={`/startup/${id}/strategy`}>
          <div className="p-3 border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all text-xs font-bold tracking-wider uppercase text-center cursor-pointer">
            STRATEGY
          </div>
        </Link>
        <Link href={`/startup/${id}/terms`}>
          <div className="p-3 border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all text-xs font-bold tracking-wider uppercase text-center cursor-pointer">
            TERM SHEET
          </div>
        </Link>
      </div>
    </div>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
