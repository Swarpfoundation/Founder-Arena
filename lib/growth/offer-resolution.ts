import { StrategicOffer } from "./types";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface ResolveOfferInput {
  offer: StrategicOffer;
  action: "accept" | "reject" | "counter" | "defer";
  startupId: string;
  currentCash: number;
  currentValuation: number;
  currentRevenue: number;
}

export interface ResolveOfferResult {
  success: boolean;
  narrative: string;
  cashDelta: number;
  valuationDelta: number;
  equityDelta: number;
  /**
   * Proposed startup status after this offer resolves.
   * Only present when the offer actually changes startup status:
   *   - "acquired"  → acquisition/acquihire accepted
   *   - "funded"    → investment/cloud-credits accepted, or counter accepted
   *   - "completed" → rejected or counter rejected
   * Absent for partnership/distribution/api_partnership/platform_integration accepts —
   * those only apply economic deltas; startup status/stage are NOT changed.
   */
  newStatus?: string;
  /**
   * Proposed startup stage after this offer resolves.
   * Absent when newStatus is absent (same conditions apply).
   */
  newStage?: string;
  fundingRound?: {
    roundType: string;
    amountRaised: number;
    equitySold: number;
    preMoneyValuation: number;
    postMoneyValuation: number;
    investorName: string;
    investorType: string;
  };
  acquisitionOutcome?: {
    acquisitionPrice: number;
    acquirerName: string;
    finalReturn: number;
  };
}

export function resolveOffer(input: ResolveOfferInput): ResolveOfferResult {
  const { offer, action, currentCash, currentValuation } = input;

  switch (action) {
    case "accept":
      return resolveAccept(offer, currentCash, currentValuation);
    case "reject":
      return resolveReject(offer);
    case "counter":
      return resolveCounter(offer, currentCash, currentValuation);
    case "defer":
      return resolveDefer(offer);
    default:
      return {
        success: false,
        narrative: "Invalid action.",
        cashDelta: 0,
        valuationDelta: 0,
        equityDelta: 0,
        newStatus: "completed",
        newStage: "not_started",
      };
  }
}

function resolveAccept(offer: StrategicOffer, currentCash: number, currentValuation: number): ResolveOfferResult {
  switch (offer.offerType) {
    case "strategic_investment":
    case "cloud_credits": {
      const amount = offer.amount ?? 0;
      const equity = offer.equityPercent ?? 0;
      const preMoney = currentValuation;
      const postMoney = preMoney + amount;
      return {
        success: true,
        narrative: `Accepted ${offer.actorName}'s ${offer.headline}. Cash increased by ${formatCurrency(amount)}.`,
        cashDelta: amount,
        valuationDelta: amount,
        equityDelta: equity,
        newStatus: "funded",
        newStage: "strategic_negotiation",
        fundingRound: {
          roundType: offer.offerType === "cloud_credits" ? "strategic_round" : "strategic_round",
          amountRaised: amount,
          equitySold: equity,
          preMoneyValuation: preMoney,
          postMoneyValuation: postMoney,
          investorName: offer.actorName,
          investorType: "strategic",
        },
      };
    }
    case "acquisition":
    case "acquihire": {
      const price = offer.acquisitionPrice ?? currentValuation;
      const finalReturn = price - currentValuation;
      return {
        success: true,
        narrative: `Accepted ${offer.actorName}'s acquisition offer for ${formatCurrency(price)}.`,
        cashDelta: price,
        valuationDelta: 0,
        equityDelta: 0,
        newStatus: "acquired",
        newStage: "acquired",
        acquisitionOutcome: {
          acquisitionPrice: price,
          acquirerName: offer.actorName,
          finalReturn,
        },
      };
    }
    case "partnership":
    case "distribution_deal":
    case "api_partnership":
    case "platform_integration": {
      // No equity, no formal funding round, no status/stage transition.
      // Only the valuation delta is persisted (10% boost).
      // newStatus and newStage are intentionally omitted — the startup keeps
      // whatever status/stage it had before accepting this offer.
      return {
        success: true,
        narrative: `Partnered with ${offer.actorName}. Revenue and distribution benefits will apply to future months.`,
        cashDelta: 0,
        valuationDelta: Math.round(currentValuation * 0.1),
        equityDelta: 0,
      };
    }
    default:
      return {
        success: false,
        narrative: "Offer type not supported for acceptance.",
        cashDelta: 0,
        valuationDelta: 0,
        equityDelta: 0,
        newStatus: "completed",
        newStage: "not_started",
      };
  }
}

function resolveReject(offer: StrategicOffer): ResolveOfferResult {
  return {
    success: true,
    narrative: `Rejected ${offer.actorName}'s offer. Investor confidence may dip slightly, but independence preserved.`,
    cashDelta: 0,
    valuationDelta: Math.round(-(offer.valuation ?? 0) * 0.02), // Small negative signal
    equityDelta: 0,
    newStatus: "completed",
    newStage: "not_started",
  };
}

