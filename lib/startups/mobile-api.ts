import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createStartupSchema, REGIONS, SECTORS, type CreateStartupInput, type Region, type Sector } from "@/lib/validations";

const SECTOR_ALIASES: Record<string, Sector> = {
  saas: "SaaS",
  software: "SaaS",
  fintech: "Fintech",
  "fin tech": "Fintech",
  healthtech: "Healthtech",
  "health tech": "Healthtech",
  healthcare: "Healthtech",
  ai: "AI / ML",
  "ai/ml": "AI / ML",
  "ai / ml": "AI / ML",
  ml: "AI / ML",
  ecommerce: "E-commerce",
  "e-commerce": "E-commerce",
  commerce: "E-commerce",
  consumer: "Consumer",
  enterprise: "Enterprise",
  climate: "Climate",
  climatetech: "Climate",
  "climate tech": "Climate",
  edtech: "EdTech",
  "ed tech": "EdTech",
  marketplace: "Other",
  deeptech: "Other",
  "deep tech": "Other",
  other: "Other",
};

const REGION_ALIASES: Record<string, Region> = {
  us: "North America",
  usa: "North America",
  "united states": "North America",
  canada: "North America",
  "north america": "North America",
  europe: "Europe",
  uk: "Europe",
  "united kingdom": "Europe",
  asia: "Asia",
  "latin america": "Latin America",
  africa: "Africa",
  oceania: "Oceania",
  australia: "Oceania",
  global: "Remote / Global",
  remote: "Remote / Global",
  "remote / global": "Remote / Global",
};

export const mobileStartupCreateSchema = z.object({
  name: z.string().min(2).max(80),
  sector: z.string().min(1).max(80),
  region: z.string().min(1).max(80).optional(),
  country: z.string().min(1).max(80).optional(),
  founderStyle: z.string().min(1).max(80).optional(),
  stage: z.string().min(1).max(80).optional(),
  description: z.string().min(10).max(180).optional(),
  targetCustomer: z.string().min(1).max(200).optional(),
  problem: z.string().min(20).max(5000).optional(),
  solution: z.string().min(20).max(5000).optional(),
  monetizationModel: z.string().min(1).max(500).optional(),
  unfairAdvantage: z.string().min(1).max(2000).optional(),
  fundingAsk: z.coerce.number().min(25000).max(10000000).optional(),
});

type StartupForSafeView = {
  id: string;
  name: string;
  sector: string;
  region: string;
  stage: string;
  status: string;
  cash: number;
  monthlyBurn: number;
  valuation: number;
  createdAt: Date;
  updatedAt: Date;
  simulationMonths?: { monthNumber: number }[];
  _count?: { simulationMonths: number };
};

export type SafeMobileStartupView = ReturnType<typeof buildSafeMobileStartupView>;

