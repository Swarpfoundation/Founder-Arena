import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Ban, Crown, EyeOff, ShieldCheck, Video } from "lucide-react";
import { requireCurrentUser } from "@/lib/auth-helpers";
import { getUserPlan } from "@/lib/billing/entitlements";
import {
  adConsentStateFromSettings,
  evaluateConsentForRewardedAds,
  getConsentDisclosureCopy,
} from "@/lib/monetization/consent";
import { getAdPrivacyStateForUser } from "@/lib/monetization/consent/ad-privacy-store";
import { getRewardedAdProvider } from "@/lib/monetization/rewarded-ads";
import { GameCard } from "@/components/game/GameCard";
import { AdPrivacySettingsClient } from "./ad-privacy-settings-client";

export const dynamic = "force-dynamic";

export default async function AdPrivacySettingsPage() {
  const user = await requireCurrentUser();
  const planId = await getUserPlan(user.id);
  const adPrivacyState = await getAdPrivacyStateForUser(user.id, { take: 6 });
  const consentState = adConsentStateFromSettings(adPrivacyState.settings);
  const consentDecision = evaluateConsentForRewardedAds(consentState);
  const mockStatus = getRewardedAdProvider("mock").getStatus({
    consentDecision,
    runtime: "server",
    mockMode: true,
  });
  const googleStatus = getRewardedAdProvider("google_gpt_web_future").getStatus({
    consentDecision,
    runtime: "server",
    mockMode: false,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 pb-12 pt-24 text-white md:px-8">
      <div className="mb-6">
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>
      </div>

      <div className="mb-8">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400/45">
          Ad Privacy // Rewards
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
          Rewarded Ad Safety Console
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/45">
          Founder Arena currently runs mock rewarded review acceleration only. Real ad providers,
          CMPs, tracking, ATT prompts, and production ad units are disabled.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatusTile
          icon={<Video className="h-4 w-4" />}
          label="Active Provider"
          value="Mock only"
          detail={`Provider status: ${mockStatus}`}
        />
        <StatusTile
          icon={<Ban className="h-4 w-4" />}
          label="Real Ads"
          value="Disabled"
          detail={`Google GPT future status: ${googleStatus}`}
        />
        <StatusTile
          icon={<Crown className="h-4 w-4" />}
          label="Plan Boundary"
          value={planId === "free" ? "Free opt-in only" : "Ad-free plan"}
          detail="Pro/Max do not need reward ads for review cooldowns."
        />
      </div>

      <div className="space-y-6">
        <GameCard glow="cyan" className="relative">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-cyan-300" />
            <div>
              <h2 className="text-lg font-black uppercase tracking-wide text-white">Consent Gate</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {consentDecision.reason}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/40">
                {getConsentDisclosureCopy(consentState.region, consentState.status)}
              </p>
            </div>
          </div>
        </GameCard>

        <AdPrivacySettingsClient initialSettings={adPrivacyState.settings} />

        <GameCard className="relative">
          <h2 className="text-lg font-black uppercase tracking-wide text-white">Consent History</h2>
          <p className="mt-2 text-sm text-white/45">
            Recent ad privacy settings changes are stored as safe account audit records. No startup
            pitch, financial, scoring, or provider tracking data is stored here.
          </p>
          <div className="mt-4 space-y-2">
            {adPrivacyState.auditEntries.length > 0 ? (
              adPrivacyState.auditEntries.map((entry) => (
                <div key={entry.id} className="border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-wider text-cyan-200">
                      {entry.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-white/35">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-white/45">{entry.reason}</p>
                </div>
              ))
            ) : (
              <div className="border border-white/10 bg-white/[0.03] p-3 text-sm text-white/45">
                No ad privacy changes recorded yet. Safe defaults are active.
              </div>
            )}
          </div>
        </GameCard>

        <GameCard className="relative">
          <div className="mb-3 flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-violet-300" />
            <h2 className="text-lg font-black uppercase tracking-wide text-white">Data Minimization Rules</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              "No pitch text or financial plans are sent to ad providers.",
              "No private founder data, emails, or raw AI prompts are sent.",
              "No startup metrics, scores, burn, runway, valuation, or revenue are sent.",
              "Only coarse placement and opaque ledger IDs are allowed in future provider context.",
            ].map((item) => (
              <div key={item} className="border border-white/10 bg-white/[0.03] p-3 text-sm text-white/55">
                {item}
              </div>
            ))}
          </div>
        </GameCard>
      </div>
    </div>
  );
}

function StatusTile({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center gap-2 text-cyan-300">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">{label}</p>
      </div>
      <p className="text-lg font-black uppercase tracking-wide text-white">{value}</p>
      <p className="mt-1 text-xs text-white/40">{detail}</p>
    </div>
  );
}
