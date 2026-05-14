"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireCurrentUser } from "@/lib/auth-helpers";
import { generateTermSheet } from "@/lib/terms/generate-term-sheet";
import { evaluateCounterOffer } from "@/lib/terms/negotiation";
import { CounterOfferInput } from "@/lib/terms/types";
import { getOrCreateFounderProfile } from "@/lib/game/founder-progression";
import { evaluateAchievementsForFunding } from "@/lib/game/achievements";
import { checkRateLimit } from "@/lib/rate-limit";
import { recomputeStartupBaseBurn } from "@/lib/economy/recompute-burn";
import { ai } from "@/lib/ai";
import { z } from "zod";

const counterOfferSchema = z.object({
  requestedInvestmentAmount: z.coerce.number().min(25000).max(10000000),
  offeredEquityPercent: z.coerce.number().min(0.1).max(49),
  founderSalaryCap: z.coerce.number().min(0).max(500000),
  boardSeatAccepted: z.coerce.boolean(),
  boardObserverAccepted: z.coerce.boolean(),
  notes: z.string().max(1000),
});

export async function getOrCreateTermSheet(startupId: string) {
  const user = await requireCurrentUser();

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: { vcReviews: { orderBy: { createdAt: "desc" } } },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Startup not found");
  }

  const existing = await db.termSheet.findFirst({
    where: { startupId },
    orderBy: { createdAt: "desc" },
  });

  if (existing) return existing;

  const latestReview = startup.vcReviews[0];
  if (!latestReview) {
    throw new Error("No VC review found");
  }

  // Only generate term sheet for investable decisions
  const investableDecisions = ["proposal", "accept"];
  if (!investableDecisions.includes(latestReview.decision)) {
    throw new Error("Review is not investable");
  }

  const input = generateTermSheet({
    startupId,
    vcReviewId: latestReview.id,
    vcDecision: latestReview.decision,
    overallScore: latestReview.overallScore ?? 50,
    riskScore: startup.riskScore,
    marketScore: startup.marketScore,
    investorScore: startup.investorScore,
    proposedAmount: latestReview.proposedAmount,
    proposedEquity: latestReview.proposedEquity ? Number(latestReview.proposedEquity) : null,
    fundingAsk: startup.fundingAsk,
    sector: startup.sector,
  });

  const termSheet = await db.termSheet.create({
    data: {
      startupId: input.startupId,
      vcReviewId: input.vcReviewId,
      status: "proposed",
      proposedAmount: input.proposedAmount,
      proposedEquity: input.proposedEquity,
      preMoneyValuation: input.preMoneyValuation,
      postMoneyValuation: input.postMoneyValuation,
      founderSalaryCap: input.founderSalaryCap,
      boardSeat: input.boardSeat,
      boardObserver: input.boardObserver,
      liquidationPreference: input.liquidationPreference,
      proRataRights: input.proRataRights,
      milestoneRequirements: input.milestoneRequirements,
      investorNotes: input.investorNotes,
      expiresAt: input.expiresAt,
    },
  });

  return termSheet;
}

export async function getTermSheet(startupId: string) {
  const user = await requireCurrentUser();

  const startup = await db.startup.findUnique({ where: { id: startupId } });
  if (!startup || startup.userId !== user.id) {
    throw new Error("Startup not found");
  }

  return db.termSheet.findFirst({
    where: { startupId },
    orderBy: { createdAt: "desc" },
  });
}

