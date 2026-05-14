import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe, constructStripeEvent } from "@/lib/billing/stripe";
import { grantMonthlyTokens } from "@/lib/billing/credits";
import type Stripe from "stripe";

// Stripe v22 types omit some fields that exist in the API.
// We use a loose accessor for those properties.
type LooseStripeSub = Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
};

type LooseStripeInvoice = Stripe.Invoice & {
  subscription?: string | null;
};

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = await constructStripeEvent(payload, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as LooseStripeInvoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as LooseStripeInvoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as LooseStripeSub;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as LooseStripeSub;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook handler error:", message);
    return NextResponse.json({ error: `Handler error: ${message}` }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("Checkout session missing userId metadata");
    return;
  }

  if (session.mode === "subscription" && session.subscription) {
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    const sub = (await stripe!.subscriptions.retrieve(subscriptionId)) as unknown as LooseStripeSub;

    const priceId = sub.items.data[0]?.price.id;
    const planId = derivePlanFromPriceId(priceId);

    await db.subscription.upsert({
      where: { stripeSubscriptionId: subscriptionId },
      create: {
        userId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
      update: {
        status: sub.status,
        stripePriceId: priceId,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });

    await db.user.update({
      where: { id: userId },
      data: { plan: planId },
    });

    await grantMonthlyTokens(userId, planId);
  }
}

async function handleInvoicePaymentSucceeded(invoice: LooseStripeInvoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId || typeof subscriptionId !== "string") return;

  const sub = await db.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });
  if (!sub) return;

  const stripeSub = (await stripe!.subscriptions.retrieve(subscriptionId)) as unknown as LooseStripeSub;
  const planId = derivePlanFromPriceId(stripeSub.items.data[0]?.price.id);

  await db.subscription.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: stripeSub.status,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
  });

  await db.user.update({
    where: { id: sub.userId },
    data: { plan: planId },
  });

  await grantMonthlyTokens(sub.userId, planId);
}

async function handleInvoicePaymentFailed(invoice: LooseStripeInvoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId || typeof subscriptionId !== "string") return;

  const sub = await db.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });
  if (!sub) return;

  await db.subscription.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: "past_due" },
  });
}

async function handleSubscriptionUpdated(subscription: LooseStripeSub) {
  const sub = await db.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });
  if (!sub) return;

  const planId = derivePlanFromPriceId(subscription.items.data[0]?.price.id);

  await db.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      stripePriceId: subscription.items.data[0]?.price.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  if (subscription.status === "active" || subscription.status === "trialing") {
    await db.user.update({
      where: { id: sub.userId },
      data: { plan: planId },
    });
  }
}

async function handleSubscriptionDeleted(subscription: LooseStripeSub) {
  const sub = await db.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });
  if (!sub) return;

  await db.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "canceled",
      cancelAtPeriodEnd: false,
    },
  });

  await db.user.update({
    where: { id: sub.userId },
    data: { plan: "free" },
  });
}

function derivePlanFromPriceId(priceId: string | undefined): "free" | "pro" | "max" {
  if (!priceId) return "free";
  const map: Record<string, "pro" | "max"> = {};
  if (process.env.STRIPE_PRICE_PRO_MONTHLY) map[process.env.STRIPE_PRICE_PRO_MONTHLY] = "pro";
  if (process.env.STRIPE_PRICE_PRO_YEARLY) map[process.env.STRIPE_PRICE_PRO_YEARLY] = "pro";
  if (process.env.STRIPE_PRICE_MAX_MONTHLY) map[process.env.STRIPE_PRICE_MAX_MONTHLY] = "max";
  if (process.env.STRIPE_PRICE_MAX_YEARLY) map[process.env.STRIPE_PRICE_MAX_YEARLY] = "max";
  return map[priceId] ?? "free";
}
