import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logger } from "@/lib/observability/logger";
import { evaluatePrivateBetaAdminAccess } from "@/lib/admin/private-beta-dashboard";
import { getDeckReviewRuntimeConfig, type DeckReviewRuntimeConfig } from "./config";
import { getInvestmentFirmById, type InvestmentFirm } from "./firms";
import { aggregateFirmReviews } from "./aggregate";
import { generateFirmReview, generateMockFirmReview, DeckReviewProviderError } from "./provider";
import { generateInvestorMissions } from "./missions";
import {
  aggregateReviewSchema,
  firmReviewSchema,
  generatedDeckSchema,
  investorMissionRoadmapSummarySchema,
  investorMissionSchema,
  type InvestorMission,
  type InvestorMissionRoadmapSummary,
  type MissionGenerationStatus,
  startupProfileSchema,
  type AggregateReview,
  type DeckReviewErrorCategory,
  type DeckReviewJobStatus,
  type FirmReview,
  type ReviewInputType,
  type StartupProfile,
} from "./schemas";

/**
 * Deck review job lifecycle. Status flow:
 *
 *   uploaded → extracting_deck → reviewing → completed
 *                       └──────────┴───────→ failed
 *
 * Privacy invariants enforced here:
 * - `extractedText`, `deckStorageKey`, and prompts NEVER appear in API views.
 * - Owner or configured admin only; admins get safe status, not deck text.
 * - Audit logs carry counts/hashes/categories, never deck content.
 */

type DeckReviewJobRecord = Prisma.VcDeckReviewJobGetPayload<object>;

export type SafeFirmReviewView = FirmReview;

export interface SafeDeckReviewJobView {
  jobId: string;
  startupId: string;
  reviewInputType: ReviewInputType;
  status: DeckReviewJobStatus;
  selectedFirmIds: string[];
  deckFileName: string | null;
  deckPageCount: number | null;
  sourceSummary: string | null;
  accessUsedCredit: boolean;
  provider: string | null;
  model: string | null;
  errorCategory: string | null;
  safeErrorMessage: string | null;
  missionGenerationStatus: MissionGenerationStatus;
  missionCount: number;
  missionGenerationErrorCategory: string | null;
  missionGenerationSafeErrorMessage: string | null;
  missions: InvestorMission[] | null;
  roadmapSummary: InvestorMissionRoadmapSummary | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  firmReviews: SafeFirmReviewView[] | null;
  aggregateReview: AggregateReview | null;
}

function parseStatus(value: string): DeckReviewJobStatus {
  switch (value) {
    case "uploaded":
    case "extracting_deck":
    case "reviewing":
    case "completed":
    case "failed":
      return value;
    default:
      return "failed";
  }
}

function parseInputType(value: string): ReviewInputType {
  switch (value) {
    case "manual_pitch":
    case "ai_generated_deck":
    case "pdf_upload":
      return value;
    default:
      return "pdf_upload";
  }
}

function parseMissionGenerationStatus(value: string): MissionGenerationStatus {
  switch (value) {
    case "generating":
    case "completed":
    case "failed":
    case "not_started":
      return value;
    default:
      return "failed";
  }
}

function parseStoredFirmReviews(value: Prisma.JsonValue | null): FirmReview[] | null {
  if (!Array.isArray(value)) return null;
  const reviews: FirmReview[] = [];
  for (const item of value) {
    const parsed = firmReviewSchema.safeParse(item);
    if (parsed.success) reviews.push(parsed.data);
  }
  return reviews.length > 0 ? reviews : null;
}

