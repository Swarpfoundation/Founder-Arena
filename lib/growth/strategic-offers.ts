import { StrategicActor, StrategicOffer, GrowthStateContext } from "./types";
import { calculateStrategicFit, calculateAcquisitionReadiness, calculateSeriesAReadiness } from "./eligibility";

function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function hashString(str: string): number {
  let h = 1779033703;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

function seededChoice<T>(seed: number, items: T[]): T {
  return items[Math.floor(seededRandom(seed) * items.length)];
}

function seededRange(seed: number, min: number, max: number): number {
  return min + seededRandom(seed) * (max - min);
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function generateStrategicOffers(
  ctx: GrowthStateContext,
  actors: StrategicActor[],
  marketSnapshot: { condition: string } | null
): StrategicOffer[] {
  const offers: StrategicOffer[] = [];
  const baseSeed = hashString(`${ctx.startupId}:growth`);

  for (let i = 0; i < actors.length; i++) {
    const actor = actors[i];
    const fit = calculateStrategicFit(ctx, actor.id, actor.sectorsOfInterest);

    // Only generate offers for actors with at least borderline fit
    if (fit.score < 30) continue;

    const seed = baseSeed + i * 7919;
    const offer = generateOfferForActor(ctx, actor, fit.score, seed, marketSnapshot);
    if (offer) offers.push(offer);
  }

  // Sort by fit score descending
  offers.sort((a, b) => b.fitScore - a.fitScore);

  // Cap at 5 offers max
  return offers.slice(0, 5);
}

function generateOfferForActor(
  ctx: GrowthStateContext,
  actor: StrategicActor,
  fitScore: number,
  seed: number,
  marketSnapshot: { condition: string } | null
): StrategicOffer | null {
  const acquisitionReadiness = calculateAcquisitionReadiness(ctx);
  const seriesAReadiness = calculateSeriesAReadiness(ctx);

  // Determine offer type based on fit and actor preferences
  const possibleTypes = actor.partnershipTypes.filter((t) => {
    if (t === "acquisition") return acquisitionReadiness.score >= 40;
    if (t === "strategic_investment") return seriesAReadiness.score >= 30 || fitScore >= 50;
    return fitScore >= 35;
  });

  if (possibleTypes.length === 0) return null;

  const offerType = seededChoice(seed, possibleTypes);
  const marketMultiplier = marketSnapshot?.condition === "bullish" ? 1.1 : marketSnapshot?.condition === "bearish" ? 0.9 : 1.0;

  let amount: number | null = null;
  let equityPercent: number | null = null;
  let acquisitionPrice: number | null = null;
  let valuation: number | null = null;
  let headline = "";
  let terms: string[] = [];
  let benefits: string[] = [];
  let risks: string[] = [];
  let conditions: string[] = [];
  let recommendedAction: StrategicOffer["recommendedAction"] = "counter";

  switch (offerType) {
    case "strategic_investment": {
      const range = actor.investmentRange;
      amount = Math.round(seededRange(seed + 1, range.min, range.max) * marketMultiplier);
      equityPercent = clamp(Number((seededRange(seed + 2, 5, 20)).toFixed(2)), 5, 20);
      valuation = Math.round(amount / (equityPercent / 100));
      headline = `${actor.displayName} proposes a ${formatCurrency(amount)} strategic investment`;
      terms = [`${equityPercent}% equity stake`, "Board observer seat", "Pro-rata rights in future rounds"];
      benefits = ["Strategic distribution channels", "Access to enterprise customer base", "Technical infrastructure credits"];
      risks = ["Potential product roadmap influence", "Dilution of founder control"];
      conditions = ["Revenue milestone of $30K/month within 12 months", "Quarterly board reporting"];
      recommendedAction = fitScore >= 60 ? "accept" : "counter";
      break;
    }
    case "acquisition": {
      const range = actor.acquisitionRange;
      acquisitionPrice = Math.round(seededRange(seed + 3, range.min, Math.min(range.max, ctx.valuation * 3)) * marketMultiplier);
      headline = `${actor.displayName} offers ${formatCurrency(acquisitionPrice)} acquisition`;
      terms = ["All-cash acquisition", "24-month earnout for founders", "Team retention bonuses"];
      benefits = ["Immediate liquidity for founders", "Access to global infrastructure", "Career growth for team"];
      risks = ["Loss of independence", "Product may be sunset", "Culture clash"];
      conditions = ["Due diligence within 60 days", "Key employee retention agreements"];
      recommendedAction = acquisitionPrice >= ctx.valuation * 1.5 ? "accept" : acquisitionPrice >= ctx.valuation ? "counter" : "reject";
      break;
    }
    case "partnership": {
      headline = `${actor.displayName} proposes strategic partnership`;
      terms = ["Co-marketing agreement", "Joint customer success program", "Revenue sharing on referrals"];
      benefits = ["Instant credibility boost", "Access to partner sales team", "Shared marketing budget"];
      risks = ["Revenue sharing reduces margins", "Dependency on partner pipeline"];
      conditions = ["Minimum $10K/month in referred revenue within 6 months", "Quarterly business reviews"];
      recommendedAction = fitScore >= 55 ? "accept" : "counter";
      break;
    }
    case "distribution_deal": {
      headline = `${actor.displayName} offers distribution partnership`;
      terms = ["Featured placement in marketplace", "Reduced platform fees (5% vs 15%)", "Co-branded marketing campaigns"];
      benefits = ["Immediate access to large user base", "Lower customer acquisition cost", "Credibility signal"];
      risks = ["Platform dependency", "Fee structure may change", "Limited pricing control"];
      conditions = ["Maintain 4.5+ user rating", "Exclusive distribution for 6 months"];
      recommendedAction = fitScore >= 50 ? "accept" : "counter";
      break;
    }
    case "cloud_credits": {
      amount = Math.round(seededRange(seed + 4, 50_000, 500_000));
      headline = `${actor.displayName} offers ${formatCurrency(amount)} in infrastructure credits`;
      terms = ["Credits valid for 24 months", "Must host on partner platform", "Technical support included"];
      benefits = ["Dramatically reduced burn rate", "Enterprise-grade infrastructure", "Technical mentorship"];
      risks = ["Vendor lock-in", "Migration costs if switching later"];
      conditions = ["Usage must grow 20% quarter-over-quarter", "Public case study after 12 months"];
      recommendedAction = ctx.monthlyBurn > 20_000 ? "accept" : "counter";
      break;
    }
    case "api_partnership": {
      headline = `${actor.displayName} proposes API integration partnership`;
      terms = ["Priority API access", "Joint solution development", "Revenue share on combined deals"];
      benefits = ["Enhanced product capabilities", "Co-sell opportunities", "Technical validation"];
      risks = ["API dependency", "Feature parity pressure"];
      conditions = ["Launch integration within 90 days", "Minimum 100 API calls/day within 6 months"];
      recommendedAction = fitScore >= 50 ? "accept" : "counter";
      break;
    }
    case "platform_integration": {
      headline = `${actor.displayName} offers native platform integration`;
      terms = ["First-party integration status", "Featured in app directory", "Joint go-to-market"];
      benefits = ["Massive distribution boost", "Built-in trust signal", "Reduced CAC"];
      risks = ["Platform dependency", "Integration maintenance burden", "Policy change risk"];
      conditions = ["Pass security review within 60 days", "Maintain 99.9% uptime SLA"];
      recommendedAction = fitScore >= 55 ? "accept" : "counter";
      break;
    }
    case "acquihire": {
      acquisitionPrice = Math.round(seededRange(seed + 5, 500_000, Math.min(5_000_000, ctx.valuation * 1.2)) * marketMultiplier);
      headline = `${actor.displayName} proposes ${formatCurrency(acquisitionPrice)} acquihire`;
      terms = ["Team retention for 24 months", "Founder earnout based on milestones", "IP transfer"];
      benefits = ["Team gets stability and resources", "Founders get liquidity", "Product lives on"];
      risks = ["Loss of autonomy", "Product direction may change", "Team culture disruption"];
      conditions = ["80% of team agrees to join", "IP ownership clear"];
      recommendedAction = acquisitionPrice >= ctx.valuation ? "counter" : "reject";
      break;
    }
  }

  return {
    offerId: `offer-${actor.id}-${seed}`,
    actorId: actor.id,
    actorName: actor.displayName,
    actorType: actor.actorType,
    offerType,
    headline,
    amount,
    equityPercent,
    acquisitionPrice,
    valuation,
    terms,
    benefits,
    risks,
    conditions,
    expiresInMonths: Math.round(seededRange(seed + 6, 1, 3)),
    recommendedAction,
    fitScore: Math.round(fitScore),
  };
}

export function generateGrowthRoundOffer(
  ctx: GrowthStateContext,
  roundType: string,
  marketSnapshot: { condition: string } | null
): StrategicOffer | null {
  const seed = hashString(`${ctx.startupId}:${roundType}`);
  const marketMultiplier = marketSnapshot?.condition === "bullish" ? 1.15 : marketSnapshot?.condition === "bearish" ? 0.85 : 1.0;

  let amount = 0;
  let equityPercent = 0;
  let valuation = 0;
  let headline = "";

  switch (roundType) {
    case "seed_extension":
      amount = Math.round(seededRange(seed, 250_000, 750_000) * marketMultiplier);
      equityPercent = clamp(Number((seededRange(seed + 1, 10, 20)).toFixed(2)), 10, 20);
      valuation = Math.round(amount / (equityPercent / 100));
      headline = `Seed Extension: ${formatCurrency(amount)}`;
      break;
    case "series_a":
      amount = Math.round(seededRange(seed, 2_000_000, 10_000_000) * marketMultiplier);
      equityPercent = clamp(Number((seededRange(seed + 1, 15, 25)).toFixed(2)), 15, 25);
      valuation = Math.round(amount / (equityPercent / 100));
      headline = `Series A: ${formatCurrency(amount)}`;
      break;
    case "series_b":
      amount = Math.round(seededRange(seed, 10_000_000, 50_000_000) * marketMultiplier);
      equityPercent = clamp(Number((seededRange(seed + 1, 10, 20)).toFixed(2)), 10, 20);
      valuation = Math.round(amount / (equityPercent / 100));
      headline = `Series B: ${formatCurrency(amount)}`;
      break;
    case "strategic_round":
      amount = Math.round(seededRange(seed, 5_000_000, 25_000_000) * marketMultiplier);
      equityPercent = clamp(Number((seededRange(seed + 1, 8, 18)).toFixed(2)), 8, 18);
      valuation = Math.round(amount / (equityPercent / 100));
      headline = `Strategic Round: ${formatCurrency(amount)}`;
      break;
    case "bridge_round":
      amount = Math.round(seededRange(seed, 500_000, 2_000_000) * marketMultiplier);
      equityPercent = clamp(Number((seededRange(seed + 1, 5, 15)).toFixed(2)), 5, 15);
      valuation = Math.round(amount / (equityPercent / 100));
      headline = `Bridge Round: ${formatCurrency(amount)}`;
      break;
    default:
      return null;
  }

  return {
    offerId: `growth-${roundType}-${seed}`,
    actorId: "growth_investor",
    actorName: "Growth Capital",
    actorType: "vc",
    offerType: "strategic_investment",
    headline,
    amount,
    equityPercent,
    acquisitionPrice: null,
    valuation,
    terms: [`${equityPercent}% equity`, "Standard pro-rata", "Information rights"],
    benefits: ["Fresh capital for scaling", "Validation from new investors", "Extended runway"],
    risks: ["Dilution", "Higher expectations", "Board dynamics"],
    conditions: ["Monthly reporting", "Burn rate targets"],
    expiresInMonths: 2,
    recommendedAction: amount >= ctx.valuation * 0.3 ? "accept" : "counter",
    fitScore: 60,
  };
}
