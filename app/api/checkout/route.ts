import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createCheckoutSession, isStripeEnabled } from "@/lib/billing/stripe";
import { STRIPE_PRICE_IDS, type PlanId } from "@/lib/billing/plans";

export async function POST(req: NextRequest) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { planId: PlanId; billingCycle: "monthly" | "yearly" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { planId, billingCycle } = body;
  const priceKey = `${planId}_${billingCycle}` as const;
  const priceId = STRIPE_PRICE_IDS[priceKey];

  if (!priceId) {
    return NextResponse.json({ error: `Price ID not configured for ${priceKey}` }, { status: 400 });
  }

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  try {
    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      priceId,
      successUrl: `${baseUrl}/billing?success=true`,
      cancelUrl: `${baseUrl}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
