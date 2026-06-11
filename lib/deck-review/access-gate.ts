import "server-only";

import { Prisma } from "@prisma/client";
import { evaluatePrivateBetaAdminAccess } from "@/lib/admin/private-beta-dashboard";
import { getUserPlan } from "@/lib/billing/entitlements";
import { db } from "@/lib/db";
import { REFERRAL_REWARD_ACTION_TYPE, createReferralRewardLedgerEntry } from "@/lib/growth/referral-rules";
import { getSubmissionCreditBalance } from "@/lib/growth/submission-limits";

export type DeckAiAction = "deck_review" | "deck_generation";

export interface DeckAiAccessState {
  allowed: boolean;
  planId: "free" | "pro" | "max";
  isPremium: boolean;
  isAdmin: boolean;
  devBypass: boolean;
  availableCredits: number;
  willUseCredit: boolean;
  upgradeRequired: boolean;
  rewardedCreditAvailable: boolean;
  requiredAction?: "premium_or_reward_credit";
  reason?: string;
}

export class DeckAiAccessRequiredError extends Error {
  constructor(public state: DeckAiAccessState) {
    super(state.reason ?? "Premium or review credit required.");
    this.name = "DeckAiAccessRequiredError";
  }
}

export function evaluateDeckAiAccess(input: {
  planId: "free" | "pro" | "max";
  availableCredits: number;
  isAdmin?: boolean;
  devBypass?: boolean;
}): DeckAiAccessState {
  const isPremium = input.planId !== "free";
  const isAdmin = Boolean(input.isAdmin);
  const devBypass = Boolean(input.devBypass);
  const willUseCredit = !isPremium && !isAdmin && !devBypass && input.availableCredits > 0;
  const allowed = isPremium || isAdmin || devBypass || willUseCredit;

  return {
    allowed,
    planId: input.planId,
    isPremium,
    isAdmin,
    devBypass,
    availableCredits: input.availableCredits,
    willUseCredit,
    upgradeRequired: !allowed,
    rewardedCreditAvailable: input.availableCredits > 0,
    requiredAction: allowed ? undefined : "premium_or_reward_credit",
    reason: allowed
      ? undefined
      : "AI deck generation and investment firm review require Pro/Max or one rewarded/referral review credit.",
  };
}

export async function getDeckAiAccessState(input: {
  user: { id: string; email?: string | null };
  env?: NodeJS.ProcessEnv | Partial<NodeJS.ProcessEnv>;
}): Promise<DeckAiAccessState> {
  const env = input.env ?? process.env;
  const [planId, credits] = await Promise.all([
    getUserPlan(input.user.id),
    getSubmissionCreditBalance(input.user.id),
  ]);
  const admin = evaluatePrivateBetaAdminAccess(input.user, env);
  const devBypass = env.NODE_ENV !== "production" && env.DECK_AI_ACCESS_DEV_BYPASS === "true";
  return evaluateDeckAiAccess({
    planId,
    availableCredits: credits.availableCredits,
    isAdmin: admin.allowed,
    devBypass,
  });
}

export function buildDeckAiAccessResponse(state: DeckAiAccessState) {
  return {
    error: state.reason ?? "Premium or review credit required.",
    errorCategory: "access_required",
    upgradeRequired: state.upgradeRequired,
    rewardedCreditAvailable: state.rewardedCreditAvailable,
    requiredAction: state.requiredAction ?? "premium_or_reward_credit",
    availableCredits: state.availableCredits,
    planId: state.planId,
  };
}

async function hasCreditSpend(userId: string, idempotencyKey: string): Promise<boolean> {
  const existing = await db.queuedAction.findFirst({
    where: {
      userId,
      actionType: REFERRAL_REWARD_ACTION_TYPE,
      payload: {
        path: ["idempotencyKey"],
        equals: idempotencyKey,
      } as Prisma.JsonFilter,
    },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function consumeDeckAiAccess(input: {
  user: { id: string; email?: string | null };
  startupId?: string | null;
  action: DeckAiAction;
  idempotencyKey: string;
  env?: NodeJS.ProcessEnv | Partial<NodeJS.ProcessEnv>;
  now?: Date;
}): Promise<{ consumedCredit: boolean; state: DeckAiAccessState }> {
  const state = await getDeckAiAccessState({ user: input.user, env: input.env });
  if (!state.allowed) throw new DeckAiAccessRequiredError(state);
  if (!state.willUseCredit) return { consumedCredit: false, state };

  const now = input.now ?? new Date();
  const idempotencyKey = `deck-ai-access:${input.action}:${input.idempotencyKey}`;
  if (await hasCreditSpend(input.user.id, idempotencyKey)) {
    return { consumedCredit: false, state };
  }

  const creditSpend = createReferralRewardLedgerEntry({
    userId: input.user.id,
    type: "submission_credit",
    amount: -1,
    reason: input.action === "deck_generation" ? "ai_deck_generation" : "ai_deck_review",
    idempotencyKey,
    now,
    metadataSafe: {
      startupId: input.startupId ?? null,
      action: input.action,
    },
  });

  await db.queuedAction.create({
    data: {
      userId: input.user.id,
      startupId: input.startupId ?? undefined,
      actionType: REFERRAL_REWARD_ACTION_TYPE,
      payload: creditSpend as unknown as Prisma.InputJsonValue,
      status: "completed",
      processedAt: now,
    },
  });

  return { consumedCredit: true, state };
}
