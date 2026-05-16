"use server";

import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-helpers";
import { getOrCreateFounderProfile } from "@/lib/game/founder-progression";
import { generateDocumentary } from "@/lib/documentary/documentary-engine";
import type {
  FounderDocumentary,
  DocumentaryEngineInput,
  SimMonthSnap,
  SocialStateSnap,
  CareerSnapForDocumentary,
  RivalStartupSnap,
  RivalMoveSnap,
  FeedItemSnap,
  ActionTakenSnap,
} from "@/lib/documentary/types";
import type { CareerRunEntry } from "@/lib/career/types";

export interface DocumentaryPageData {
  documentary: FounderDocumentary;
  startup: {
    id: string;
    name: string;
    status: string;
    sector: string;
    publicSlug: string | null;
    finalOutcome: string | null;
  };
  isFinalized: boolean;
}

export async function getDocumentaryData(startupId: string): Promise<DocumentaryPageData> {
  const user = await requireCurrentUser();

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: {
      simulationMonths: { orderBy: { monthNumber: "asc" } },
      fundingRounds: { orderBy: { createdAt: "desc" } },
      employees: true,
      missions: { orderBy: { sequence: "asc" } },
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Startup not found");
  }

  const isFinalized =
    (startup.status === "dead" || startup.status === "completed") &&
    !!startup.finalOutcome;

  // Load social state (rivals, feed, strategy signals all live here)
  const rawSocialState = await db.socialState.findUnique({
    where: { startupId },
  });

  // Load career profile for career impact
  const profile = await getOrCreateFounderProfile(user.id);

  // Build engine input
  const simMonths: SimMonthSnap[] = startup.simulationMonths.map((m) => ({
    monthNumber: m.monthNumber,
    cashStart: m.cashStart,
    cashEnd: m.cashEnd,
    burnRate: m.burnRate,
    revenue: m.revenue,
    runwayMonths: m.runwayMonths,
    productProgress: m.productProgress,
    userGrowth: m.userGrowth,
    employeeCount: m.employeeCount,
    valuation: m.valuation,
    eventsTriggered: m.eventsTriggered,
    eventTitle: m.eventTitle ?? null,
    eventSummary: m.eventSummary ?? null,
    aiSummary: m.aiSummary ?? null,
    marketCondition: m.marketCondition,
    riskScoreAfter: m.riskScoreAfter ?? null,
    investorScoreAfter: m.investorScoreAfter ?? null,
    investorScoreBefore: m.investorScoreBefore ?? null,
  }));

  let socialState: SocialStateSnap | undefined;
  if (rawSocialState) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rivalProfiles: RivalStartupSnap[] = ((rawSocialState.rivalProfiles as unknown as any[]) ?? []).map(
      (r: {
        id: string;
        name: string;
        founder: { name: string; archetype: string };
        rivalryScore: number;
        isDefeated: boolean;
        latestMoveType?: string;
        latestMoveTitle?: string;
        monthGenerated: number;
      }) => ({
        id: r.id,
        name: r.name,
        founder: { name: r.founder.name, archetype: r.founder.archetype },
        rivalryScore: r.rivalryScore ?? 0,
        isDefeated: r.isDefeated ?? false,
        latestMoveType: r.latestMoveType,
        latestMoveTitle: r.latestMoveTitle,
        monthGenerated: r.monthGenerated ?? 1,
      })
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rivalMoveHistory: RivalMoveSnap[] = ((rawSocialState.rivalMoveHistory as unknown as any[]) ?? []).map(
      (m: { id: string; rivalName: string; month: number; title: string; description: string; severity: string }) => ({
        id: m.id,
        rivalName: m.rivalName,
        month: m.month,
        title: m.title,
        description: m.description,
        severity: m.severity ?? "neutral",
      })
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feedItems: FeedItemSnap[] = ((rawSocialState.feedItems as unknown as any[]) ?? []).map(
      (fi: { id: string; month: number; category: string; title: string; body: string; severity: string; source: string }) => ({
        id: fi.id,
        month: fi.month,
        category: fi.category,
        title: fi.title,
        body: fi.body,
        severity: fi.severity ?? "neutral",
        source: fi.source ?? "founder",
      })
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actionsTaken: ActionTakenSnap[] = ((rawSocialState.actionsTaken as unknown as any[]) ?? []).map(
      (a: { month: number; actionId: string; didBackfire: boolean }) => ({
        month: a.month,
        actionId: a.actionId,
        didBackfire: a.didBackfire ?? false,
      })
    );

    socialState = {
      hype: rawSocialState.hype,
      trust: rawSocialState.trust,
      brandRisk: rawSocialState.brandRisk,
      followers: rawSocialState.followers,
      viralMomentum: rawSocialState.viralMomentum,
      founderReputation: rawSocialState.founderReputation,
      feedItems,
      actionsTaken,
      rivalProfiles,
      rivalMoveHistory,
    };
  }

  // Build career snap
  let career: CareerSnapForDocumentary | undefined;
  if (profile) {
    // recentRuns does not store per-run reputationDelta; derive a best-effort estimate
    void ((profile.recentRuns as unknown as CareerRunEntry[]) ?? []);
    const reputationDelta = 0; // per-run delta not persisted in CareerRunEntry
    const rankAdvanced = profile.founderRank !== "rookie";

    career = {
      founderTitle: profile.founderTitle,
      founderRank: profile.founderRank,
      reputationScore: profile.reputationScore,
      reputationDelta,
      rankAdvanced,
      titleChanged: false,
      badgeCount: ((profile.legacyBadges as unknown as unknown[]) ?? []).length,
    };
  }

  const engineInput: DocumentaryEngineInput = {
    startup: {
      id: startup.id,
      name: startup.name,
      tagline: startup.tagline,
      sector: startup.sector,
      region: startup.region,
      status: startup.status,
      problem: startup.problem,
      solution: startup.solution,
      monetizationModel: startup.monetizationModel,
      targetMarket: startup.targetMarket,
      fundingAsk: startup.fundingAsk,
      revenue: startup.revenue,
      valuation: startup.valuation,
      productProgress: startup.productProgress,
      investorScore: startup.investorScore ?? null,
      riskScore: startup.riskScore ?? null,
      finalScore: startup.finalScore ?? null,
      finalOutcome: startup.finalOutcome ?? null,
      finalSummary: startup.finalSummary ?? null,
      deathReason: startup.deathReason ?? null,
      aiAnalysis: (startup.aiAnalysis as Record<string, unknown>) ?? null,
      simulationMonths: simMonths,
      fundingRounds: startup.fundingRounds.map((r) => ({
        roundType: r.roundType,
        amountRaised: Number(r.amountRaised),
        equitySold: Number(r.equitySold),
      })),
      employees: startup.employees.map((e) => ({
        role: e.role,
        status: e.status,
      })),
      missions: startup.missions.map((m) => ({
        title: m.title,
        status: m.status,
        category: m.category,
      })),
    },
    socialState,
    career,
  };

  const documentary = generateDocumentary(engineInput);

  return {
    documentary,
    startup: {
      id: startup.id,
      name: startup.name,
      status: startup.status,
      sector: startup.sector,
      publicSlug: startup.publicSlug ?? null,
      finalOutcome: startup.finalOutcome ?? null,
    },
    isFinalized,
  };
}
