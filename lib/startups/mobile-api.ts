import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { startupProfileSchema, startupProfileSocialLinkSchema, type StartupProfile } from "@/lib/deck-review/schemas";
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

const MOBILE_STARTUP_STAGES = ["idea", "prototype", "mvp", "launched", "revenue", "scaling"] as const;

const optionalTrimmedText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
    z.string().trim().max(max).optional()
  );

const optionalHttpUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string()
    .trim()
    .url()
    .max(300)
    .refine((value) => /^https?:\/\//i.test(value), "URL must start with http:// or https://")
    .optional()
);

const optionalCountryCode = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => /^[A-Z]{2}$/.test(value), "Country code must be a 2-letter ISO code.")
    .optional()
);

const nullablePatchText = (max: number) =>
  z.preprocess(
    (value) => {
      if (value === null) return null;
      if (typeof value === "string" && value.trim().length === 0) return null;
      return value;
    },
    z.string().trim().max(max).nullable().optional()
  );

const nullablePatchHttpUrl = z.preprocess(
  (value) => {
    if (value === null) return null;
    if (typeof value === "string" && value.trim().length === 0) return null;
    return value;
  },
  z.string()
    .trim()
    .url()
    .max(300)
    .refine((value) => /^https?:\/\//i.test(value), "URL must start with http:// or https://")
    .nullable()
    .optional()
);

const nullablePatchCountryCode = z.preprocess(
  (value) => {
    if (value === null) return null;
    if (typeof value === "string" && value.trim().length === 0) return null;
    return value;
  },
  z.string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => /^[A-Z]{2}$/.test(value), "Country code must be a 2-letter ISO code.")
    .nullable()
    .optional()
);

const nullablePatchSocialLinks = z.preprocess(
  (value) => value === null ? null : value,
  z.array(startupProfileSocialLinkSchema).max(8).nullable().optional()
);

export const mobileStartupCreateSchema = z.object({
  name: z.string().min(2).max(80),
  sector: z.string().min(1).max(80),
  region: z.string().min(1).max(80).optional(),
  country: optionalTrimmedText(80),
  countryName: optionalTrimmedText(80),
  countryCode: optionalCountryCode,
  city: optionalTrimmedText(80),
  founderStyle: z.string().min(1).max(80).optional(),
  stage: z.enum(MOBILE_STARTUP_STAGES).optional(),
  oneLinePitch: optionalTrimmedText(240),
  description: optionalTrimmedText(600),
  summary: optionalTrimmedText(600),
  targetCustomer: optionalTrimmedText(240),
  problem: z.string().min(20).max(5000).optional(),
  solution: z.string().min(20).max(5000).optional(),
  market: optionalTrimmedText(500),
  businessModel: optionalTrimmedText(500),
  monetizationModel: z.string().min(1).max(500).optional(),
  unfairAdvantage: z.string().min(1).max(2000).optional(),
  websiteUrl: optionalHttpUrl,
  websiteURL: optionalHttpUrl,
  socialLinks: z.array(startupProfileSocialLinkSchema).max(8).optional(),
  realLifeStartup: z.coerce.boolean().optional(),
  fundingGoal: optionalTrimmedText(300),
  fundingAsk: z.coerce.number().min(25000).max(10000000).optional(),
  tractionSummary: optionalTrimmedText(500),
  revenueSummary: optionalTrimmedText(500),
  teamSummary: optionalTrimmedText(500),
  roadmapSummary: optionalTrimmedText(700),
});

export const mobileStartupPatchSchema = z.object({
  name: nullablePatchText(80),
  sector: nullablePatchText(80),
  region: nullablePatchText(80),
  country: nullablePatchText(80),
  countryName: nullablePatchText(80),
  countryCode: nullablePatchCountryCode,
  city: nullablePatchText(80),
  stage: z.enum(MOBILE_STARTUP_STAGES).nullable().optional(),
  oneLinePitch: nullablePatchText(240),
  pitch: nullablePatchText(240),
  description: nullablePatchText(600),
  summary: nullablePatchText(600),
  targetCustomer: nullablePatchText(240),
  problem: nullablePatchText(1000),
  solution: nullablePatchText(1000),
  market: nullablePatchText(500),
  businessModel: nullablePatchText(500),
  monetizationModel: nullablePatchText(500),
  unfairAdvantage: nullablePatchText(1000),
  websiteUrl: nullablePatchHttpUrl,
  websiteURL: nullablePatchHttpUrl,
  socialLinks: nullablePatchSocialLinks,
  realLifeStartup: z.boolean().nullable().optional(),
  fundingGoal: nullablePatchText(300),
  fundingAsk: z.coerce.number().min(25000).max(10000000).nullable().optional(),
  tractionSummary: nullablePatchText(500),
  revenueSummary: nullablePatchText(500),
  teamSummary: nullablePatchText(500),
  roadmapSummary: nullablePatchText(700),
}).strict();

