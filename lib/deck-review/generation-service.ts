import "server-only";

import { Prisma } from "@prisma/client";
import { evaluatePrivateBetaAdminAccess } from "@/lib/admin/private-beta-dashboard";
import { db } from "@/lib/db";
import { generatedDeckSchema, type GeneratedDeck, type StartupProfile } from "./schemas";

type DeckGenerationJobRecord = Prisma.VcDeckGenerationJobGetPayload<object>;

export interface SafeDeckGenerationJobView {
  jobId: string;
  startupId: string;
  status: string;
  provider: string | null;
  model: string | null;
  errorCategory: string | null;
  safeErrorMessage: string | null;
  accessUsedCredit: boolean;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  generatedDeck: GeneratedDeck | null;
}

function parseGeneratedDeck(value: Prisma.JsonValue | null): GeneratedDeck | null {
  if (!value || typeof value !== "object") return null;
  const parsed = generatedDeckSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function buildSafeDeckGenerationJobView(job: DeckGenerationJobRecord): SafeDeckGenerationJobView {
  return {
    jobId: job.id,
    startupId: job.startupId,
    status: job.status,
    provider: job.provider,
    model: job.model,
    errorCategory: job.errorCategory,
    safeErrorMessage: job.safeErrorMessage,
    accessUsedCredit: job.accessUsedCredit,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    generatedDeck: job.status === "completed" ? parseGeneratedDeck(job.generatedDeck) : null,
  };
}

export async function getDeckGenerationJobForUser(input: {
  jobId: string;
  user: { id: string; email?: string | null };
}): Promise<{ ok: true; job: DeckGenerationJobRecord; role: "owner" | "admin" } | { ok: false; reason: "not_found" | "forbidden" }> {
  const job = await db.vcDeckGenerationJob.findUnique({ where: { id: input.jobId } });
  if (!job) return { ok: false, reason: "not_found" };
  if (job.userId === input.user.id) return { ok: true, job, role: "owner" };
  const admin = evaluatePrivateBetaAdminAccess(input.user);
  if (admin.allowed) return { ok: true, job, role: "admin" };
  return { ok: false, reason: "not_found" };
}

export function startupProfileJson(profile: StartupProfile): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(profile)) as Prisma.InputJsonValue;
}
