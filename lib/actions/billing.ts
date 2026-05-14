"use server";

import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-helpers";
import {
  createCheckoutSession,
  createBillingPortalSession,
  isStripeEnabled,
} from "@/lib/billing/stripe";
import { getUserEntitlements } from "@/lib/billing/entitlements";
import { getOrCreateWallet } from "@/lib/billing/credits";
import { STRIPE_PRICE_IDS, type PlanId } from "@/lib/billing/plans";

export async function getBillingState() {
  const user = await requireCurrentUser();

  const [entitlements, subscription, wallet] = await Promise.all([
    getUserEntitlements(user.id),
    db.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    getOrCreateWallet(user.id),
  ]);

  return {
    user: { id: user.id, email: user.email, name: user.name, image: user.image },
    planId: entitlements.planId,
    planName: entitlements.planName,
    limits: entitlements.limits,
    usage: entitlements.usage,
    remaining: entitlements.remaining,
    subscription: subscription
      ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        }
      : null,
    wallet: {
      speedTokens: wallet.speedTokens,
      adTokensEarned: wallet.adTokensEarned,
      tokensUsed: wallet.tokensUsed,
    },
    stripeEnabled: isStripeEnabled(),
  };
}

export async function createCheckoutSessionAction(planId: PlanId, billingCycle: "monthly" | "yearly") {
  const user = await requireCurrentUser();

  if (!isStripeEnabled()) {
    throw new Error("Billing is not configured.");
  }

  const priceKey = `${planId}_${billingCycle}` as const;
  const priceId = STRIPE_PRICE_IDS[priceKey];
  if (!priceId) {
    throw new Error(`Price ID not configured for ${priceKey}.`);
  }

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const session = await createCheckoutSession({
    userId: user.id,
    email: user.email,
    priceId,
    successUrl: `${baseUrl}/billing?success=true`,
    cancelUrl: `${baseUrl}/pricing?canceled=true`,
  });

  return { url: session.url };
}

export async function createBillingPortalAction() {
  const user = await requireCurrentUser();

  if (!isStripeEnabled()) {
    throw new Error("Billing is not configured.");
  }

  const subscription = await db.subscription.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription?.stripeCustomerId) {
    throw new Error("No active subscription found.");
  }

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const portal = await createBillingPortalSession({
    customerId: subscription.stripeCustomerId,
    returnUrl: `${baseUrl}/billing`,
  });

  return { url: portal.url };
}

export async function watchRewardedAdAction() {
  const user = await requireCurrentUser();

  const simulated = process.env.REWARDED_ADS_SIMULATED === "true";
  if (!simulated && process.env.REWARDED_ADS_ENABLED !== "true") {
    throw new Error("Rewarded ads are not available.");
  }

  // In simulated mode, grant token immediately.
  // In real mode, this would verify the ad provider callback first.
  const { addTokens } = await import("@/lib/billing/credits");
  await addTokens(user.id, 1, "ad");

  return { success: true, tokensGranted: 1, simulated };
}