type StartupForSafeView = {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  sector: string;
  region: string;
  stage: string;
  targetMarket: string;
  monetizationModel: string;
  status: string;
  problem: string;
  solution: string;
  unfairAdvantage: string;
  fundingAsk: number;
  cash: number;
  monthlyBurn: number;
  valuation: number;
  profile?: Prisma.JsonValue | null;
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

function stripMarkup(value: string): string {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max).trim() : value;
}

function formatFundingAsk(value: number | undefined): string | undefined {
  return value ? `$${value.toLocaleString("en-US")}` : undefined;
}

function safeProfileForResponse(profile: StartupProfile) {
  const { logoUploadKey, ...safeProfile } = profile;
  void logoUploadKey;
  return {
    ...safeProfile,
    description: profile.shortDescription,
  };
}

export function parseStoredStartupProfile(value: Prisma.JsonValue | null | undefined): StartupProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const parsed = startupProfileSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function mergeStartupProfiles(base: StartupProfile | null | undefined, override: StartupProfile | null | undefined): StartupProfile | null {
  if (!base && !override) return null;
  const merged = {
    ...(base ?? {}),
    ...(override ?? {}),
    socialLinks: override?.socialLinks?.length ? override.socialLinks : base?.socialLinks ?? [],
  };
  const parsed = startupProfileSchema.safeParse(merged);
  return parsed.success ? parsed.data : null;
}

function buildLegacyProfile(startup: Pick<StartupForSafeView,
  "name" | "sector" | "region" | "stage" | "targetMarket" | "description" | "problem" | "solution" | "monetizationModel" | "unfairAdvantage" | "fundingAsk"
>): StartupProfile {
  return startupProfileSchema.parse({
    companyName: startup.name,
    sector: startup.sector,
    currentStage: startup.stage,
    shortDescription: startup.description,
    targetCustomer: startup.targetMarket,
    problem: startup.problem,
    solution: startup.solution,
    businessModel: startup.monetizationModel,
    unfairAdvantage: startup.unfairAdvantage,
    fundingGoal: formatFundingAsk(startup.fundingAsk),
  });
}

export function buildStoredStartupProfileFromStartup(startup: StartupForSafeView): StartupProfile {
  const legacy = buildLegacyProfile(startup);
  const stored = parseStoredStartupProfile(startup.profile);
  return mergeStartupProfiles(legacy, stored) ?? legacy;
}

export function buildStartupProfileFromMobileInput(
  input: z.infer<typeof mobileStartupCreateSchema>,
  normalized: CreateStartupInput
): StartupProfile {
  const shortDescription = input.description ?? input.summary ?? normalized.description;
  const businessModel = input.businessModel ?? input.monetizationModel ?? normalized.monetizationModel;
  const country = input.country ?? input.countryName;
  return startupProfileSchema.parse({
    companyName: stripMarkup(input.name),
    oneLinePitch: input.oneLinePitch ?? truncate(normalized.description, 240),
    city: input.city,
    country,
    countryCode: input.countryCode,
    websiteUrl: input.websiteUrl ?? input.websiteURL,
    sector: normalized.sector,
    targetCustomer: input.targetCustomer ?? normalized.targetMarket,
    currentStage: input.stage ?? "idea",
    shortDescription,
    problem: normalized.problem,
    solution: normalized.solution,
    market: input.market,
    businessModel,
    unfairAdvantage: input.unfairAdvantage ?? normalized.unfairAdvantage,
    socialLinks: input.socialLinks ?? [],
    realLifeStartup: input.realLifeStartup ?? false,
    fundingGoal: input.fundingGoal ?? formatFundingAsk(normalized.fundingAsk),
    tractionSummary: input.tractionSummary,
    revenueSummary: input.revenueSummary,
    teamSummary: input.teamSummary,
    roadmapSummary: input.roadmapSummary,
  });
}

