import { NormalizedMarketSignal, InterpretedMarketState } from "./types";

function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
}

/**
 * Aggregate normalized signals into a deterministic market state.
 * Conflicting signals moderate each other.
 */
export function interpretSignalsToMarketState(
  signals: NormalizedMarketSignal[]
): InterpretedMarketState {
  if (signals.length === 0) {
    return {
      macroScores: {
        vcClimate: 0,
        inflationPressure: 0,
        geopoliticalRisk: 0,
        consumerSpending: 0,
        enterpriseSpending: 0,
        aiDemand: 0,
        cryptoSentiment: 0,
        regulationPressure: 0,
        supplyChainPressure: 0,
        energyPrices: 0,
      },
      sectorModifiers: {},
      condition: "neutral",
      overallConfidence: 0,
      signalCount: 0,
      topSignals: [],
      explanation: "No market signals available.",
    };
  }

  // Macro dimension accumulators
  const macro: Record<string, { sum: number; weight: number; count: number }> = {
    vcClimate: { sum: 0, weight: 0, count: 0 },
    inflationPressure: { sum: 0, weight: 0, count: 0 },
    geopoliticalRisk: { sum: 0, weight: 0, count: 0 },
    consumerSpending: { sum: 0, weight: 0, count: 0 },
    enterpriseSpending: { sum: 0, weight: 0, count: 0 },
    aiDemand: { sum: 0, weight: 0, count: 0 },
    cryptoSentiment: { sum: 0, weight: 0, count: 0 },
    regulationPressure: { sum: 0, weight: 0, count: 0 },
    supplyChainPressure: { sum: 0, weight: 0, count: 0 },
    energyPrices: { sum: 0, weight: 0, count: 0 },
  };

  // Sector accumulators
  const sectorAcc: Record<string, {
    demandSum: number; demandWeight: number;
    revenueSum: number; revenueWeight: number;
    burnSum: number; burnWeight: number;
    valuationSum: number; valuationWeight: number;
    investorSum: number; investorWeight: number;
    riskSum: number; riskWeight: number;
  }> = {};

  let totalConfidence = 0;

  for (const signal of signals) {
    const weight = (signal.severity / 100) * (signal.confidence / 100);
    const sign = signal.direction === "positive" ? 1 : signal.direction === "negative" ? -1 : 0;
    totalConfidence += signal.confidence;

    // Apply to macro dimensions
    for (const dim of signal.macroDimensions) {
      if (macro[dim]) {
        macro[dim].sum += sign * signal.severity * weight;
        macro[dim].weight += weight;
        macro[dim].count += 1;
      }
    }

    // Apply to sectors
    for (const sector of signal.mappedSectors) {
      if (!sectorAcc[sector]) {
        sectorAcc[sector] = {
          demandSum: 0, demandWeight: 0,
          revenueSum: 0, revenueWeight: 0,
          burnSum: 0, burnWeight: 0,
          valuationSum: 0, valuationWeight: 0,
          investorSum: 0, investorWeight: 0,
          riskSum: 0, riskWeight: 0,
        };
      }
      const acc = sectorAcc[sector];
      acc.demandSum += signal.proposedEffects.demandDelta * weight;
      acc.demandWeight += weight;
      acc.revenueSum += signal.proposedEffects.revenueDelta * weight;
      acc.revenueWeight += weight;
      acc.burnSum += signal.proposedEffects.burnDelta * weight;
      acc.burnWeight += weight;
      acc.valuationSum += signal.proposedEffects.valuationDelta * weight;
      acc.valuationWeight += weight;
      acc.investorSum += signal.proposedEffects.investorDelta * weight;
      acc.investorWeight += weight;
      acc.riskSum += signal.proposedEffects.riskDelta * weight;
      acc.riskWeight += weight;
    }
  }

  // Compute weighted macro scores
  const macroScores = {
    vcClimate: 0,
    inflationPressure: 0,
    geopoliticalRisk: 0,
    consumerSpending: 0,
    enterpriseSpending: 0,
    aiDemand: 0,
    cryptoSentiment: 0,
    regulationPressure: 0,
    supplyChainPressure: 0,
    energyPrices: 0,
  };

  for (const [key, acc] of Object.entries(macro)) {
    const k = key as keyof typeof macroScores;
    if (acc.weight > 0) {
      // Weighted average, then dampened
      macroScores[k] = clamp(Math.round((acc.sum / acc.weight) * 0.6), -80, 80);
    }
  }

  // Compute weighted sector modifiers
  const sectorModifiers: InterpretedMarketState["sectorModifiers"] = {};
  for (const [sector, acc] of Object.entries(sectorAcc)) {
    if (acc.demandWeight > 0) {
      sectorModifiers[sector] = {
        demandDelta: clamp(Math.round((acc.demandSum / acc.demandWeight) * 0.5), -20, 20),
        revenueDelta: clamp(Math.round((acc.revenueSum / acc.revenueWeight) * 0.5), -20, 20),
        burnDelta: clamp(Math.round((acc.burnSum / acc.burnWeight) * 0.5), -10, 15),
        valuationDelta: clamp(Math.round((acc.valuationSum / acc.valuationWeight) * 0.5), -20, 20),
        investorDelta: clamp(Math.round((acc.investorSum / acc.investorWeight) * 0.5), -15, 15),
        riskDelta: clamp(Math.round((acc.riskSum / acc.riskWeight) * 0.5), -10, 15),
      };
    }
  }

  // Determine overall condition
  const positiveCount = signals.filter((s) => s.direction === "positive").length;
  const negativeCount = signals.filter((s) => s.direction === "negative").length;
  const positiveWeight = signals.filter((s) => s.direction === "positive").reduce((sum, s) => sum + s.severity * s.confidence, 0);
  const negativeWeight = signals.filter((s) => s.direction === "negative").reduce((sum, s) => sum + s.severity * s.confidence, 0);

  let condition: InterpretedMarketState["condition"] = "neutral";
  if (positiveWeight > negativeWeight * 1.3) {
    condition = "bullish";
  } else if (negativeWeight > positiveWeight * 1.3) {
    condition = "bearish";
  }

  // Also check macro scores
  const macroSum = Object.values(macroScores).reduce((s, v) => s + v, 0);
  if (macroSum > 30 && condition === "neutral") condition = "bullish";
  if (macroSum < -30 && condition === "neutral") condition = "bearish";

  const overallConfidence = Math.round(totalConfidence / signals.length);

  const topSignals = signals
    .sort((a, b) => b.severity * b.confidence - a.severity * a.confidence)
    .slice(0, 5)
    .map((s) => ({ title: s.title, direction: s.direction, severity: s.severity }));

  const explanation = buildStateExplanation(condition, macroScores, signals.length, positiveCount, negativeCount);

  return {
    macroScores,
    sectorModifiers,
    condition,
    overallConfidence,
    signalCount: signals.length,
    topSignals,
    explanation,
  };
}

function buildStateExplanation(
  condition: string,
  macro: Record<string, number>,
  signalCount: number,
  positiveCount: number,
  negativeCount: number
): string {
  const parts: string[] = [];
  parts.push(`Market condition: ${condition}. Based on ${signalCount} signals (${positiveCount} positive, ${negativeCount} negative). `);

  const topMacro = Object.entries(macro)
    .filter(([, v]) => Math.abs(v) > 15)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 3);

  if (topMacro.length > 0) {
    parts.push("Key macro drivers: ");
    parts.push(topMacro.map(([k, v]) => `${k} (${v > 0 ? "+" : ""}${v})`).join(", "));
    parts.push(". ");
  }

  if (condition === "bullish") {
    parts.push("Tailwinds are dominant. Startups may see improved fundraising and demand conditions.");
  } else if (condition === "bearish") {
    parts.push("Headwinds are dominant. Startups should prioritize capital efficiency and runway.");
  } else {
    parts.push("Mixed signals. Market conditions are balanced with sector-specific variations.");
  }

  return parts.join("");
}
