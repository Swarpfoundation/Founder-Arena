import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getBillingState } from "@/lib/actions/billing";
import { PLANS } from "@/lib/billing/plans";
import Link from "next/link";
import {
  Zap,
  Rocket,
  Crown,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  Check,
} from "lucide-react";

const planIcons: Record<string, React.ReactNode> = {
  free: <Rocket className="w-5 h-5" />,
  pro: <Zap className="w-5 h-5" />,
  max: <Crown className="w-5 h-5" />,
};

const planColors: Record<string, string> = {
  free: "text-white/60 border-white/10",
  pro: "text-cyan-400 border-cyan-400/30",
  max: "text-violet-400 border-violet-400/30",
};

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const state = await getBillingState();
  const params = await searchParams;
  const justSubscribed = params.success === "true";

  const plan = PLANS[state.planId];
  const usage = state.usage;
  const remaining = state.remaining;

  return (
    <div className="min-h-screen bg-[#05050a] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] tracking-[0.4em] text-white/30 mb-2">BILLING // ACCOUNT</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
            <span className="text-white">SUBSCRIPTION</span>{" "}
            <span className="text-cyan-400 text-glow-cyan">TERMINAL</span>
          </h1>
        </div>

        {justSubscribed && (
          <div className="mb-8 p-4 border border-emerald-400/30 bg-emerald-400/5 text-emerald-400 text-sm tracking-wider flex items-center gap-3">
            <Check className="w-5 h-5" />
            SUBSCRIPTION ACTIVATED — WELCOME TO {plan.name.toUpperCase()}
          </div>
        )}

        {/* Current Plan Card */}
        <div className={`relative p-6 border mb-8 ${planColors[state.planId]}`}>
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-current opacity-40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-current opacity-40" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {planIcons[state.planId]}
              <div>
                <p className="text-[10px] tracking-[0.2em] text-white/30">CURRENT LOADOUT</p>
                <p className={`text-2xl font-black ${planColors[state.planId].split(" ")[0]}`}>
                  {plan.name}
                </p>
              </div>
            </div>
            {state.subscription && (
              <div className="text-right">
                <p className="text-[10px] tracking-[0.2em] text-white/30">RENEWS</p>
                <p className="text-white/60 text-sm">
                  {state.subscription.currentPeriodEnd
                    ? new Date(state.subscription.currentPeriodEnd).toLocaleDateString()
                    : "N/A"}
                </p>
                {state.subscription.cancelAtPeriodEnd && (
                  <p className="text-rose-400 text-xs mt-1">Cancels at period end</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric label="STARTUPS" used={usage.startups} limit={remaining.startups} />
            <Metric label="REVIEWS" used={usage.reviews} limit={remaining.reviews} />
            <Metric label="SIMULATIONS" used={usage.simulations} limit={remaining.simulations} />
            <Metric label="TOKENS" used={state.wallet.tokensUsed} limit={state.wallet.speedTokens} />
          </div>
        </div>

        {/* Speed Token Section */}
        <div className="relative p-6 border border-white/10 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-cyan-400/30" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-cyan-400/30" />

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] tracking-[0.2em] text-white/30">SPEED TOKENS</p>
              <p className="text-xl font-black text-cyan-400">{state.wallet.speedTokens} AVAILABLE</p>
            </div>
            <Zap className="w-8 h-8 text-cyan-400/30" />
          </div>

          <p className="text-white/40 text-sm mb-4">
            Spend 1 token to bypass review cooldowns or unlock an extra AI review beyond your monthly quota.
          </p>

          <div className="flex flex-wrap gap-3">
            {state.stripeEnabled && state.subscription && (
              <form
                action={async () => {
                  "use server";
                  const { createBillingPortalAction } = await import("@/lib/actions/billing");
                  const result = await createBillingPortalAction();
                  if (result.url) redirect(result.url);
                }}
              >
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 border border-cyan-400/30 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-400/10 transition-all text-sm tracking-wider cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" /> MANAGE BILLING
                </button>
              </form>
            )}

            <form
              action={async () => {
                "use server";
                const { watchRewardedAdAction } = await import("@/lib/actions/billing");
                await watchRewardedAdAction();
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 border border-white/10 text-white/60 hover:border-white/30 hover:text-white transition-all text-sm tracking-wider cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" /> WATCH AD +1 TOKEN
              </button>
            </form>
          </div>

          {state.wallet.adTokensEarned > 0 && (
            <p className="text-white/20 text-xs mt-3">
              {state.wallet.adTokensEarned} tokens earned from ads · {state.wallet.tokensUsed} spent
            </p>
          )}
        </div>

        {/* Upgrade / Compare */}
        {state.planId !== "max" && (
          <div className="mb-8">
            <p className="text-[10px] tracking-[0.2em] text-white/30 mb-4">UPGRADE OPTIONS</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(state.planId === "free" ? (["pro", "max"] as const) : (["max"] as const)).map((targetPlan) => {
                const target = PLANS[targetPlan];
                return (
                  <div key={targetPlan} className="p-4 border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-lg font-black ${targetPlan === "pro" ? "text-cyan-400" : "text-violet-400"}`}>
                        {target.name}
                      </p>
                      <span className="text-white/40">${target.monthlyPrice}/mo</span>
                    </div>
                    <ul className="text-sm text-white/40 space-y-1 mb-4">
                      {target.features.slice(0, 4).map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="w-3 h-3 text-white/20" /> {f}
                        </li>
                      ))}
                    </ul>
                    <form
                      action={async () => {
                        "use server";
                        const { createCheckoutSessionAction } = await import("@/lib/actions/billing");
                        const result = await createCheckoutSessionAction(targetPlan, "monthly");
                        if (result.url) redirect(result.url);
                      }}
                    >
                      <button
                        type="submit"
                        className="w-full py-2 border border-white/10 text-white/60 hover:border-white/30 hover:text-white transition-all text-sm tracking-wider cursor-pointer"
                      >
                        UPGRADE TO {target.name.toUpperCase()}
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stripe disabled notice */}
        {!state.stripeEnabled && (
          <div className="p-4 border border-amber-400/20 bg-amber-400/5 text-amber-400/80 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to enable billing.
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/pricing" className="text-white/30 hover:text-white/60 text-sm transition-colors">
            View full plan comparison →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, used, limit }: { label: string; used: number; limit: number | typeof Infinity }) {
  const isUnlimited = limit === Infinity;
  const numericLimit = typeof limit === "number" ? limit : 0;
  const pct = isUnlimited ? 0 : numericLimit > 0 ? (used / (used + numericLimit)) * 100 : 100;

  return (
    <div>
      <p className="text-[10px] tracking-[0.2em] text-white/20 mb-1">{label}</p>
      <p className="text-xl font-black text-white/80">
        {used}
        <span className="text-white/30 text-sm">
          {isUnlimited ? " / ∞" : ` / ${used + numericLimit}`}
        </span>
      </p>
      {!isUnlimited && numericLimit >= 0 && (
        <div className="mt-1 h-1 bg-white/5 overflow-hidden">
          <div
            className="h-full bg-cyan-400/60"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      )}
    </div>
  );
}