export function normalizeMobileStartupInput(raw: unknown): { ok: true; data: CreateStartupInput & { stage: (typeof MOBILE_STARTUP_STAGES)[number] }; profile: StartupProfile } | { ok: false; errors: string[] } {
  const parsed = mobileStartupCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const input = parsed.data;
  const sector = normalizeSector(input.sector);
  const region = normalizeRegion({ region: input.region, country: input.country ?? input.countryName });
  const targetMarket = input.targetCustomer?.trim() || "early startup operators";
  const descriptionSource = input.oneLinePitch ?? input.description ?? input.summary;
  const description = descriptionSource?.trim()
    ? truncate(stripMarkup(descriptionSource.trim()), 180)
    : buildDefaultSentence({ name: input.name, sector, targetCustomer: targetMarket });
  const problem = input.problem?.trim()
    || `${targetMarket} need a clearer way to validate demand, communicate the opportunity, and prepare investor-ready evidence.`;
  const solution = input.solution?.trim()
    || `${input.name} gives ${targetMarket} a focused workflow to organize the pitch, explain the product, and prepare for investor review.`;
  const monetizationModel = input.businessModel?.trim() || input.monetizationModel?.trim() || "Subscription and usage-based pricing";
  const unfairAdvantage = input.unfairAdvantage?.trim()
    || input.founderStyle?.trim()
    || "Founder insight, fast execution, and direct customer discovery.";

  const candidate: CreateStartupInput = {
    name: stripMarkup(input.name),
    description,
    sector,
    region,
    targetMarket: stripMarkup(targetMarket),
    problem: stripMarkup(problem),
    solution: stripMarkup(solution),
    monetizationModel,
    unfairAdvantage: stripMarkup(unfairAdvantage),
    fundingAsk: input.fundingAsk ?? 500_000,
  };

  const validated = createStartupSchema.safeParse(candidate);
  if (!validated.success) {
    return {
      ok: false,
      errors: validated.error.issues.map((issue) => issue.message),
    };
  }
  const profile = buildStartupProfileFromMobileInput(input, validated.data);
  return { ok: true, data: { ...validated.data, stage: input.stage ?? "idea" }, profile };
}

export type MobileStartupPatchInput = z.infer<typeof mobileStartupPatchSchema>;

function issueCategory(issue: z.ZodIssue): string {
  const field = String(issue.path[0] ?? "");
  if (issue.code === "unrecognized_keys") return "forbidden_field";
  if (field === "websiteUrl" || field === "websiteURL") return "invalid_website_url";
  if (field === "socialLinks") return "invalid_social_url";
  if (field === "countryCode") return "invalid_country_code";
  if (field === "stage") return "invalid_stage";
  return "invalid_startup_update";
}

function formatPatchIssues(error: z.ZodError): { category: string; details: string[] } {
  const first = error.issues[0];
  return {
    category: first ? issueCategory(first) : "invalid_startup_update",
    details: error.issues.map((issue) => {
      if (issue.code === "unrecognized_keys") return `Forbidden field: ${issue.keys.join(", ")}`;
      return issue.message;
    }),
  };
}

export function normalizeMobileStartupPatchInput(raw: unknown):
  | { ok: true; data: MobileStartupPatchInput }
  | { ok: false; category: string; errors: string[] } {
  const parsed = mobileStartupPatchSchema.safeParse(raw);
  if (!parsed.success) {
    const formatted = formatPatchIssues(parsed.error);
    return { ok: false, category: formatted.category, errors: formatted.details };
  }
  return { ok: true, data: parsed.data };
}

function assignProfilePatch(target: Record<string, unknown>, key: keyof StartupProfile, value: unknown) {
  if (value === undefined) return;
  if (value === null) {
    delete target[key];
    return;
  }
  target[key] = typeof value === "string" ? stripMarkup(value) : value;
}

function firstPatchValue(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined);
}

