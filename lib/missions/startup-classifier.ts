/**
 * Founder Arena — Startup Type Classifier
 *
 * Deterministic + AI-assisted classification.
 * AI explains. Deterministic logic selects the type.
 */

import { StartupClassification, StartupTypeId } from "./types";

const SECTOR_TYPE_MAP: Record<string, StartupTypeId[]> = {
  "ai": ["ai_saas", "ai_infrastructure", "healthcare_ai"],
  "ml": ["ai_saas", "ai_infrastructure"],
  "fintech": ["fintech", "remittance"],
  "finance": ["fintech", "remittance"],
  "web3": ["web3_protocol", "web3_wallet"],
  "blockchain": ["web3_protocol", "web3_wallet"],
  "crypto": ["web3_protocol", "web3_wallet"],
  "saas": ["saas_b2b", "enterprise_software", "developer_tools"],
  "consumer": ["consumer_app", "gaming", "marketplace"],
  "gaming": ["gaming", "consumer_app"],
  "health": ["healthcare_ai", "fintech"],
  "healthtech": ["healthcare_ai"],
  "logistics": ["logistics", "energy"],
  "supply": ["logistics"],
  "energy": ["energy", "hardware"],
  "hardware": ["hardware", "energy"],
  "cyber": ["cybersecurity", "enterprise_software"],
  "security": ["cybersecurity", "enterprise_software"],
  "dev": ["developer_tools", "saas_b2b"],
  "developer": ["developer_tools", "saas_b2b"],
  "enterprise": ["enterprise_software", "saas_b2b", "cybersecurity"],
  "marketplace": ["marketplace", "consumer_app"],
  "ecommerce": ["marketplace", "consumer_app"],
};

const MODEL_TYPE_MAP: Record<string, StartupTypeId[]> = {
  "subscription": ["saas_b2b", "enterprise_software"],
  "api": ["developer_tools", "ai_infrastructure"],
  "platform": ["marketplace", "saas_b2b"],
  "protocol": ["web3_protocol"],
  "wallet": ["web3_wallet"],
  "infrastructure": ["ai_infrastructure", "developer_tools"],
  "app": ["consumer_app", "gaming"],
  "game": ["gaming"],
  "token": ["web3_protocol"],
  "defi": ["fintech", "web3_protocol"],
  "remittance": ["remittance", "fintech"],
  "payment": ["fintech", "remittance"],
};

function scoreType(
  type: StartupTypeId,
  sector: string,
  description: string,
  problem: string,
  solution: string,
  monetizationModel: string
): number {
  const text = `${sector} ${description} ${problem} ${solution} ${monetizationModel}`.toLowerCase();
  let score = 0;

  // Sector match
  for (const [keyword, types] of Object.entries(SECTOR_TYPE_MAP)) {
    if (text.includes(keyword) && types.includes(type)) {
      score += 3;
    }
  }

  // Model match
  for (const [keyword, types] of Object.entries(MODEL_TYPE_MAP)) {
    if (text.includes(keyword) && types.includes(type)) {
      score += 2;
    }
  }

  // Direct type name match
  if (text.includes(type.replace("_", " "))) {
    score += 4;
  }

  return score;
}