export async function submitCounterOfferAction(startupId: string, data: CounterOfferInput) {
  const user = await requireCurrentUser();

  const rateLimitError = await checkRateLimit(user.id, "termNegotiation");
  if (rateLimitError) {
    throw new Error(rateLimitError);
  }

  const validated = counterOfferSchema.parse(data);

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: { vcReviews: { orderBy: { createdAt: "desc" } } },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  const termSheet = await db.termSheet.findFirst({
    where: { startupId },
    orderBy: { createdAt: "desc" },
  });

  if (!termSheet) {
    throw new Error("No term sheet found");
  }

  if (termSheet.status !== "proposed" && termSheet.status !== "countered") {
    throw new Error("Term sheet is not open for negotiation");
  }

  const latestReview = startup.vcReviews[0];
  const overallScore = latestReview?.overallScore ?? 50;

  const result = evaluateCounterOffer({
    counter: validated,
    currentTerms: {
      startupId,
      vcReviewId: termSheet.vcReviewId ?? "",
      proposedAmount: termSheet.proposedAmount,
      proposedEquity: Number(termSheet.proposedEquity),
      preMoneyValuation: termSheet.preMoneyValuation,
      postMoneyValuation: termSheet.postMoneyValuation,
      boardSeat: termSheet.boardSeat,
      boardObserver: termSheet.boardObserver,
      liquidationPreference: Number(termSheet.liquidationPreference),
      proRataRights: termSheet.proRataRights,
      founderSalaryCap: termSheet.founderSalaryCap ?? undefined,
      milestoneRequirements: termSheet.milestoneRequirements ?? undefined,
      investorNotes: termSheet.investorNotes ?? undefined,
    },
    overallScore,
    riskScore: startup.riskScore,
  });

  const historyEntry = {
    type: "counter",
    date: new Date().toISOString(),
    counter: validated,
    outcome: result.outcome,
    message: result.message,
  };

  const currentHistory = (termSheet.negotiationHistory as unknown as Array<Record<string, unknown>> | null) ?? [];

  if (result.outcome === "accept_counter") {
    await db.termSheet.update({
      where: { id: termSheet.id },
      data: {
        status: "countered",
        proposedAmount: validated.requestedInvestmentAmount,
        proposedEquity: validated.offeredEquityPercent,
        preMoneyValuation: Math.round(
          validated.requestedInvestmentAmount / (validated.offeredEquityPercent / 100) - validated.requestedInvestmentAmount
        ),
        postMoneyValuation: Math.round(validated.requestedInvestmentAmount / (validated.offeredEquityPercent / 100)),
        founderSalaryCap: validated.founderSalaryCap,
        boardSeat: validated.boardSeatAccepted,
        boardObserver: validated.boardObserverAccepted,
        founderCounter: validated as unknown as Prisma.InputJsonValue,
        negotiationHistory: [...currentHistory, historyEntry] as unknown as Prisma.InputJsonValue,
      },
    });
  } else if (result.outcome === "revise_terms" && result.revisedTerms) {
    const revised = result.revisedTerms;
    await db.termSheet.update({
      where: { id: termSheet.id },
      data: {
        status: "countered",
        proposedAmount: revised.proposedAmount ?? termSheet.proposedAmount,
        proposedEquity: revised.proposedEquity ?? termSheet.proposedEquity,
        preMoneyValuation: revised.preMoneyValuation ?? termSheet.preMoneyValuation,
        postMoneyValuation: revised.postMoneyValuation ?? termSheet.postMoneyValuation,
        founderSalaryCap: revised.founderSalaryCap ?? termSheet.founderSalaryCap,
        boardSeat: revised.boardSeat ?? termSheet.boardSeat,
        boardObserver: revised.boardObserver ?? termSheet.boardObserver,
        investorNotes: revised.investorNotes ?? termSheet.investorNotes,
        founderCounter: validated as unknown as Prisma.InputJsonValue,
        negotiationHistory: [...currentHistory, historyEntry] as unknown as Prisma.InputJsonValue,
      },
    });
  } else {
    await db.termSheet.update({
      where: { id: termSheet.id },
      data: {
        status: "rejected",
        founderCounter: validated as unknown as Prisma.InputJsonValue,
        negotiationHistory: [...currentHistory, historyEntry] as unknown as Prisma.InputJsonValue,
      },
    });
  }

  revalidatePath(`/startup/${startupId}/terms`);
  return { outcome: result.outcome, message: result.message };
}