export function applyMobileStartupProfilePatch(
  existingProfile: StartupProfile | null | undefined,
  patch: MobileStartupPatchInput
): StartupProfile {
  const next: Record<string, unknown> = { ...(existingProfile ?? {}) };

  assignProfilePatch(next, "companyName", patch.name);
  assignProfilePatch(next, "sector", patch.sector);
  assignProfilePatch(next, "city", patch.city);
  assignProfilePatch(next, "country", firstPatchValue(patch.country, patch.countryName));
  assignProfilePatch(next, "countryCode", patch.countryCode);
  assignProfilePatch(next, "currentStage", patch.stage);
  assignProfilePatch(next, "oneLinePitch", firstPatchValue(patch.oneLinePitch, patch.pitch));
  assignProfilePatch(next, "shortDescription", firstPatchValue(patch.description, patch.summary));
  assignProfilePatch(next, "targetCustomer", patch.targetCustomer);
  assignProfilePatch(next, "problem", patch.problem);
  assignProfilePatch(next, "solution", patch.solution);
  assignProfilePatch(next, "market", patch.market);
  assignProfilePatch(next, "businessModel", firstPatchValue(patch.businessModel, patch.monetizationModel));
  assignProfilePatch(next, "unfairAdvantage", patch.unfairAdvantage);
  assignProfilePatch(next, "websiteUrl", firstPatchValue(patch.websiteUrl, patch.websiteURL));
  assignProfilePatch(next, "socialLinks", patch.socialLinks);
  assignProfilePatch(next, "realLifeStartup", patch.realLifeStartup);
  assignProfilePatch(
    next,
    "fundingGoal",
    firstPatchValue(patch.fundingGoal, typeof patch.fundingAsk === "number" ? formatFundingAsk(patch.fundingAsk) : undefined)
  );
  assignProfilePatch(next, "tractionSummary", patch.tractionSummary);
  assignProfilePatch(next, "revenueSummary", patch.revenueSummary);
  assignProfilePatch(next, "teamSummary", patch.teamSummary);
  assignProfilePatch(next, "roadmapSummary", patch.roadmapSummary);

  return startupProfileSchema.parse(next);
}

export function buildMobileStartupPatchData(
  startup: StartupForSafeView,
  patch: MobileStartupPatchInput
): Prisma.StartupUpdateInput {
  const profile = applyMobileStartupProfilePatch(buildStoredStartupProfileFromStartup(startup), patch);
  const data: Prisma.StartupUpdateInput = {};

  if (patch.name !== undefined && patch.name !== null) {
    data.name = stripMarkup(patch.name);
    profile.companyName = String(data.name);
  }
  if (patch.sector !== undefined && patch.sector !== null) {
    data.sector = normalizeSector(patch.sector);
    profile.sector = String(data.sector);
  }
  if (patch.region !== undefined && patch.region !== null) {
    data.region = normalizeRegion({ region: patch.region });
  } else if ((patch.country !== undefined && patch.country !== null) || (patch.countryName !== undefined && patch.countryName !== null)) {
    data.region = normalizeRegion({ country: String(firstPatchValue(patch.country, patch.countryName) ?? "") });
  }
  if (patch.stage !== undefined && patch.stage !== null) {
    data.stage = patch.stage;
    profile.currentStage = patch.stage;
  }
  if (patch.oneLinePitch !== undefined || patch.pitch !== undefined || patch.description !== undefined || patch.summary !== undefined) {
    const description = patch.oneLinePitch ?? patch.pitch ?? patch.description ?? patch.summary;
    if (typeof description === "string" && description.trim().length > 0) {
      const safeDescription = truncate(stripMarkup(description), 180);
      data.description = safeDescription;
      data.tagline = safeDescription;
    }
  }
  if (patch.targetCustomer !== undefined && patch.targetCustomer !== null) {
    data.targetMarket = stripMarkup(patch.targetCustomer);
  }
  if (patch.problem !== undefined && patch.problem !== null) {
    data.problem = stripMarkup(patch.problem);
  }
  if (patch.solution !== undefined && patch.solution !== null) {
    data.solution = stripMarkup(patch.solution);
  }
  if ((patch.businessModel !== undefined && patch.businessModel !== null) || (patch.monetizationModel !== undefined && patch.monetizationModel !== null)) {
    data.monetizationModel = stripMarkup(String(firstPatchValue(patch.businessModel, patch.monetizationModel) ?? ""));
  }
  if (patch.unfairAdvantage !== undefined && patch.unfairAdvantage !== null) {
    data.unfairAdvantage = stripMarkup(patch.unfairAdvantage);
  }
  if (patch.fundingAsk !== undefined && patch.fundingAsk !== null) {
    data.fundingAsk = Math.round(patch.fundingAsk);
  }

  data.profile = JSON.parse(JSON.stringify(profile)) as Prisma.InputJsonValue;
  return data;
}

