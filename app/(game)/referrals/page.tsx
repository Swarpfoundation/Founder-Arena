import Link from "next/link";
import { Gift, ShieldCheck, Users, Zap } from "lucide-react";
import { requireAuthRedirect } from "@/lib/auth-helpers";
import { captureReferralFromCookie, getReferralDashboardAction, getWeeklySubmissionStatusAction } from "@/lib/actions/referrals";
import { ReferralCopyBox } from "@/components/growth/ReferralCopyBox";
import { GameCard } from "@/components/game/GameCard";
import { MetricPanel } from "@/components/game/MetricPanel";

export const dynamic = "force-dynamic";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function ReferralsPage() {
  await requireAuthRedirect("/referrals");
  await captureReferralFromCookie();
  const [dashboard, weekly] = await Promise.all([
    getReferralDashboardAction(),
    getWeeklySubmissionStatusAction(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-12 pt-24 md:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.4em] text-cyan-400/40">Growth Loop</p>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">Founder Referrals</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/45">
            Invite serious founders. Both sides receive non-cash Founder Points and extra VC review submission credits.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:bg-white/10"
        >
          Back To Dashboard
        </Link>
      </div>

      <ReferralCopyBox code={dashboard.code} link={dashboard.link} />

      <div className="grid gap-4 md:grid-cols-4">
        <GameCard glow="cyan">
          <MetricPanel label="Founder Points" value={dashboard.founderPoints} icon={<Gift className="h-4 w-4" />} />
        </GameCard>
        <GameCard glow="emerald">
          <MetricPanel label="Review Credits" value={dashboard.submissionCreditsAvailable} icon={<Zap className="h-4 w-4" />} />
        </GameCard>
        <GameCard glow="violet">
          <MetricPanel label="Referral Signups" value={dashboard.signups} icon={<Users className="h-4 w-4" />} />
        </GameCard>
        <GameCard glow="amber">
          <MetricPanel
            label={weekly.isPaid ? "Plan Access" : "Weekly Reviews Left"}
            value={weekly.isPaid ? "Unlimited" : weekly.remainingFreeSubmissions}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
        </GameCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GameCard glow="emerald">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300/70">
            Rewards
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-bold text-white">You get</p>
              <p className="mt-1 text-xs text-white/50">100 Founder Points + 1 VC review submission credit.</p>
            </div>
            <div className="border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-bold text-white">Friend gets</p>
              <p className="mt-1 text-xs text-white/50">100 Founder Points + 1 VC review submission credit after joining.</p>
            </div>
          </div>
          <div className="mt-4 border border-amber-400/20 bg-amber-400/10 p-4 text-xs text-amber-100/80">
            Founder Points are in-game progression points only. They have no cash value, cannot be withdrawn,
            and do not improve leaderboard score, VC decisions, valuation, revenue, or survival.
          </div>
        </GameCard>

        <GameCard glow="cyan">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300/70">
            Weekly Review Access
          </p>
          {weekly.isPaid ? (
            <p className="mt-4 text-sm text-white/60">Your paid plan bypasses the Free weekly submission cap.</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm text-white/60">
              <p>
                Free founders can submit <span className="font-bold text-white">3 VC reviews per week</span>.
              </p>
              <p>
                You have <span className="font-bold text-white">{weekly.remainingFreeSubmissions}</span> free submissions left
                before reset on <span className="font-bold text-white">{formatDate(weekly.windowEnd)}</span>.
              </p>
              <p>
                Referral credits available:{" "}
                <span className="font-bold text-emerald-300">{weekly.submissionCreditsAvailable}</span>
              </p>
            </div>
          )}
        </GameCard>
      </div>

      <GameCard glow="violet">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300/70">
          Reward Ledger
        </p>
        <div className="mt-4 space-y-2">
          {dashboard.rewardLedger.length === 0 ? (
            <p className="text-sm text-white/45">No referral rewards yet.</p>
          ) : (
            dashboard.rewardLedger.slice(0, 12).map((entry) => (
              <div key={entry.idempotencyKey} className="flex items-center justify-between border border-white/10 bg-white/[0.03] px-3 py-2">
                <div>
                  <p className="text-sm font-bold text-white">{entry.reason.replace(/_/g, " ")}</p>
                  <p className="text-xs text-white/35">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
                <p className={entry.amount >= 0 ? "text-emerald-300" : "text-amber-300"}>
                  {entry.amount >= 0 ? "+" : ""}
                  {entry.amount} {entry.type.replace(/_/g, " ")}
                </p>
              </div>
            ))
          )}
        </div>
      </GameCard>
    </div>
  );
}