function deriveIntensities(type: StartupTypeId): Omit<StartupClassification, "primaryStartupType" | "secondaryTypes" | "missionArchetype" | "explanation"> {
  const map: Record<StartupTypeId, { complexity: number; capital: number; regulatory: number; technical: number; sales: number; hiring: number }> = {
    ai_saas: { complexity: 7, capital: 6, regulatory: 3, technical: 9, sales: 5, hiring: 7 },
    ai_infrastructure: { complexity: 9, capital: 8, regulatory: 4, technical: 10, sales: 6, hiring: 8 },
    fintech: { complexity: 7, capital: 6, regulatory: 9, technical: 7, sales: 6, hiring: 6 },
    remittance: { complexity: 8, capital: 7, regulatory: 10, technical: 6, sales: 7, hiring: 6 },
    web3_protocol: { complexity: 9, capital: 7, regulatory: 7, technical: 10, sales: 4, hiring: 7 },
    web3_wallet: { complexity: 7, capital: 5, regulatory: 6, technical: 9, sales: 5, hiring: 6 },
    saas_b2b: { complexity: 5, capital: 4, regulatory: 3, technical: 6, sales: 8, hiring: 5 },
    consumer_app: { complexity: 5, capital: 5, regulatory: 2, technical: 5, sales: 7, hiring: 5 },
    marketplace: { complexity: 7, capital: 6, regulatory: 4, technical: 6, sales: 9, hiring: 7 },
    gaming: { complexity: 6, capital: 6, regulatory: 3, technical: 7, sales: 8, hiring: 6 },
    healthcare_ai: { complexity: 9, capital: 7, regulatory: 10, technical: 9, sales: 5, hiring: 8 },
    logistics: { complexity: 7, capital: 7, regulatory: 5, technical: 6, sales: 6, hiring: 6 },
    energy: { complexity: 8, capital: 9, regulatory: 7, technical: 8, sales: 5, hiring: 6 },
    hardware: { complexity: 8, capital: 9, regulatory: 6, technical: 9, sales: 4, hiring: 7 },
    cybersecurity: { complexity: 7, capital: 5, regulatory: 7, technical: 9, sales: 7, hiring: 6 },
    developer_tools: { complexity: 6, capital: 4, regulatory: 2, technical: 8, sales: 5, hiring: 5 },
    enterprise_software: { complexity: 6, capital: 5, regulatory: 4, technical: 7, sales: 9, hiring: 6 },
  };

  const defaults = { complexity: 5, capital: 5, regulatory: 4, technical: 6, sales: 6, hiring: 5 };
  const vals = map[type] ?? defaults;

  return {
    complexityLevel: vals.complexity,
    capitalIntensity: vals.capital,
    regulatoryIntensity: vals.regulatory,
    technicalIntensity: vals.technical,
    salesIntensity: vals.sales,
    hiringIntensity: vals.hiring,
  };
}

function getArchetype(type: StartupTypeId): string {
  const map: Record<StartupTypeId, string> = {
    ai_saas: "AI Product Builder",
    ai_infrastructure: "Platform Engineer",
    fintech: "Regulated Financial Operator",
    remittance: "Cross-Border Payment Architect",
    web3_protocol: "Protocol Designer",
    web3_wallet: "Web3 Infrastructure Builder",
    saas_b2b: "B2B Sales Machine",
    consumer_app: "Growth Hacker",
    marketplace: "Two-Sided Network Builder",
    gaming: "Engagement Engineer",
    healthcare_ai: "Clinical AI Operator",
    logistics: "Operations Optimizer",
    energy: "Physical Systems Builder",
    hardware: "Deep Tech Manufacturer",
    cybersecurity: "Security-First Builder",
    developer_tools: "Developer Experience Architect",
    enterprise_software: "Enterprise Solution Seller",
  };
  return map[type] ?? "Generalist Founder";
}

export function classifyStartupDeterministic(
  sector: string,
  description: string,
  problem: string,
  solution: string,
  monetizationModel: string
): StartupClassification {
  const types: StartupTypeId[] = [
    "ai_saas", "ai_infrastructure", "fintech", "remittance",
    "web3_protocol", "web3_wallet", "saas_b2b", "consumer_app",
    "marketplace", "gaming", "healthcare_ai", "logistics",
    "energy", "hardware", "cybersecurity", "developer_tools",
    "enterprise_software",
  ];

  const scores = types.map((t) => ({
    type: t,
    score: scoreType(t, sector, description, problem, solution, monetizationModel),
  }));

  scores.sort((a, b) => b.score - a.score);

  const primary = scores[0].type;
  const secondary = scores.slice(1, 4).filter((s) => s.score > 0).map((s) => s.type);
  const intensities = deriveIntensities(primary);

  return {
    primaryStartupType: primary,
    secondaryTypes: secondary,
    ...intensities,
    missionArchetype: getArchetype(primary),
    explanation: `Classified as ${primary.replace("_", " ")} based on sector "${sector}" and business model "${monetizationModel}".`,
  };
}

export async function classifyStartup(
  input: {
    sector: string;
    description: string;
    problem: string;
    solution: string;
    monetizationModel: string;
    region: string;
    fundingAsk: number;
  }
): Promise<StartupClassification> {
  // Deterministic classification is authoritative
  const deterministic = classifyStartupDeterministic(
    input.sector,
    input.description,
    input.problem,
    input.solution,
    input.monetizationModel
  );

  // AI could enrich the explanation, but we keep deterministic type selection
  // to ensure consistency regardless of API availability.
  return deterministic;
}