export function buildSafeMobileStartupView(startup: StartupForSafeView) {
  const currentMonth = startup.simulationMonths?.length
    ? Math.max(...startup.simulationMonths.map((month) => month.monthNumber))
    : startup._count?.simulationMonths ?? 0;
  const profile = buildStoredStartupProfileFromStartup(startup);

  return {
    id: startup.id,
    name: startup.name,
    sector: startup.sector,
    region: startup.region,
    founderStyle: null,
    currentMonth,
    status: startup.status,
    fundingStage: startup.stage,
    country: profile.country ?? null,
    countryCode: profile.countryCode ?? null,
    city: profile.city ?? null,
    stage: profile.currentStage ?? startup.stage,
    cash: startup.cash,
    monthlyBurn: startup.monthlyBurn,
    valuation: startup.valuation,
    profile: safeProfileForResponse(profile),
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
      tagline: true,
      description: true,
      sector: true,
      region: true,
      stage: true,
      targetMarket: true,
      monetizationModel: true,
      status: true,
      problem: true,
      solution: true,
      unfairAdvantage: true,
      fundingAsk: true,
      cash: true,
      monthlyBurn: true,
      valuation: true,
      profile: true,
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
      stage: normalized.data.stage,
      targetMarket: normalized.data.targetMarket,
      monetizationModel: normalized.data.monetizationModel,
      status: "draft",
      problem: normalized.data.problem,
      solution: normalized.data.solution,
      unfairAdvantage: normalized.data.unfairAdvantage,
      fundingAsk: normalized.data.fundingAsk,
      profile: JSON.parse(JSON.stringify(normalized.profile)) as Prisma.InputJsonValue,
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
      tagline: true,
      description: true,
      sector: true,
      region: true,
      stage: true,
      targetMarket: true,
      monetizationModel: true,
      status: true,
      problem: true,
      solution: true,
      unfairAdvantage: true,
      fundingAsk: true,
      cash: true,
      monthlyBurn: true,
      valuation: true,
      profile: true,
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
      tagline: true,
      description: true,
      sector: true,
      region: true,
      stage: true,
      targetMarket: true,
      monetizationModel: true,
      status: true,
      problem: true,
      solution: true,
      unfairAdvantage: true,
      fundingAsk: true,
      cash: true,
      monthlyBurn: true,
      valuation: true,
      profile: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { simulationMonths: true } },
    },
  });
  if (!startup || (!input.isAdmin && startup.userId !== input.userId)) return null;
  return buildSafeMobileStartupView(startup);
}

export async function updateMobileStartupForUser(input: {
  userId: string;
  startupId: string;
  isAdmin?: boolean;
  body: unknown;
}): Promise<
  | { ok: true; startup: SafeMobileStartupView }
  | { ok: false; status: number; error: string; errorCategory?: string; details?: string[] }
> {
  const normalized = normalizeMobileStartupPatchInput(input.body);
  if (!normalized.ok) {
    return {
      ok: false,
      status: 400,
      error: "Invalid startup update.",
      errorCategory: normalized.category,
      details: normalized.errors,
    };
  }

  const startup = await db.startup.findUnique({
    where: { id: input.startupId },
    select: {
      id: true,
      userId: true,
      name: true,
      tagline: true,
      description: true,
      sector: true,
      region: true,
      stage: true,
      targetMarket: true,
      monetizationModel: true,
      status: true,
      problem: true,
      solution: true,
      unfairAdvantage: true,
      fundingAsk: true,
      cash: true,
      monthlyBurn: true,
      valuation: true,
      profile: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!startup || (!input.isAdmin && startup.userId !== input.userId)) {
    return { ok: false, status: 404, error: "Startup not found." };
  }

  const updated = await db.startup.update({
    where: { id: input.startupId },
    data: buildMobileStartupPatchData(startup, normalized.data),
    select: {
      id: true,
      name: true,
      tagline: true,
      description: true,
      sector: true,
      region: true,
      stage: true,
      targetMarket: true,
      monetizationModel: true,
      status: true,
      problem: true,
      solution: true,
      unfairAdvantage: true,
      fundingAsk: true,
      cash: true,
      monthlyBurn: true,
      valuation: true,
      profile: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { simulationMonths: true } },
    },
  });

  return { ok: true, startup: buildSafeMobileStartupView(updated) };
}
