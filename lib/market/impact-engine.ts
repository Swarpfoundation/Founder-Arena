import { StartupExposure, MarketScenario, MarketImpactResult, MacroScores } from "./types";

function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
}

function deriveDifficultyScore(macro: MacroScores): number {
  // Higher difficulty when markets are hostile
  let score = 50; // baseline
  score -= macro.vcClimate * 0.2;
  score -= macro.consumerSpending * 0.1;
  score -= macro.enterpriseSpending * 0.1;
  score += macro.inflationPressure * 0.15;
  score += macro.geopoliticalRisk * 0.15;
  score += macro.regulationPressure * 0.15;
  score += macro.supplyChainPressure * 0.1;
  score += macro.energyPrices * 0.05;
  // AI/crypto are opportunity factors, not pure difficulty
  score -= macro.aiDemand * 0.05;
  score -= macro.cryptoSentiment * 0.03;
  return clamp(Math.round(score), 10, 95);
}

export function calculateMarketImpactForStartup(
  startupSector: string,
  startupRegion: string,
  exposure: StartupExposure,
  scenario: MarketScenario,
  currentMonth: number
): MarketImpactResult {
  const mod = scenario.sectorModifiers;
  const macro = scenario.macro;

  // Find matching sector modifier
  let sectorMod = mod[startupSector.toLowerCase()];
  if (!sectorMod) {
    // Try fuzzy match
    const keys = Object.keys(mod);
    const match = keys.find((k) => startupSector.toLowerCase().includes(k));
    if (match) sectorMod = mod[match];
  }

  // Base deltas from scenario macro (applies to all, but weighted by exposure)
  const monthWeight = 1 + Math.sin(currentMonth * 0.5) * 0.1; // slight month variation, deterministic

  let demandDelta = 0;
  let revenueDelta = 0;
  let burnDelta = 0;
  let valuationDelta = 0;
  let investorDelta = 0;
  let riskDelta = 0;


  const affectedBecause: string[] = [];

  // Apply sector-specific modifier if matched
  if (sectorMod) {
    demandDelta += sectorMod.demandDelta * monthWeight;
    revenueDelta += sectorMod.revenueDelta * monthWeight;
    burnDelta += sectorMod.burnDelta * monthWeight;
    valuationDelta += sectorMod.valuationDelta * monthWeight;
    investorDelta += sectorMod.investorDelta * monthWeight;
    riskDelta += sectorMod.riskDelta * monthWeight;
    affectedBecause.push(`Sector match: ${startupSector}`);
  }

  // Apply macro-driven effects based on exposure
  if (exposure.macro.aiTrend > 50 && macro.aiDemand > 30) {
    const boost = (macro.aiDemand / 100) * (exposure.macro.aiTrend / 100) * 10;
    revenueDelta += boost;
    valuationDelta += boost * 1.2;
    affectedBecause.push("AI tailwind");
  }
  if (exposure.macro.aiTrend > 50 && macro.aiDemand < -20) {
    const drag = (Math.abs(macro.aiDemand) / 100) * (exposure.macro.aiTrend / 100) * 8;
    revenueDelta -= drag;
    investorDelta -= drag;
    affectedBecause.push("AI demand slowdown");
  }

  if (exposure.macro.cryptoCycle > 50 && macro.cryptoSentiment > 30) {
    const boost = (macro.cryptoSentiment / 100) * (exposure.macro.cryptoCycle / 100) * 15;
    revenueDelta += boost;
    valuationDelta += boost * 1.5;
    affectedBecause.push("Crypto bull sentiment");
  }
  if (exposure.macro.cryptoCycle > 50 && macro.cryptoSentiment < -20) {
    const drag = (Math.abs(macro.cryptoSentiment) / 100) * (exposure.macro.cryptoCycle / 100) * 12;
    revenueDelta -= drag;
    riskDelta += drag;
    affectedBecause.push("Crypto winter drag");
  }

  if (exposure.macro.regulation > 50 && macro.regulationPressure > 30) {
    const drag = (macro.regulationPressure / 100) * (exposure.macro.regulation / 100) * 10;
    burnDelta += drag;
    riskDelta += drag;
    valuationDelta -= drag;
    affectedBecause.push("Regulatory pressure");
  }

  if (exposure.macro.consumerDemand > 50 && macro.consumerSpending > 20) {
    const boost = (macro.consumerSpending / 100) * (exposure.macro.consumerDemand / 100) * 8;
    revenueDelta += boost;
    demandDelta += boost;
    affectedBecause.push("Strong consumer spending");
  }
  if (exposure.macro.consumerDemand > 50 && macro.consumerSpending < -20) {
    const drag = (Math.abs(macro.consumerSpending) / 100) * (exposure.macro.consumerDemand / 100) * 10;
    revenueDelta -= drag;
    demandDelta -= drag;
    affectedBecause.push("Weak consumer spending");
  }

  if (exposure.macro.enterpriseDemand > 50 && macro.enterpriseSpending > 20) {
    const boost = (macro.enterpriseSpending / 100) * (exposure.macro.enterpriseDemand / 100) * 8;
    revenueDelta += boost;
    demandDelta += boost;
    affectedBecause.push("Strong enterprise budgets");
  }
  if (exposure.macro.enterpriseDemand > 50 && macro.enterpriseSpending < -20) {
    const drag = (Math.abs(macro.enterpriseSpending) / 100) * (exposure.macro.enterpriseDemand / 100) * 8;
    revenueDelta -= drag;
    demandDelta -= drag;
    affectedBecause.push("Enterprise budget cuts");
  }

  if (exposure.macro.supplyChain > 50 && macro.supplyChainPressure > 30) {
    const drag = (macro.supplyChainPressure / 100) * (exposure.macro.supplyChain / 100) * 8;
    burnDelta += drag;
    riskDelta += drag;
    affectedBecause.push("Supply chain pressure");
  }

  if (exposure.macro.energyPrices > 50 && macro.energyPrices > 30) {
    const drag = (macro.energyPrices / 100) * (exposure.macro.energyPrices / 100) * 6;
    burnDelta += drag;
    affectedBecause.push("High energy costs");
  }

  if (exposure.macro.geopoliticalRisk > 50 && macro.geopoliticalRisk > 30) {
    const drag = (macro.geopoliticalRisk / 100) * (exposure.macro.geopoliticalRisk / 100) * 5;
    investorDelta -= drag;
    riskDelta += drag;
    affectedBecause.push("Geopolitical uncertainty");
  }

  // VC climate affects all startups but more for high-growth ones
  if (macro.vcClimate < -20) {
    const drag = (Math.abs(macro.vcClimate) / 100) * 5;
    valuationDelta -= drag;
    investorDelta -= drag;
    affectedBecause.push("Tight VC climate");
  }
  if (macro.vcClimate > 20) {
    const boost = (macro.vcClimate / 100) * 5;
    valuationDelta += boost;
    investorDelta += boost;
    affectedBecause.push("Favorable VC climate");
  }

  // Month-based slight randomization (deterministic)
  const monthSeed = Math.sin(currentMonth * 1.7 + 3) * 2;
  revenueDelta += monthSeed;
  burnDelta += monthSeed * 0.5;

  // Bounds
  demandDelta = clamp(Math.round(demandDelta), -30, 30);
  revenueDelta = clamp(Math.round(revenueDelta), -25, 25);
  burnDelta = clamp(Math.round(burnDelta), -10, 20);
  valuationDelta = clamp(Math.round(valuationDelta), -20, 25);
  investorDelta = clamp(Math.round(investorDelta), -15, 15);
  riskDelta = clamp(Math.round(riskDelta), -10, 20);
  const marketScoreDelta = clamp(Math.round((macro.vcClimate + macro.consumerSpending + macro.enterpriseSpending) / 10), -10, 10);
  const difficultyScore = deriveDifficultyScore(macro);

  const explanation = buildImpactExplanation(
    scenario,
    startupSector,
    affectedBecause,
    revenueDelta,
    burnDelta,
    valuationDelta
  );

  return {
    eventTitle: scenario.event.name,
    eventSummary: scenario.event.description,
    demandDelta,
    revenueDelta,
    burnDelta,
    valuationDelta,
    investorDelta,
    riskDelta,
    marketScoreDelta,
    difficultyScore,
    explanation,
    affectedBecause,
  };
}

function buildImpactExplanation(
  scenario: MarketScenario,
  sector: string,
  affectedBecause: string[],
  revenueDelta: number,
  burnDelta: number,
  valuationDelta: number
): string {
  const parts: string[] = [];
  parts.push(`Market scenario: ${scenario.name}. `);

  if (affectedBecause.length > 0) {
    parts.push(`Your ${sector} startup is affected because: ${affectedBecause.slice(0, 3).join("; ")}. `);
  }

  const impacts: string[] = [];
  if (revenueDelta > 2) impacts.push(`revenue +${revenueDelta}%`);
  if (revenueDelta < -2) impacts.push(`revenue ${revenueDelta}%`);
  if (burnDelta > 2) impacts.push(`burn +${burnDelta}%`);
  if (burnDelta < -2) impacts.push(`burn ${burnDelta}%`);
  if (valuationDelta > 2) impacts.push(`valuation +${valuationDelta}%`);
  if (valuationDelta < -2) impacts.push(`valuation ${valuationDelta}%`);

  if (impacts.length > 0) {
    parts.push(`Impact: ${impacts.join(", ")}.`);
  } else {
    parts.push("Minimal direct impact this month.");
  }

  return parts.join("");
}
