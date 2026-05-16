"use server";

import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-helpers";
import type { StrategySignal, StrategyState, FounderArchetypeSummary } from "@/lib/strategy/types";
import { computeStrategyState } from "@/lib/strategy/strategy-engine";
import { generateArchetypeSummary } from "@/lib/strategy/strategy-summary";
import type { RivalStartup } from "@/lib/rivals/types";

export interface StrategyStateResult {
  startupName: string;
  startupStatus: string;
  currentMonth: number;
  sector: string;
  signals: StrategySignal[];
  dominantPlaystyle: StrategyState["dominantPlaystyle"];
  secondaryPlaystyles: StrategyState["secondaryPlaystyles"];
  stacks: StrategyState["stacks"];
  activeSynergies: StrategyState["activeSynergies"];
  warnings: StrategyState["warnings"];
  recommendations: StrategyState["recommendations"];
  totalSignals: number;
  archetypeSummary: FounderArchetypeSummary | null;
}

export async function getStrategyState(startupId: string): Promise<StrategyStateResult> {
  const user = await requireCurrentUser();

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: {
      socialState: true,
      simulationMonths: { orderBy: { monthNumber: "desc" }, take: 1 },
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Startup not found");
  }

  const ss = startup.socialState;
  const signals: StrategySignal[] = ss
    ? (ss.strategySignals as unknown as StrategySignal[])
    : [];

  const currentMonth = startup.simulationMonths[0]?.monthNumber ?? 0;

  // Compute rival max rivalry score for warnings
  const rivals: RivalStartup[] = ss
    ? (ss.rivalProfiles as unknown as RivalStartup[])
    : [];
  const rivalryMaxScore = rivals.length > 0
    ? Math.max(...rivals.map((r) => r.rivalryScore))
    : 0;

  const ctx = {
    productProgress: startup.productProgress,
    revenue: startup.revenue,
    brandRisk: ss?.brandRisk ?? 0,
    socialTrust: ss?.trust ?? 50,
    socialHype: ss?.hype ?? 20,
    investorScore: startup.investorScore ?? 50,
    monthlyBurn: startup.monthlyBurn,
    currentMonth,
    rivalryMaxScore,
  };

  const strategyState = computeStrategyState(signals, ctx);

  // Generate archetype summary if run is over
  const isOver = startup.status === "completed" || startup.status === "dead";
  const archetypeSummary = isOver
    ? generateArchetypeSummary(signals, strategyState, {
        productProgress: startup.productProgress,
        revenue: startup.revenue,
        outcome: startup.finalOutcome ?? undefined,
        finalScore: startup.finalScore ?? undefined,
      })
    : null;

  return {
    startupName: startup.name,
    startupStatus: startup.status,
    currentMonth,
    sector: startup.sector,
    signals,
    ...strategyState,
    archetypeSummary,
  };
}
