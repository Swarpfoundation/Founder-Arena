import { StartupExposure } from "./types";

export function deriveStartupMarketExposure(startup: {
  sector: string;
  region: string;
  monetizationModel: string;
  problem: string;
  solution: string;
  riskScore?: number | null;
  marketScore?: number | null;
}): StartupExposure {
  const sector = startup.sector.toLowerCase();
  const region = startup.region.toLowerCase();
  const model = startup.monetizationModel.toLowerCase();
  const solution = startup.solution.toLowerCase();

  // Base exposures at 0
  const macro: StartupExposure["macro"] = {
    interestRates: 0,
    inflation: 0,
    geopoliticalRisk: 0,
    regulation: 0,
    consumerDemand: 0,
    enterpriseDemand: 0,
    cryptoCycle: 0,
    aiTrend: 0,
    supplyChain: 0,
    energyPrices: 0,
    currencyVolatility: 0,
  };

  const sectorExposures: Record<string, number> = {};
  const tailwinds: string[] = [];
  const headwinds: string[] = [];

  // Sector-based exposures
  if (sector.includes("ai") || sector.includes("ml")) {
    macro.aiTrend = 80;
    macro.enterpriseDemand = 50;
    macro.energyPrices = 30; // compute costs
    sectorExposures["ai"] = 90;
    tailwinds.push("High enterprise demand for AI tools");
    headwinds.push("Rising compute and energy costs");
  }

  if (sector.includes("fintech") || sector.includes("defi") || model.includes("finance")) {
    macro.regulation = 70;
    macro.interestRates = 50;
    macro.inflation = 30;
    sectorExposures["fintech"] = 80;
    tailwinds.push("Large addressable market in financial services");
    headwinds.push("Heavy regulatory scrutiny and compliance costs");
  }

  if (sector.includes("web3") || sector.includes("crypto") || sector.includes("blockchain")) {
    macro.cryptoCycle = 90;
    macro.regulation = 60;
    sectorExposures["web3"] = 85;
    tailwinds.push("High upside during crypto bull markets");
    headwinds.push("Extreme volatility and regulatory uncertainty");
  }

  if (sector.includes("health") || sector.includes("biotech") || sector.includes("medical")) {
    macro.regulation = 50;
    macro.aiTrend = 40;
    sectorExposures["healthcare"] = 75;
    tailwinds.push("AI is accelerating drug discovery and diagnostics");
    headwinds.push("Long regulatory approval cycles");
  }

  if (sector.includes("saas") || sector.includes("enterprise") || sector.includes("b2b")) {
    macro.enterpriseDemand = 70;
    macro.aiTrend = 30;
    sectorExposures["saas"] = 70;
    tailwinds.push("Enterprise software budgets remain resilient");
    headwinds.push("Long sales cycles and procurement delays");
  }

  if (sector.includes("gaming") || sector.includes("entertainment")) {
    macro.consumerDemand = 60;
    macro.cryptoCycle = 30; // NFTs, play-to-earn
    sectorExposures["gaming"] = 65;
    tailwinds.push("Large global consumer base");
    headwinds.push("Consumer discretionary spending is cyclical");
  }

  if (sector.includes("ecommerce") || sector.includes("retail") || model.includes("consumer")) {
    macro.consumerDemand = 70;
    macro.supplyChain = 40;
    sectorExposures["b2c"] = 70;
    tailwinds.push("Direct access to consumer wallets");
    headwinds.push("Supply chain disruptions and rising ad costs");
  }

  if (sector.includes("climate") || sector.includes("energy") || sector.includes("clean")) {
    macro.energyPrices = 60;
    macro.regulation = 40;
    sectorExposures["climate"] = 70;
    tailwinds.push("Policy tailwinds and ESG capital flows");
    headwinds.push("Capital-intensive and long development cycles");
  }

  if (sector.includes("hardware") || sector.includes("robotics") || sector.includes("manufacturing")) {
    macro.supplyChain = 70;
    macro.energyPrices = 30;
    sectorExposures["hardware"] = 75;
    tailwinds.push("Strategic importance for reshoring");
    headwinds.push("Component shortages and logistics costs");
  }

  if (sector.includes("defense") || sector.includes("security")) {
    macro.geopoliticalRisk = 50;
    macro.regulation = 40;
    sectorExposures["defense"] = 60;
    tailwinds.push("Government budgets are counter-cyclical");
    headwinds.push("Long sales cycles and classification requirements");
  }

  // Region-based adjustments
  if (region.includes("europe")) {
    macro.regulation += 15;
    macro.energyPrices += 15;
  }
  if (region.includes("asia")) {
    macro.supplyChain += 15;
    macro.geopoliticalRisk += 10;
  }
  if (region.includes("middle east") || region.includes("africa")) {
    macro.geopoliticalRisk += 20;
    macro.inflation += 10;
  }
  if (region.includes("latin america")) {
    macro.inflation += 15;
    macro.currencyVolatility = 40;
  }

  // Problem/solution keyword analysis
  if (solution.includes("automation") || solution.includes("efficiency")) {
    macro.enterpriseDemand += 10;
  }
  if (solution.includes("privacy") || solution.includes("security")) {
    macro.regulation += 10;
  }
  if (solution.includes("cost reduction") || solution.includes("savings")) {
    macro.inflation += 10; // counter-cyclical demand
  }

  // Clamp all values to 0-100
  for (const key of Object.keys(macro) as Array<keyof typeof macro>) {
    macro[key] = Math.min(100, Math.max(0, macro[key]));
  }

  const explanation = buildExposureExplanation(sector, macro, tailwinds, headwinds);

  return {
    sector: startup.sector,
    region: startup.region,
    macro,
    sectorExposures,
    explanation,
    tailwinds,
    headwinds,
  };
}

function buildExposureExplanation(
  sector: string,
  macro: Record<string, number>,
  tailwinds: string[],
  headwinds: string[]
): string {
  const topMacro = Object.entries(macro)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .filter(([, v]) => v > 20);

  let text = `This ${sector} startup is most exposed to: `;
  text += topMacro.map(([k, v]) => `${k} (${v}%)`).join(", ");
  text += ". ";

  if (tailwinds.length > 0) {
    text += `Key tailwind: ${tailwinds[0]} `;
  }
  if (headwinds.length > 0) {
    text += `Key headwind: ${headwinds[0]}.`;
  }

  return text;
}
