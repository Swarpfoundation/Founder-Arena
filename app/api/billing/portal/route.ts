import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { createBillingPortalSession, isStripeEnabled } from "@/lib/billing/stripe";

export async function POST(_req: NextRequest) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await db.subscription.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
  }

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  try {
    const portal = await createBillingPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl: `${baseUrl}/billing`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Portal failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
