import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { Check, Zap, Crown, Rocket } from "lucide-react";
import { headers } from "next/headers";

const planIcons: Record<PlanId, React.ReactNode> = {
  free: <Rocket className="w-6 h-6" />,
  pro: <Zap className="w-6 h-6" />,
  max: <Crown className="w-6 h-6" />,
};

const planColors: Record<PlanId, string> = {
  free: "border-white/10 hover:border-white/20",
  pro: "border-cyan-400/40 hover:border-cyan-400/60 glow-cyan",
  max: "border-violet-400/40 hover:border-violet-400/60 glow-violet",
};

const planAccent: Record<PlanId, string> = {
  free: "text-white/60",
  pro: "text-cyan-400",
  max: "text-violet-400",
};

const planButton: Record<PlanId, string> = {
  free: "border-white/10 text-white/60 hover:border-white/30 hover:text-white",
  pro: "border-cyan-400/40 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-400/10",
  max: "border-violet-400/40 text-violet-400 hover:border-violet-400 hover:bg-violet-400/10",
};

export const dynamic = "force-dynamic";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const canceled = params.canceled === "true";
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[10px] tracking-[0.4em] text-white/30 mb-4">PHASE 23 // MONETIZATION</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
            <span className="text-white">CHOOSE YOUR</span>{" "}
            <span className="text-cyan-400 text-glow-cyan">LOADOUT</span>
          </h1>
          <p className="text-white/40 max-w-xl mx-auto text-sm leading-relaxed">
            Fairness-first monetization. Paid plans unlock speed and convenience only.
            They do NOT improve valuation, scores, or outcomes.
          </p>
          {canceled && (
            <div className="mt-6 inline-block px-6 py-3 border border-rose-400/30 text-rose-400 text-sm tracking-wider">
              CHECKOUT CANCELED — NO CHARGE APPLIED
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(PLANS) as PlanId[]).map((planId) => {
            const plan = PLANS[planId];
            const isCurrent = user?.plan === planId;
            return (
              <div
                key={planId}
                className={`relative p-6 border bg-black/40 backdrop-blur-sm transition-all ${planColors[planId]} ${isCurrent ? "ring-1 ring-current" : ""}`}
              >
                {/* HUD corners */}
                <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-current opacity-40" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-current opacity-40" />

                {isCurrent && (
                  <div className="absolute top-0 right-0 px-3 py-1 text-[10px] tracking-[0.2em] bg-current text-black font-bold">
                    ACTIVE
                  </div>
                )}

                <div className={`${planAccent[planId]} mb-4`}>{planIcons[planId]}</div>
                <h2 className="text-2xl font-black tracking-tight mb-1">{plan.name}</h2>
                <p className="text-white/40 text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className={`text-4xl font-black ${planAccent[planId]}`}>
                    ${plan.monthlyPrice}
                  </span>
                  <span className="text-white/30 text-sm">/mo</span>
                  {plan.yearlyPrice > 0 && (
                    <p className="text-white/30 text-xs mt-1">
                      ${plan.yearlyPrice}/yr — save {Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)}%
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-white/60">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${planAccent[planId]}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {user ? (
                  isCurrent ? (
                    <Link
                      href="/billing"
                      className={`block w-full text-center py-3 border text-sm font-bold tracking-wider transition-all ${planButton[planId]}`}
                    >
                      MANAGE
                    </Link>
                  ) : (
                    <form
                      action={async () => {
                        "use server";
                        const { createCheckoutSessionAction } = await import("@/lib/actions/billing");
                        const result = await createCheckoutSessionAction(planId, "monthly");
                        if (result.url) {
                          redirect(result.url);
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className={`block w-full text-center py-3 border text-sm font-bold tracking-wider transition-all cursor-pointer ${planButton[planId]}`}
                      >
                        {planId === "free" ? "SELECT FREE" : "UPGRADE"}
                      </button>
                    </form>
                  )
                ) : (
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(baseUrl + "/pricing")}`}
                    className={`block w-full text-center py-3 border text-sm font-bold tracking-wider transition-all ${planButton[planId]}`}
                  >
                    SIGN IN TO SELECT
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Fairness notice */}
        <div className="mt-16 text-center">
          <div className="inline-block p-6 border border-white/5 bg-white/[0.02]">
            <p className="text-[10px] tracking-[0.3em] text-white/20 mb-2">FAIRNESS GUARANTEE</p>
            <p className="text-white/30 text-sm max-w-lg">
              Paid subscribers get convenience features only — faster reviews, more startups, speed tokens.
              No plan affects game math, scores, valuation, or final outcome. Skill decides the leaderboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
