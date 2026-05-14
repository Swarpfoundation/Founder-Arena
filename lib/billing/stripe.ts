/**
 * Founder Arena — Stripe Integration
 *
 * Server-side only. Never expose secret keys to the client.
 */

import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = secretKey
  ? new Stripe(secretKey, {
      typescript: true,
    })
  : null;

export function isStripeEnabled(): boolean {
  return !!stripe && !!process.env.STRIPE_WEBHOOK_SECRET;
}

export async function createCheckoutSession({
  userId,
  email,
  priceId,
  mode = "subscription",
  successUrl,
  cancelUrl,
}: {
  userId: string;
  email: string;
  priceId: string;
  mode?: "subscription" | "payment";
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) throw new Error("Stripe is not configured.");

  // Find or create customer
  const customers = await stripe.customers.list({ email, limit: 1 });
  let customerId = customers.data[0]?.id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { userId },
    },
  });

  return session;
}

export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  if (!stripe) throw new Error("Stripe is not configured.");

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function constructStripeEvent(payload: string | Buffer, signature: string) {
  if (!stripe) throw new Error("Stripe is not configured.");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Stripe webhook secret is not configured.");

  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export async function getSubscription(subscriptionId: string) {
  if (!stripe) throw new Error("Stripe is not configured.");
  return stripe.subscriptions.retrieve(subscriptionId, { expand: ["default_payment_method"] });
}

export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) throw new Error("Stripe is not configured.");
  return stripe.subscriptions.cancel(subscriptionId);
}