export async function acceptTermSheetAction(startupId: string) {
  const user = await requireCurrentUser();

  const startup = await db.startup.findUnique({ where: { id: startupId } });
  if (!startup || startup.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  const termSheet = await db.termSheet.findFirst({
    where: { startupId },
    orderBy: { createdAt: "desc" },
  });

  if (!termSheet) {
    throw new Error("No term sheet found");
  }

  if (termSheet.status !== "proposed" && termSheet.status !== "countered") {
    throw new Error("Term sheet cannot be accepted");
  }

  const roundType =
    termSheet.proposedAmount < 500000
      ? "pre_seed"
      : termSheet.proposedAmount < 2000000
      ? "seed"
      : "series_a";

  await db.$transaction(async (tx) => {
    await tx.termSheet.update({
      where: { id: termSheet.id },
      data: { status: "accepted" },
    });

    await tx.fundingRound.create({
      data: {
        startupId,
        termSheetId: termSheet.id,
        vcReviewId: termSheet.vcReviewId,
        roundType,
        amountRaised: termSheet.proposedAmount,
        equitySold: termSheet.proposedEquity,
        preMoneyValuation: termSheet.preMoneyValuation,
        postMoneyValuation: termSheet.postMoneyValuation,
        investorName: "AI VC Fund",
        status: "closed",
        closedAt: new Date(),
      },
    });

    await tx.startup.update({
      where: { id: startupId },
      data: {
        cash: { increment: termSheet.proposedAmount },
        stage: roundType === "series_a" ? "series_a" : roundType === "seed" ? "seed" : "pre_seed",
        status: "funded",
        valuation: termSheet.postMoneyValuation,
      },
    });

    // Initialize burn invariant: even before any hires, baseBurn must
    // include the office cost from the current workSetup.
    await recomputeStartupBaseBurn(tx, startupId);
  });

  // Phase 14: Founder coaching on term sheet accept
  try {
    const coaching = await ai.generateFounderCoaching({
      context: "term_sheet",
      startupName: startup.name,
      sector: startup.sector,
      outcomeSummary: `Accepted ${termSheet.proposedAmount} for ${termSheet.proposedEquity}% equity`,
    });
    await db.startup.update({
      where: { id: startupId },
      data: {
        aiAnalysis: {
          ...(startup.aiAnalysis as Record<string, unknown> ?? {}),
          termSheetCoaching: coaching,
        } as unknown as Prisma.InputJsonValue,
      },
    });
  } catch {
    // Coaching is non-critical
  }

  // Grant funded founder achievement
  const profile = await getOrCreateFounderProfile(user.id);
  await evaluateAchievementsForFunding(profile.id);

  revalidatePath(`/startup/${startupId}`);
  revalidatePath(`/startup/${startupId}/terms`);
  revalidatePath("/dashboard");
  redirect(`/startup/${startupId}/operate`);
}

export async function rejectTermSheetAction(startupId: string) {
  const user = await requireCurrentUser();

  const startup = await db.startup.findUnique({ where: { id: startupId } });
  if (!startup || startup.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  const termSheet = await db.termSheet.findFirst({
    where: { startupId },
    orderBy: { createdAt: "desc" },
  });

  if (!termSheet) {
    throw new Error("No term sheet found");
  }

  await db.termSheet.update({
    where: { id: termSheet.id },
    data: { status: "rejected" },
  });

  // Phase 14: Founder coaching on term sheet reject
  try {
    const coaching = await ai.generateFounderCoaching({
      context: "term_sheet",
      startupName: startup.name,
      sector: startup.sector,
      outcomeSummary: "Rejected term sheet terms",
    });
    await db.startup.update({
      where: { id: startupId },
      data: {
        aiAnalysis: {
          ...(startup.aiAnalysis as Record<string, unknown> ?? {}),
          termSheetCoaching: coaching,
        } as unknown as Prisma.InputJsonValue,
      },
    });
  } catch {
    // Coaching is non-critical
  }

  revalidatePath(`/startup/${startupId}/terms`);
  return { success: true };
}