function normalizeAlias<T extends string>(value: string | undefined, aliases: Record<string, T>, fallback: T): T {
  if (!value) return fallback;
  const trimmed = value.trim();
  const exact = Object.values(aliases).find((item) => item.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;
  return aliases[trimmed.toLowerCase()] ?? fallback;
}

function normalizeSector(value: string): Sector {
  const exact = SECTORS.find((sector) => sector.toLowerCase() === value.trim().toLowerCase());
  return exact ?? normalizeAlias(value, SECTOR_ALIASES, "Other");
}

function normalizeRegion(input: { region?: string; country?: string }): Region {
  const value = input.region ?? input.country;
  const exact = REGIONS.find((region) => region.toLowerCase() === value?.trim().toLowerCase());
  return exact ?? normalizeAlias(value, REGION_ALIASES, "Remote / Global");
}

function buildDefaultSentence(input: { name: string; sector: Sector; targetCustomer: string }): string {
  return `${input.name} helps ${input.targetCustomer} solve a focused ${input.sector} operating problem.`;
}

export function normalizeMobileStartupInput(raw: unknown): { ok: true; data: CreateStartupInput } | { ok: false; errors: string[] } {
  const parsed = mobileStartupCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const input = parsed.data;
  const sector = normalizeSector(input.sector);
  const region = normalizeRegion({ region: input.region, country: input.country });
  const targetMarket = input.targetCustomer?.trim() || "early startup operators";
  const description = input.description?.trim() || buildDefaultSentence({ name: input.name, sector, targetCustomer: targetMarket });
  const problem = input.problem?.trim()
    || `${targetMarket} need a clearer way to validate demand, communicate the opportunity, and prepare investor-ready evidence.`;
  const solution = input.solution?.trim()
    || `${input.name} gives ${targetMarket} a focused workflow to organize the pitch, explain the product, and prepare for investor review.`;
  const monetizationModel = input.monetizationModel?.trim() || "Subscription and usage-based pricing";
  const unfairAdvantage = input.unfairAdvantage?.trim()
    || input.founderStyle?.trim()
    || "Founder insight, fast execution, and direct customer discovery.";

  const candidate: CreateStartupInput = {
    name: input.name.trim(),
    description,
    sector,
    region,
    targetMarket,
    problem,
    solution,
    monetizationModel,
    unfairAdvantage,
    fundingAsk: input.fundingAsk ?? 500_000,
  };

  const validated = createStartupSchema.safeParse(candidate);
  if (!validated.success) {
    return {
      ok: false,
      errors: validated.error.issues.map((issue) => issue.message),
    };
  }
  return { ok: true, data: validated.data };
}

export function buildSafeMobileStartupView(startup: StartupForSafeView) {
  const currentMonth = startup.simulationMonths?.length
    ? Math.max(...startup.simulationMonths.map((month) => month.monthNumber))
    : startup._count?.simulationMonths ?? 0;

  return {
    id: startup.id,
    name: startup.name,
    sector: startup.sector,
    region: startup.region,
    founderStyle: null,
    currentMonth,
    status: startup.status,
    fundingStage: startup.stage,
    cash: startup.cash,
    monthlyBurn: startup.monthlyBurn,
    valuation: startup.valuation,
    createdAt: startup.createdAt.toISOString(),
    updatedAt: startup.updatedAt.toISOString(),
  };
}

export async function listMobileStartups(userId: string): Promise<SafeMobileStartupView[]> {
  const startups = await db.startup.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      sector: true,
      region: true,
      stage: true,
      status: true,
      cash: true,
      monthlyBurn: true,
      valuation: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { simulationMonths: true } },
    },
  });
  return startups.map(buildSafeMobileStartupView);
}

export async function createMobileStartup(input: {
  userId: string;
  body: unknown;
}): Promise<{ ok: true; startup: SafeMobileStartupView } | { ok: false; status: number; error: string; details?: string[] }> {
  const normalized = normalizeMobileStartupInput(input.body);
  if (!normalized.ok) {
    return { ok: false, status: 400, error: "Invalid startup input.", details: normalized.errors };
  }

  const startup = await db.startup.create({
    data: {
      userId: input.userId,
      name: normalized.data.name,
      tagline: normalized.data.description,
      description: normalized.data.description,
      sector: normalized.data.sector,
      region: normalized.data.region,
      stage: "idea",
      targetMarket: normalized.data.targetMarket,
      monetizationModel: normalized.data.monetizationModel,
      status: "draft",
      problem: normalized.data.problem,
      solution: normalized.data.solution,
      unfairAdvantage: normalized.data.unfairAdvantage,
      fundingAsk: normalized.data.fundingAsk,
      cash: 0,
      monthlyBurn: 0,
      revenue: 0,
      valuation: 0,
      productProgress: 0,
      aiAnalysis: Prisma.JsonNull,
    },
    select: {
      id: true,
      name: true,
      sector: true,
      region: true,
      stage: true,
      status: true,
      cash: true,
      monthlyBurn: true,
      valuation: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { simulationMonths: true } },
    },
  });

  return { ok: true, startup: buildSafeMobileStartupView(startup) };
}

export async function getMobileStartupForUser(input: {
  userId: string;
  startupId: string;
  isAdmin?: boolean;
}): Promise<SafeMobileStartupView | null> {
  const startup = await db.startup.findUnique({
    where: { id: input.startupId },
    select: {
      id: true,
      userId: true,
      name: true,
      sector: true,
      region: true,
      stage: true,
      status: true,
      cash: true,
      monthlyBurn: true,
      valuation: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { simulationMonths: true } },
    },
  });
  if (!startup || (!input.isAdmin && startup.userId !== input.userId)) return null;
  return buildSafeMobileStartupView(startup);
}