function resolveCounter(offer: StrategicOffer, currentCash: number, currentValuation: number): ResolveOfferResult {
  // Deterministic counter outcome based on fit score
  const willAccept = (offer.fitScore ?? 0) >= 60;

  if (willAccept) {
    // Actor accepts counter with slightly better terms
    const improvedAmount = Math.round((offer.amount ?? 0) * 1.05);
    const improvedValuation = Math.round((offer.valuation ?? currentValuation) * 1.05);
    const equity = offer.equityPercent ?? 0;
    const preMoney = currentValuation;
    const postMoney = preMoney + (improvedAmount - (offer.amount ?? 0));

    return {
      success: true,
      narrative: `${offer.actorName} accepted your counter. Final terms: ${formatCurrency(improvedAmount)} at ${formatCurrency(improvedValuation)} valuation.`,
      cashDelta: improvedAmount,
      valuationDelta: improvedAmount - (offer.amount ?? 0),
      equityDelta: equity,
      newStatus: "funded",
      newStage: "strategic_negotiation",
      fundingRound: {
        roundType: "strategic_round",
        amountRaised: improvedAmount,
        equitySold: equity,
        preMoneyValuation: preMoney,
        postMoneyValuation: postMoney,
        investorName: offer.actorName,
        investorType: "strategic",
      },
    };
  }

  // Actor rejects counter
  return {
    success: true,
    narrative: `${offer.actorName} rejected your counter. The offer is off the table.`,
    cashDelta: 0,
    valuationDelta: Math.round(-(offer.valuation ?? 0) * 0.03),
    equityDelta: 0,
    newStatus: "completed",
    newStage: "not_started",
  };
}

function resolveDefer(offer: StrategicOffer): ResolveOfferResult {
  return {
    success: true,
    narrative: `Deferred ${offer.actorName}'s offer. You have ${offer.expiresInMonths} months to decide before it expires.`,
    cashDelta: 0,
    valuationDelta: 0,
    equityDelta: 0,
    newStatus: "completed",
    newStage: "not_started",
  };
}

/**
 * Map an action + result to the persisted GrowthOffer status string.
 *
 * `result.success` is always true for reject/defer/counter-fail (they are
 * valid resolved states, not errors) — so we cannot use it alone to infer
 * the persisted status. We derive it from the action and, for "counter",
 * from whether the actor ultimately funded the deal.
 *
 * Exported for unit testing.
 */
export function resolvedStatus(
  action: "accept" | "reject" | "counter" | "defer",
  result: ResolveOfferResult
): string {
  switch (action) {
    case "accept":
      return "accepted";
    case "reject":
      return "rejected";
    case "defer":
      return "deferred";
    case "counter":
      // Counter is accepted when the actor funds the deal (newStatus === "funded").
      // newStatus is absent for economic-only partnership offers; undefined !== "funded"
      // correctly resolves to "rejected" for those edge cases.
      return result.newStatus === "funded" ? "accepted" : "rejected";
  }
}

export async function persistOfferResolution(
  startupId: string,
  offer: StrategicOffer,
  result: ResolveOfferResult,
  action: "accept" | "reject" | "counter" | "defer"
): Promise<void> {
  await db.growthOffer.create({
    data: {
      startupId,
      actorId: offer.actorId,
      actorName: offer.actorName,
      actorType: offer.actorType,
      offerType: offer.offerType,
      status: resolvedStatus(action, result),
      headline: offer.headline,
      amount: offer.amount,
      equityPercent: offer.equityPercent ? new Prisma.Decimal(offer.equityPercent) : null,
      acquisitionPrice: offer.acquisitionPrice,
      valuation: offer.valuation,
      terms: offer.terms as unknown as Prisma.InputJsonValue,
      benefits: offer.benefits as unknown as Prisma.InputJsonValue,
      risks: offer.risks as unknown as Prisma.InputJsonValue,
      counterTerms: result.fundingRound
        ? ({
            amount: result.fundingRound.amountRaised,
            equity: result.fundingRound.equitySold,
            valuation: result.fundingRound.postMoneyValuation,
          } as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      resolvedAt: new Date(),
    },
  });

  // Update startup status/stage if acquisition or major round
  if (result.newStatus === "acquired") {
    await db.startup.update({
      where: { id: startupId },
      data: {
        status: "completed",
        stage: "acquired",
        finalOutcome: "ACQUIRED",
        finalSummary: result.narrative,
        cash: { increment: result.cashDelta },
        aiAnalysis: {
          ...(await db.startup.findUnique({ where: { id: startupId }, select: { aiAnalysis: true } }))?.aiAnalysis as Record<string, unknown> ?? {},
          acquisition: {
            acquirer: offer.actorName,
            price: result.acquisitionOutcome?.acquisitionPrice,
            date: new Date().toISOString(),
          },
        } as unknown as Prisma.InputJsonValue,
      },
    });
  } else if (result.fundingRound) {
    await db.$transaction([
      db.fundingRound.create({
        data: {
          startupId,
          roundType: result.fundingRound.roundType,
          amountRaised: result.fundingRound.amountRaised,
          equitySold: new Prisma.Decimal(result.fundingRound.equitySold),
          preMoneyValuation: result.fundingRound.preMoneyValuation,
          postMoneyValuation: result.fundingRound.postMoneyValuation,
          investorName: result.fundingRound.investorName,
          status: "closed",
          closedAt: new Date(),
        },
      }),
      db.startup.update({
        where: { id: startupId },
        data: {
          cash: { increment: result.cashDelta },
          valuation: { increment: result.valuationDelta },
          stage: result.newStage,
        },
      }),
    ]);
  } else if (result.cashDelta !== 0 || result.valuationDelta !== 0) {
    // Accepted partnership / distribution / platform_integration / api_partnership
    // offers: no formal FundingRound row is created, but the economic delta
    // (e.g. the 10% valuation boost for a partnership) must still be persisted.
    // Status/stage are intentionally NOT changed here — the startup's game-flow
    // state is set by the simulation layer, not by non-equity partnership accepts.
    await db.startup.update({
      where: { id: startupId },
      data: {
        ...(result.cashDelta !== 0 ? { cash: { increment: result.cashDelta } } : {}),
        ...(result.valuationDelta !== 0 ? { valuation: { increment: result.valuationDelta } } : {}),
      },
    });
  }
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}