function parseStoredAggregate(value: Prisma.JsonValue | null): AggregateReview | null {
  if (!value || typeof value !== "object") return null;
  const parsed = aggregateReviewSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function parseStoredStartupProfile(value: Prisma.JsonValue | null): StartupProfile | null {
  if (!value || typeof value !== "object") return null;
  const parsed = startupProfileSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function parseStoredGeneratedDeck(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object") return null;
  const parsed = generatedDeckSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function parseStoredInvestorMissions(value: Prisma.JsonValue | null): InvestorMission[] | null {
  if (!Array.isArray(value)) return null;
  const missions: InvestorMission[] = [];
  for (const item of value) {
    const parsed = investorMissionSchema.safeParse(item);
    if (parsed.success) missions.push(parsed.data);
  }
  return missions.length > 0 ? missions : null;
}

function parseStoredRoadmapSummary(value: Prisma.JsonValue | null): InvestorMissionRoadmapSummary | null {
  if (!value || typeof value !== "object") return null;
  const parsed = investorMissionRoadmapSummarySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * The ONLY shape the API may return. Deliberately rebuilt field-by-field so
 * private columns (extractedText, deckStorageKey, manualNotes, hashes) can
 * never leak through object spreading.
 */
export function buildSafeDeckReviewJobView(job: DeckReviewJobRecord): SafeDeckReviewJobView {
  const status = parseStatus(job.status);
  const completed = status === "completed";
  const missionGenerationStatus = parseMissionGenerationStatus(job.missionGenerationStatus);
  const missions = completed && missionGenerationStatus === "completed"
    ? parseStoredInvestorMissions(job.investorMissions)
    : null;

  return {
    jobId: job.id,
    startupId: job.startupId,
    reviewInputType: parseInputType(job.reviewInputType),
    status,
    selectedFirmIds: Array.isArray(job.selectedFirmIds) ? (job.selectedFirmIds as string[]) : [],
    deckFileName: job.deckFileName,
    deckPageCount: job.deckPageCount,
    sourceSummary: job.sourceSummary,
    accessUsedCredit: job.accessUsedCredit,
    provider: job.provider,
    model: job.model,
    errorCategory: job.errorCategory,
    safeErrorMessage: job.safeErrorMessage,
    missionGenerationStatus,
    missionCount: missions?.length ?? 0,
    missionGenerationErrorCategory: job.missionGenerationErrorCategory,
    missionGenerationSafeErrorMessage: job.missionGenerationSafeErrorMessage,
    missions,
    roadmapSummary: completed && missionGenerationStatus === "completed" ? parseStoredRoadmapSummary(job.roadmapSummary) : null,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    firmReviews: completed ? parseStoredFirmReviews(job.firmReviews) : null,
    aggregateReview: completed ? parseStoredAggregate(job.aggregateReview) : null,
  };
}

export type DeckReviewAccess =
  | { allowed: true; role: "owner" | "admin" }
  | { allowed: false; reason: "not_found" | "forbidden" };

/** Pure authorization decision — unit-testable without a database. */
export function evaluateDeckReviewJobAccess(input: {
  job: { userId: string } | null;
  user: { id: string; email?: string | null } | null;
  env?: Partial<NodeJS.ProcessEnv>;
}): DeckReviewAccess {
  if (!input.job) return { allowed: false, reason: "not_found" };
  if (!input.user) return { allowed: false, reason: "forbidden" };
  if (input.job.userId === input.user.id) return { allowed: true, role: "owner" };

  const admin = evaluatePrivateBetaAdminAccess(input.user, input.env ?? process.env);
  if (admin.allowed) return { allowed: true, role: "admin" };

  // Important: non-owners get "not_found" (no existence oracle), like 404.
  return { allowed: false, reason: "not_found" };
}

export async function getDeckReviewJobForUser(input: {
  jobId: string;
  user: { id: string; email?: string | null };
}): Promise<{ ok: true; job: DeckReviewJobRecord; role: "owner" | "admin" } | { ok: false; reason: "not_found" | "forbidden" }> {
  const job = await db.vcDeckReviewJob.findUnique({ where: { id: input.jobId } });
  const access = evaluateDeckReviewJobAccess({ job, user: input.user });
  if (!access.allowed) return { ok: false, reason: access.reason };
  return { ok: true, job: job as DeckReviewJobRecord, role: access.role };
}

type DeckReviewAuditEvent =
  | "deck_review_job_created"
  | "deck_review_pdf_validated"
  | "deck_review_extraction_completed"
  | "deck_review_extraction_failed"
  | "deck_review_access_consumed"
  | "deck_review_started"
  | "deck_review_completed"
  | "deck_review_failed"
  | "deck_review_missions_started"
  | "deck_review_missions_completed"
  | "deck_review_missions_failed";

/** Safe metadata only: ids, counts, hashes, categories — never deck content. */
export function auditDeckReview(event: DeckReviewAuditEvent, metadata: Record<string, string | number | boolean | null | undefined>) {
  logger.info(`[deck-review-audit] ${event}`, metadata);
}

export async function countDeckReviewJobsToday(userId: string, now = new Date()): Promise<number> {
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  return db.vcDeckReviewJob.count({
    where: { userId, createdAt: { gte: dayStart } },
  });
}

export async function getActiveDeckReviewJobForStartup(userId: string, startupId: string) {
  return db.vcDeckReviewJob.findFirst({
    where: {
      userId,
      startupId,
      status: { in: ["uploaded", "extracting_deck", "reviewing"] },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLatestDeckReviewJobForStartup(userId: string, startupId: string) {
  return db.vcDeckReviewJob.findFirst({
    where: { userId, startupId },
    orderBy: { createdAt: "desc" },
  });
}

async function markJobFailed(jobId: string, category: DeckReviewErrorCategory, safeMessage: string) {
  await db.vcDeckReviewJob.update({
    where: { id: jobId },
    data: {
      status: "failed",
      errorCategory: category,
      safeErrorMessage: safeMessage.slice(0, 500),
      completedAt: new Date(),
    },
  });
  auditDeckReview("deck_review_failed", { jobId, category });
}

/**
 * Runs the AI review portion of a job (after upload+extraction already
 * succeeded). Idempotent-ish: only runs from `reviewing`/`uploaded` states.
 * Firms run sequentially as a cost/rate guard; one firm failing does not
 * discard the other firms' completed reviews unless none succeeded.
 */
export async function runDeckReviewJob(jobId: string, configOverride?: DeckReviewRuntimeConfig): Promise<void> {
  const config = configOverride ?? getDeckReviewRuntimeConfig();
  const job = await db.vcDeckReviewJob.findUnique({
    where: { id: jobId },
    include: { startup: { select: { name: true, sector: true, stage: true, region: true, fundingAsk: true } } },
  });

  if (!job) return;
  if (job.status === "completed" || job.status === "extracting_deck") return;
  if (job.status === "failed" && job.errorCategory !== "provider_timeout" && job.errorCategory !== "provider_rate_limited" && job.errorCategory !== "provider_failed") {
    return; // non-retryable failure (e.g. bad PDF) — re-upload instead.
  }
  if (!job.extractedText || job.extractedText.trim().length === 0) {
    await markJobFailed(job.id, "deck_unreadable", "Deck text is missing; upload the deck again.");
    return;
  }

  const firmIds = Array.isArray(job.selectedFirmIds) ? (job.selectedFirmIds as string[]) : [];
  const firms = firmIds
    .map((id) => getInvestmentFirmById(id))
    .filter((firm): firm is InvestmentFirm => Boolean(firm))
    .slice(0, config.maxFirmsPerJob);

  if (firms.length === 0) {
    await markJobFailed(job.id, "internal_error", "No valid investment firms were selected for this job.");
    return;
  }

  await db.vcDeckReviewJob.update({
    where: { id: job.id },
    data: {
      status: "reviewing",
      startedAt: job.startedAt ?? new Date(),
      provider: config.provider,
      model: config.provider === "deepseek" ? config.model : "mock",
      errorCategory: null,
      safeErrorMessage: null,
    },
  });
  auditDeckReview("deck_review_started", {
    jobId: job.id,
    provider: config.provider,
    model: config.provider === "deepseek" ? config.model : "mock",
    firmCount: firms.length,
  });

  const firmReviews: FirmReview[] = [];
  let lastError: DeckReviewProviderError | null = null;

  for (const firm of firms) {
    try {
      if (config.provider === "deepseek") {
        const review = await generateFirmReview(
          {
            firm,
            deckText: job.extractedText,
            reviewInputType: parseInputType(job.reviewInputType),
            manualNotes: job.manualNotes,
            startupProfile: parseStoredStartupProfile(job.startupProfile),
            startup: {
              name: job.startup.name,
              sector: job.startup.sector,
              stage: job.startup.stage,
              region: job.startup.region,
              fundingAsk: job.startup.fundingAsk,
            },
          },
          config
        );
        firmReviews.push(review);
      } else {
        firmReviews.push(generateMockFirmReview({ firm, deckText: job.extractedText }));
      }
    } catch (error) {
      lastError =
        error instanceof DeckReviewProviderError
          ? error
          : new DeckReviewProviderError("provider_failed", "Firm review failed.", false);
      logger.warn("[deck-review] firm review failed", {
        jobId: job.id,
        firmId: firm.id,
        category: lastError.category,
      });
      if (lastError.category === "provider_not_configured") break; // no point trying remaining firms
    }
  }

  if (firmReviews.length === 0) {
    const category = lastError?.category ?? "provider_failed";
    const message =
      category === "provider_not_configured"
        ? "AI review provider is not configured. Set DEEPSEEK_API_KEY (or run in mock mode) and retry."
        : "All firm reviews failed. Retry the review job.";
    await markJobFailed(job.id, category, message);
    return;
  }

  const aggregate = aggregateFirmReviews(firmReviews);
  let missionData:
    | {
        missionGenerationStatus: "completed";
        missionGenerationErrorCategory: null;
        missionGenerationSafeErrorMessage: null;
        investorMissions: Prisma.InputJsonValue;
        roadmapSummary: Prisma.InputJsonValue;
      }
    | {
        missionGenerationStatus: "failed";
        missionGenerationErrorCategory: string;
        missionGenerationSafeErrorMessage: string;
        investorMissions: typeof Prisma.JsonNull;
        roadmapSummary: typeof Prisma.JsonNull;
      };

  await db.vcDeckReviewJob.update({
    where: { id: job.id },
    data: {
      missionGenerationStatus: "generating",
      missionGenerationErrorCategory: null,
      missionGenerationSafeErrorMessage: null,
    },
  });
  auditDeckReview("deck_review_missions_started", { jobId: job.id, provider: config.provider });

  try {
    const generatedMissions = await generateInvestorMissions(
      {
        reviewInputType: parseInputType(job.reviewInputType),
        deckText: job.extractedText,
        startup: {
          name: job.startup.name,
          sector: job.startup.sector,
          stage: job.startup.stage,
          region: job.startup.region,
          fundingAsk: job.startup.fundingAsk,
        },
        startupProfile: parseStoredStartupProfile(job.startupProfile),
        generatedDeck: parseStoredGeneratedDeck(job.generatedDeck),
        selectedFirms: firms,
        firmReviews,
        aggregateReview: aggregate,
      },
      config
    );
    missionData = {
      missionGenerationStatus: "completed",
      missionGenerationErrorCategory: null,
      missionGenerationSafeErrorMessage: null,
      investorMissions: generatedMissions.missions as unknown as Prisma.InputJsonValue,
      roadmapSummary: generatedMissions.roadmapSummary as unknown as Prisma.InputJsonValue,
    };
    auditDeckReview("deck_review_missions_completed", {
      jobId: job.id,
      missionCount: generatedMissions.missions.length,
    });
  } catch (error) {
    const providerError =
      error instanceof DeckReviewProviderError
        ? error
        : new DeckReviewProviderError("provider_failed", "Investor mission generation failed.", true);
    missionData = {
      missionGenerationStatus: "failed",
      missionGenerationErrorCategory: providerError.category,
      missionGenerationSafeErrorMessage: "Investor mission generation failed, but the funding-market review completed.",
      investorMissions: Prisma.JsonNull,
      roadmapSummary: Prisma.JsonNull,
    };
    auditDeckReview("deck_review_missions_failed", {
      jobId: job.id,
      category: providerError.category,
    });
  }

  await db.vcDeckReviewJob.update({
    where: { id: job.id },
    data: {
      status: "completed",
      completedAt: new Date(),
      firmReviews: firmReviews as unknown as Prisma.InputJsonValue,
      aggregateReview: aggregate as unknown as Prisma.InputJsonValue,
      ...missionData,
    },
  });

  auditDeckReview("deck_review_completed", {
    jobId: job.id,
    provider: config.provider,
    firmCount: firmReviews.length,
    failedFirms: firms.length - firmReviews.length,
    overallDecision: aggregate.overallDecision,
    overallScore: aggregate.overallScore,
  });
}
