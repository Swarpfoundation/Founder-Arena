import type { StartupTemplate } from "@/lib/onboarding/startup-templates";
import type { Region, Sector } from "@/lib/validations";

export type BuilderStepId = "archetype" | "market" | "brief" | "pitch" | "deploy";
export type BuilderTone = "cyan" | "violet" | "rose" | "amber" | "emerald" | "white";

export interface BuilderStep {
  id: BuilderStepId;
  label: string;
  description: string;
}

export interface ArchetypePresentation {
  id: string;
  name: string;
  fantasy: string;
  bestFor: string;
  risks: string[];
  sector: string;
  region: string;
  fundingAsk: number;
  tone: BuilderTone;
  difficulty: "moderate" | "hard" | "volatile";
}

export interface MarketCardPresentation {
  id: string;
  label: string;
  tone: BuilderTone;
  opportunity: string;
  risk: string;
}

export interface DeploymentPreview {
  runSeed: string;
  sector: string;
  region: string;
  firstObjective: string;
  phase: string;
  riskTags: string[];
  readinessLabel: string;
  fundingAskLabel: string;
}

export const FOUNDER_BUILDER_STEPS: BuilderStep[] = [
  { id: "archetype", label: "Archetype", description: "Choose the run preset." },
  { id: "market", label: "Market", description: "Set sector and arena region." },
  { id: "brief", label: "Founder Brief", description: "Name the mission." },
  { id: "pitch", label: "Pitch Core", description: "Define problem, solution, model, and moat." },
  { id: "deploy", label: "Deploy", description: "Launch the run." },
];

export function getBuilderSteps(): BuilderStep[] {
  return FOUNDER_BUILDER_STEPS;
}

export function getArchetypePresentation(template: StartupTemplate): ArchetypePresentation {
  return {
    id: template.id,
    name: getArchetypeName(template),
    fantasy: template.description,
    bestFor: getBestFor(template.sector),
    risks: getTemplateRisks(template),
    sector: template.sector,
    region: template.region,
    fundingAsk: template.fundingAsk,
    tone: getSectorTone(template.sector),
    difficulty: getTemplateDifficulty(template),
  };
}

export function getSectorCardPresentation(sector: Sector | string): MarketCardPresentation {
  return {
    id: sector,
    label: sector,
    tone: getSectorTone(sector),
    opportunity: getSectorOpportunity(sector),
    risk: getSectorRisk(sector),
  };
}

export function getRegionCardPresentation(region: Region | string): MarketCardPresentation {
  return {
    id: region,
    label: region,
    tone: getRegionTone(region),
    opportunity: getRegionOpportunity(region),
    risk: getRegionRisk(region),
  };
}

export function buildDeploymentPreview(input: {
  selectedTemplate?: StartupTemplate;
  sector?: string;
  region?: string;
  fundingAsk?: number | string;
  requiredFieldCount?: number;
  completedFieldCount?: number;
}): DeploymentPreview {
  const fundingAsk = Number(input.fundingAsk ?? 0);
  const riskTags = [
    input.sector ? getSectorRisk(input.sector) : "sector unknown",
    input.region ? getRegionRisk(input.region) : "region unknown",
    fundingAsk >= 1_000_000 ? "large seed ask" : fundingAsk > 0 ? "lean seed ask" : "ask unset",
  ];
  const completed = input.completedFieldCount ?? 0;
  const required = Math.max(input.requiredFieldCount ?? 1, 1);
  const readiness = Math.round((completed / required) * 100);

  return {
    runSeed: input.selectedTemplate?.name ?? "Custom Founder Build",
    sector: input.sector || "Select sector",
    region: input.region || "Select region",
    firstObjective: "Complete investor brief",
    phase: "Launch Signal",
    riskTags,
    readinessLabel: readiness >= 100 ? "Deployment ready" : `${readiness}% configured`,
    fundingAskLabel: fundingAsk > 0 ? `$${fundingAsk.toLocaleString()}` : "Funding ask unset",
  };
}

function getArchetypeName(template: StartupTemplate): string {
  if (template.sector === "AI / ML") return `${template.name} · AI Operator`;
  if (template.sector === "Fintech") return `${template.name} · Regulated Founder`;
  if (template.sector === "Healthtech") return `${template.name} · Clinical Operator`;
  if (template.sector === "Enterprise") return `${template.name} · Enterprise Closer`;
  if (template.sector === "Consumer") return `${template.name} · Growth Founder`;
  if (template.sector === "Climate") return `${template.name} · Climate Operator`;
  if (template.sector === "SaaS") return `${template.name} · SaaS Builder`;
  return `${template.name} · Founder Build`;
}

