import Link from "next/link";
import { AlertTriangle, Ban, CheckCircle2, Clock, Database, Gift, Inbox, RefreshCw, RotateCcw, ShieldCheck, Users } from "lucide-react";
import {
  cancelReviewJobAction,
  reclaimStaleReviewJobAction,
  retryFailedReviewJobAction,
} from "@/lib/actions/admin-private-beta";
import { getPrivateBetaAdminSnapshot } from "@/lib/admin/private-beta-dashboard";
import { GameCard } from "@/components/game/GameCard";
import { MetricPanel } from "@/components/game/MetricPanel";

export const dynamic = "force-dynamic";

function shortDate(value: string | null | undefined) {
  if (!value) return "none";
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusPill({ children, tone = "cyan" }: { children: React.ReactNode; tone?: "cyan" | "emerald" | "amber" | "rose" | "violet" }) {
  const classes = {
    cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
    emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    amber: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    rose: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    violet: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  }[tone];
  return <span className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${classes}`}>{children}</span>;
}

function ActionButton({ children, tone = "cyan" }: { children: React.ReactNode; tone?: "cyan" | "amber" | "rose" }) {
  const classes = {
    cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/15",
    amber: "border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15",
    rose: "border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/15",
  }[tone];
  return (
    <button type="submit" className={`inline-flex items-center gap-1 border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${classes}`}>
      {children}
    </button>
  );
}

export default async function PrivateBetaAdminPage() {
  const snapshot = await getPrivateBetaAdminSnapshot();
  if (!snapshot.access.allowed) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-24 md:px-8">
        <GameCard glow="rose">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-300/70">Admin Only</p>
          <h1 className="mt-2 text-3xl font-black text-white">Private Beta Ops Locked</h1>
          <p className="mt-3 text-sm text-white/55">{snapshot.access.reason}</p>
          <p className="mt-3 text-xs text-white/35">
            Configure `ADMIN_EMAILS` or `ADMIN_USER_IDS` server-side to enable this dashboard.
          </p>
        </GameCard>
      </div>
    );
  }

  const queue = snapshot.reviewQueue!;
  const referrals = snapshot.referralSummary!;
  const weekly = snapshot.weeklySubmissions!;
  const abuseSignals = snapshot.abuseSignals!;
  const env = snapshot.envReadiness!;
  const adminAudit = snapshot.adminAudit!;
  const feedbackInbox = snapshot.feedbackInbox!;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-12 pt-24 md:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.4em] text-cyan-400/40">Admin Operations</p>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">Private Beta Ops</h1>
          <p className="mt-3 max-w-3xl text-sm text-white/45">
            Operational view for review queue health, safe queue actions, referral activity, weekly submission usage, feedback, and private beta readiness.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="emerald">Admin verified</StatusPill>
          <StatusPill tone={env.deepseekKeyPresent ? "emerald" : "amber"}>
            DeepSeek key {env.deepseekKeyPresent ? "present" : "missing"}
          </StatusPill>
          <StatusPill tone={env.adsDisabled ? "emerald" : "amber"}>Ads {env.adsDisabled ? "paused" : "not hidden"}</StatusPill>
        </div>
      </div>

      <GameCard glow="amber">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-5 w-5 text-amber-300" />
          <div>
            <p className="text-sm font-bold text-white">Data minimization notice</p>
            <p className="mt-1 text-xs text-white/50">
              This dashboard masks ids and shows only statuses, counts, timestamps, provider modes, and safe error categories.
              It does not expose prompts, pitch text, provider payloads, secrets, API keys, auth tokens, or billing data.
            </p>
          </div>
        </div>
      </GameCard>

      <section className="grid gap-4 md:grid-cols-4">
        <GameCard glow="cyan"><MetricPanel label="Queued Jobs" value={queue.counts.queued} icon={<Clock className="h-4 w-4" />} /></GameCard>
        <GameCard glow="violet"><MetricPanel label="Running/Retrying" value={queue.counts.running + queue.counts.retrying} icon={<Database className="h-4 w-4" />} /></GameCard>
        <GameCard glow="rose"><MetricPanel label="Failed Jobs" value={queue.counts.failed} icon={<AlertTriangle className="h-4 w-4" />} /></GameCard>
        <GameCard glow="emerald"><MetricPanel label="Completed 24h" value={queue.completedLast24h} icon={<CheckCircle2 className="h-4 w-4" />} /></GameCard>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <GameCard glow="cyan">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300/70">Review Queue Health</p>
              <p className="mt-1 text-xs text-white/40">
                Oldest queued age: {queue.oldestQueuedAgeMinutes} min · Stale running jobs: {queue.staleRunningCount}
              </p>
            </div>
            <StatusPill tone={queue.staleRunningCount > 0 || queue.counts.failed > 0 ? "amber" : "emerald"}>admin actions</StatusPill>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead className="text-white/35">
                <tr className="border-b border-white/10">
                  <th className="py-2">Job</th>
                  <th>Status</th>
                  <th>Provider</th>
                  <th>Mode</th>
                  <th>Attempts</th>
                  <th>Queued</th>
                  <th>Processed</th>
                  <th>Error</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.recentJobs.slice(0, 12).map((job) => (
                  <tr key={job.actionId} className="border-b border-white/5 text-white/60">
                    <td className="py-2 font-mono text-white/70">{job.id}</td>
                    <td><StatusPill tone={job.status === "failed" ? "rose" : job.status === "completed" ? "emerald" : "cyan"}>{job.status}</StatusPill></td>
                    <td>{job.provider}</td>
                    <td>{job.mode}</td>
                    <td>{job.attempts}/{job.maxAttempts}</td>
                    <td>{shortDate(job.queuedAt)}</td>
                    <td>{shortDate(job.processedAt)}</td>
                    <td>{job.lastErrorCategory ?? "none"}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(job.status === "failed" || job.status === "retrying") && (
                          <form action={retryFailedReviewJobAction}>
                            <input type="hidden" name="jobId" value={job.actionId} />
                            <input type="hidden" name="reason" value="Private beta admin retry." />
                            <ActionButton>
                              <RotateCcw className="h-3 w-3" />
                              Retry
                            </ActionButton>
                          </form>
                        )}
                        {job.status === "running" && (
                          <form action={reclaimStaleReviewJobAction}>
                            <input type="hidden" name="jobId" value={job.actionId} />
                            <input type="hidden" name="reason" value="Private beta admin stale-lock reclaim." />
                            <ActionButton tone={job.isStaleRunning ? "amber" : "cyan"}>
                              <RefreshCw className="h-3 w-3" />
                              Reclaim
                            </ActionButton>
                          </form>
                        )}
                        {["queued", "running", "retrying", "failed"].includes(job.status) && (
                          <form action={cancelReviewJobAction}>
                            <input type="hidden" name="jobId" value={job.actionId} />
                            <input type="hidden" name="reason" value="Private beta admin cancel." />
                            <ActionButton tone="rose">
                              <Ban className="h-3 w-3" />
                              Cancel
                            </ActionButton>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GameCard>

        <GameCard glow="violet">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300/70">Private Beta Readiness</p>
          <div className="mt-4 space-y-3 text-sm text-white/60">
            <div className="flex justify-between gap-3"><span>AI reviews</span><span className="text-white">{String(env.aiReviewEnabled)}</span></div>
            <div className="flex justify-between gap-3"><span>Provider</span><span className="text-white">{env.aiReviewProvider}</span></div>
            <div className="flex justify-between gap-3"><span>Mode</span><span className="text-white">{env.aiReviewMode}</span></div>
            <div className="flex justify-between gap-3"><span>Timeout</span><span className="text-white">{env.timeoutMs}ms</span></div>
            <div className="flex justify-between gap-3"><span>Max attempts</span><span className="text-white">{env.maxAttempts}</span></div>
            <div className="flex justify-between gap-3"><span>Public key leak</span><span className={env.nextPublicDeepseekKeyPresent ? "text-rose-300" : "text-emerald-300"}>{env.nextPublicDeepseekKeyPresent ? "present" : "not present"}</span></div>
            <div className="flex justify-between gap-3"><span>Rewarded ads enabled</span><span className={env.rewardedAdsEnabled ? "text-amber-300" : "text-emerald-300"}>{String(env.rewardedAdsEnabled)}</span></div>
          </div>
          <div className="mt-5 space-y-2 text-xs">
            <p className="text-white/35">Commands</p>
            <code className="block border border-white/10 bg-black/30 p-2 text-cyan-200">npm run review:queue:inspect</code>
            <code className="block border border-white/10 bg-black/30 p-2 text-cyan-200">npm run review:worker:once</code>
          </div>
        </GameCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <GameCard glow="violet">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300/70">Admin Audit</p>
          <p className="mt-1 text-xs text-white/40">Recent protected admin mutations. Metadata is allowlisted and secret-free.</p>
          <div className="mt-4 space-y-2">
            {adminAudit.recentActions.length === 0 ? (
              <p className="text-sm text-white/45">No admin actions recorded yet.</p>
            ) : (
              adminAudit.recentActions.slice(0, 8).map((entry) => (
                <div key={entry.id} className="border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-white">{entry.actionType.replace(/_/g, " ")}</p>
                    <span className="text-[10px] text-white/35">{shortDate(entry.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/50">
                    {entry.targetType} {entry.targetId} · {entry.previousStatus ?? "unknown"} → {entry.nextStatus ?? "unknown"}
                  </p>
                  <p className="mt-1 text-[10px] text-white/35">Admin {entry.adminUserId}</p>
                </div>
              ))
            )}
          </div>
        </GameCard>

        <GameCard glow="cyan">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300/70">Feedback Inbox</p>
              <p className="mt-1 text-xs text-white/40">
                Open reports: {feedbackInbox.openCount}. Feedback never mutates review decisions automatically.
              </p>
            </div>
            <Inbox className="h-5 w-5 text-cyan-300" />
          </div>
          <div className="space-y-2">
            {feedbackInbox.recentFeedback.length === 0 ? (
              <p className="text-sm text-white/45">No beta feedback yet.</p>
            ) : (
              feedbackInbox.recentFeedback.slice(0, 10).map((feedback) => (
                <div key={feedback.id} className="border border-white/10 bg-black/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={feedback.status === "open" ? "amber" : "emerald"}>{feedback.status}</StatusPill>
                      <p className="text-sm font-bold text-white">{feedback.type.replace(/_/g, " ")}</p>
                      <span className="text-xs text-white/35">{feedback.category.replace(/_/g, " ")}</span>
                    </div>
                    <span className="text-[10px] text-white/35">{shortDate(feedback.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/60">{feedback.messagePreview || "No preview"}</p>
                  <p className="mt-2 text-[10px] text-white/35">
                    User {feedback.userId} · Startup {feedback.startupId} · Review {feedback.reviewId}
                    {feedback.rating ? ` · Rating ${feedback.rating}/5` : ""}
                    {feedback.decision ? ` · Decision ${feedback.decision}` : ""}
                    {feedback.score ? ` · Score ${feedback.score}` : ""}
                    {feedback.provider ? ` · Provider ${feedback.provider}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </GameCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GameCard glow="emerald">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300/70">Referral Overview</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MetricPanel label="Codes" value={referrals.totalReferralCodes} icon={<Users className="h-4 w-4" />} />
            <MetricPanel label="Attributions" value={referrals.totalAttributions} icon={<Users className="h-4 w-4" />} />
            <MetricPanel label="Successful" value={referrals.successfulReferrals} icon={<CheckCircle2 className="h-4 w-4" />} />
            <MetricPanel label="Rejected" value={referrals.rejectedReferrals} icon={<AlertTriangle className="h-4 w-4" />} />
            <MetricPanel label="Founder Points" value={referrals.founderPointsGranted} icon={<Gift className="h-4 w-4" />} />
            <MetricPanel label="Credits Granted" value={referrals.submissionCreditsGranted} icon={<Gift className="h-4 w-4" />} />
          </div>
          <div className="mt-5">
            <p className="mb-2 text-xs uppercase tracking-widest text-white/35">Top referrers</p>
            {referrals.topReferrers.length === 0 ? (
              <p className="text-sm text-white/40">No referral activity yet.</p>
            ) : (
              referrals.topReferrers.map((referrer) => (
                <div key={referrer.userId} className="flex justify-between border-b border-white/5 py-2 text-sm text-white/60">
                  <span className="font-mono">{referrer.userId}</span>
                  <span>{referrer.count}</span>
                </div>
              ))
            )}
          </div>
        </GameCard>

        <GameCard glow="amber">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300/70">Referral Abuse Signals</p>
          <p className="mt-1 text-xs text-white/40">Warning-only. No IP/device fingerprinting is used.</p>
          <div className="mt-4 space-y-2">
            {abuseSignals.length === 0 ? (
              <p className="text-sm text-white/45">No warning signals detected.</p>
            ) : (
              abuseSignals.map((signal, index) => (
                <div key={`${signal.label}-${index}`} className="border border-amber-400/20 bg-amber-400/10 p-3">
                  <p className="text-sm font-bold text-amber-200">{signal.label}</p>
                  <p className="mt-1 text-xs text-white/55">{signal.detail}</p>
                </div>
              ))
            )}
          </div>
        </GameCard>
      </div>

      <GameCard glow="cyan">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300/70">Weekly Submission Usage</p>
        <p className="mt-1 text-xs text-white/40">
          Window: {shortDate(weekly.windowStart)} to {shortDate(weekly.windowEnd)}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-5">
          <MetricPanel label="Reviews This Week" value={weekly.reviewsSubmittedThisWeek} />
          <MetricPanel label="Free Near Cap" value={weekly.freeUsersNearCap} />
          <MetricPanel label="Free At Cap" value={weekly.freeUsersAtOrOverCap} />
          <MetricPanel label="Credits Spent" value={weekly.creditsSpentThisWeek} />
          <MetricPanel label="Paid Bypass" value={weekly.proMaxBypassCount} />
        </div>
        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {weekly.topUsersBySubmissions.map((user) => (
            <div key={user.userId} className="flex justify-between border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/60">
              <span className="font-mono">{user.userId}</span>
              <span>{user.plan} · {user.count}</span>
            </div>
          ))}
        </div>
      </GameCard>

      <GameCard glow="violet">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300/70">Docs</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href="/referrals" className="text-cyan-300 hover:text-cyan-200">Referral dashboard</Link>
          <span className="text-white/20">|</span>
          <span className="text-white/45">Review queue docs: docs/ai-review/private-beta-deployment-hardening.md</span>
          <span className="text-white/20">|</span>
          <span className="text-white/45">Referral docs: docs/growth/referral-system-weekly-submission-limits.md</span>
        </div>
      </GameCard>
    </div>
  );
}