function getBestFor(sector: string): string {
  if (sector === "AI / ML") return "players who want investor heat and infra pressure";
  if (sector === "Fintech") return "players who can manage regulation and trust";
  if (sector === "Healthtech") return "players who want slow sales and high compliance stakes";
  if (sector === "Enterprise") return "players who can survive long sales cycles";
  if (sector === "Consumer") return "players who want hype, volatility, and brand risk";
  if (sector === "Climate") return "players who want hardware, policy, and energy shocks";
  if (sector === "SaaS") return "players who want clean unit economics and GTM pressure";
  return "players who want a custom arena path";
}

function getTemplateRisks(template: StartupTemplate): string[] {
  const risks = [getSectorRisk(template.sector)];
  if (template.fundingAsk >= 1_000_000) risks.push("large funding ask");
  if (template.riskNote.toLowerCase().includes("regulat")) risks.push("regulatory scrutiny");
  if (template.riskNote.toLowerCase().includes("hardware")) risks.push("hardware complexity");
  if (template.riskNote.toLowerCase().includes("crypto")) risks.push("crypto cyclicality");
  return Array.from(new Set(risks)).slice(0, 3);
}

function getTemplateDifficulty(template: StartupTemplate): ArchetypePresentation["difficulty"] {
  if (template.sector === "Consumer" || template.riskNote.toLowerCase().includes("crypto")) return "volatile";
  if (template.sector === "Fintech" || template.sector === "Healthtech" || template.sector === "Climate") return "hard";
  return "moderate";
}

function getSectorTone(sector: string): BuilderTone {
  if (sector === "AI / ML" || sector === "SaaS") return "cyan";
  if (sector === "Fintech" || sector === "Healthtech") return "violet";
  if (sector === "Consumer" || sector === "E-commerce") return "amber";
  if (sector === "Climate" || sector === "EdTech") return "emerald";
  if (sector === "Enterprise") return "rose";
  return "white";
}

function getRegionTone(region: string): BuilderTone {
  if (region === "Remote / Global") return "cyan";
  if (region === "North America") return "violet";
  if (region === "Europe") return "emerald";
  if (region === "Asia") return "amber";
  if (region === "Latin America") return "rose";
  return "white";
}

function getSectorOpportunity(sector: string): string {
  const copy: Record<string, string> = {
    "AI / ML": "Investor demand and rapid product velocity.",
    Fintech: "High-value trust markets and durable revenue.",
    Healthtech: "Defensive budgets and mission-critical workflows.",
    SaaS: "Predictable subscription economics.",
    Consumer: "Fast adoption and viral upside.",
    Enterprise: "Large contracts and strategic buyers.",
    Climate: "Policy tailwinds and energy urgency.",
    "E-commerce": "Clear revenue loops and direct customer signal.",
    EdTech: "Institutional adoption and learning outcomes.",
    Other: "Flexible custom strategy path.",
  };
  return copy[sector] ?? copy.Other;
}

function getSectorRisk(sector: string): string {
  const copy: Record<string, string> = {
    "AI / ML": "inference cost and hype risk",
    Fintech: "regulatory pressure",
    Healthtech: "clinical and compliance drag",
    SaaS: "crowded market",
    Consumer: "brand volatility",
    Enterprise: "long sales cycle",
    Climate: "hardware and policy risk",
    "E-commerce": "margin pressure",
    EdTech: "slow procurement",
    Other: "unclear market signal",
  };
  return copy[sector] ?? copy.Other;
}

function getRegionOpportunity(region: string): string {
  const copy: Record<string, string> = {
    "North America": "Large venture market and early adopter density.",
    Europe: "Strong compliance trust and regulated buyers.",
    Asia: "Massive consumer and mobile-first demand.",
    "Latin America": "Emerging market pain and payment innovation.",
    Africa: "Leapfrog infrastructure and mobile distribution.",
    Oceania: "Focused test markets and premium buyers.",
    "Remote / Global": "Borderless GTM and distributed talent.",
  };
  return copy[region] ?? "Custom arena conditions.";
}

function getRegionRisk(region: string): string {
  const copy: Record<string, string> = {
    "North America": "expensive GTM",
    Europe: "privacy and compliance burden",
    Asia: "localization pressure",
    "Latin America": "payment and currency volatility",
    Africa: "infrastructure fragmentation",
    Oceania: "smaller market size",
    "Remote / Global": "distributed focus risk",
  };
  return copy[region] ?? "unknown region risk";
}
