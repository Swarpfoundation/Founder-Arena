import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Award, Calendar, Copy, Crown, DollarSign, Flame, Shield, Trophy, Zap } from "lucide-react";
import { CopyLinkButton } from "@/components/social/CopyLinkButton";
import { getSectorIcon } from "@/lib/assets";
import type { PublicFounderShareData, PublicShareTone, PublicStartupShareData } from "@/lib/game/public-share";
import { formatShareMoney } from "@/lib/game/public-share";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<PublicShareTone, string> = {
  cyan: "border-cyan-500/25 bg-cyan-500/[0.055] text-cyan-300",
  violet: "border-violet-500/25 bg-violet-500/[0.055] text-violet-300",
  rose: "border-rose-500/30 bg-rose-500/[0.065] text-rose-300",
  amber: "border-amber-500/30 bg-amber-500/[0.075] text-amber-300",
  emerald: "border-emerald-500/25 bg-emerald-500/[0.055] text-emerald-300",
  white: "border-white/10 bg-white/[0.035] text-white/55",
};

export function PublicStartupResultPoster({
  data,
  pageUrl,
}: {
  data: PublicStartupShareData;
  pageUrl: string;
}) {
  const SectorIcon = getSectorIcon(data.sector);
  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-24 md:px-8">
      <Link href="/" className="mb-5 inline-flex text-sm text-white/40 transition-colors hover:text-white">
        Founder Arena
      </Link>
      <main className={cn("relative overflow-hidden border bg-black/40 p-5 hud-corner md:p-7", TONE_CLASS[data.outcomeStamp.tone])}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-60" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <p className="text-[10px] font-black uppercase tracking-[0.36em] opacity-70">Founder Arena // Public Run Poster</p>
            <h1 className="mt-3 break-words text-3xl font-black uppercase tracking-normal text-white sm:text-4xl md:text-6xl">{data.name}</h1>
            {data.tagline && <p className="mt-3 max-w-3xl text-lg leading-relaxed text-white/58">{data.tagline}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/60">
                <SectorIcon className="h-3.5 w-3.5 text-cyan-300" size={14} />
                {data.sector}
              </span>
              <span className="border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/60">
                {data.status}
              </span>
            </div>

            <div className="mt-8">
              <ShareOutcomeStamp label={data.outcomeStamp.label} verdict={data.outcomeStamp.verdict} tone={data.outcomeStamp.tone} />
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/62">{data.verdictLine}</p>

            <ShareStatStrip
              stats={[
                { label: "Final Score", value: data.finalScore.toLocaleString(), icon: <Trophy className="h-4 w-4" />, tone: "amber" },
                { label: "Valuation", value: formatShareMoney(data.valuation), icon: <DollarSign className="h-4 w-4" />, tone: "emerald" },
                { label: "Revenue", value: formatShareMoney(data.revenue), icon: <Zap className="h-4 w-4" />, tone: "cyan" },
                { label: "Founder Weeks", value: String(data.weeksSurvived), icon: <Calendar className="h-4 w-4" />, tone: "violet" },
              ]}
            />

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <ResultIntelCard title="Run Dossier" icon={<Shield className="h-4 w-4" />} tone="cyan">
                <IntelRow label="Team Size" value={String(data.teamSize)} />
                <IntelRow label="Base Setup" value={data.workSetup.replace(/_/g, " ")} />
                <IntelRow label="Product" value={`${data.productProgress}%`} />
                {data.fundingRaised !== null && <IntelRow label="Funding Raised" value={formatShareMoney(data.fundingRaised)} />}
              </ResultIntelCard>
              <ResultIntelCard title="Run Memory" icon={<Flame className="h-4 w-4" />} tone={data.deathReason ? "rose" : "amber"}>
                {data.biggestCrisis && <IntelRow label="Biggest Crisis" value={data.biggestCrisis} />}
                {data.keyLesson && <IntelRow label="Key Lesson" value={data.keyLesson} />}
                {data.deathReason && <IntelRow label="Cause of Death" value={data.deathReason} />}
                {!data.biggestCrisis && !data.keyLesson && !data.deathReason && <p className="text-sm text-white/45">No public story beats were recorded for this run.</p>}
              </ResultIntelCard>
            </div>
          </section>

          <aside className="space-y-4">
            <ShareCallToActionPanel pageUrl={pageUrl} shareText={data.shareText} />
            {data.founderSlug && (
              <section className="border border-violet-500/20 bg-violet-500/[0.045] p-5 text-violet-300 hud-corner">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Founded By</p>
                <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-white">{data.founderName}</h2>
                <Link href={`/f/${data.founderSlug}`} className="mt-4 inline-flex items-center gap-2 border border-current/25 bg-black/20 px-3 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-white/10">
                  View Founder Card
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </section>
            )}
            {data.leaderboardScore !== null && (
              <section className="border border-amber-500/20 bg-amber-500/[0.045] p-5 text-amber-300 hud-corner">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Arena Placement</p>
                <p className="mt-1 text-3xl font-black text-white">{data.leaderboardScore.toLocaleString()}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-white/45">{data.leaderboardCategory ?? "overall"} leaderboard score</p>
              </section>
            )}
            <ShareSafetyNotice />
          </aside>
        </div>
      </main>
    </div>
  );
}

export function PublicFounderLegacyCard({
  data,
  pageUrl,
}: {
  data: PublicFounderShareData;
  pageUrl: string;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-24 md:px-8">
      <Link href="/" className="mb-5 inline-flex text-sm text-white/40 transition-colors hover:text-white">
        Founder Arena
      </Link>
      <main className="relative overflow-hidden border border-violet-500/25 bg-black/40 p-5 text-violet-300 hud-corner md:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <p className="text-[10px] font-black uppercase tracking-[0.36em] opacity-70">Founder Arena // Public Legacy Card</p>
            <h1 className="mt-3 break-words text-3xl font-black uppercase tracking-normal text-white sm:text-4xl md:text-6xl">{data.displayName}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-violet-300">
                {data.founderStamp}
              </span>
              <span className="border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/55">
                Level {data.level}
              </span>
            </div>

            <ShareStatStrip
              stats={[
                { label: "Ventures", value: String(data.totalStartups), icon: <Zap className="h-4 w-4" />, tone: "cyan" },
                { label: "Completed", value: String(data.completedStartups), icon: <Trophy className="h-4 w-4" />, tone: "emerald" },
                { label: "Dead", value: String(data.deadStartups), icon: <Flame className="h-4 w-4" />, tone: "rose" },
                { label: "Best Score", value: data.bestScore.toLocaleString(), icon: <Crown className="h-4 w-4" />, tone: "amber" },
                { label: "Best Value", value: formatShareMoney(data.bestValuation), icon: <DollarSign className="h-4 w-4" />, tone: "emerald" },
                { label: "Badges", value: String(data.achievementCount), icon: <Award className="h-4 w-4" />, tone: "violet" },
              ]}
            />

            <section className="mt-6 space-y-3">
              <PanelHeader title="Public Run Archive" subtitle="Completed and dead startups this founder made public" />
              {data.startups.length > 0 ? (
                <div className="space-y-2">
                  {data.startups.map((startup) => {
                    const SectorIcon = getSectorIcon(startup.sector);
                    return (
                      <Link
                        key={`${startup.name}-${startup.publicSlug ?? startup.status}`}
                        href={startup.publicSlug ? `/s/${startup.publicSlug}` : "#"}
                        className={cn("block border p-4 transition-colors hover:bg-white/[0.06] hud-corner", TONE_CLASS[startup.outcomeStamp.tone])}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-black uppercase tracking-wider text-white">{startup.name}</p>
                              <span className="border border-current/25 bg-black/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">{startup.outcomeStamp.label}</span>
                            </div>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/42">
                              <SectorIcon className="h-3 w-3" size={12} />
                              {startup.sector} - Week {startup.weeksSurvived}/12
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-right md:w-60">
                            <MiniMetric label="Score" value={String(startup.finalScore)} />
                            <MiniMetric label="Value" value={formatShareMoney(startup.valuation)} />
                            <MiniMetric label="Revenue" value={formatShareMoney(startup.revenue)} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45 hud-corner">
                  No public completed runs yet.
                </div>
              )}
            </section>
          </section>

          <aside className="space-y-4">
            <ShareCallToActionPanel pageUrl={pageUrl} shareText={data.shareText} />
            <section className="border border-amber-500/20 bg-amber-500/[0.045] p-5 text-amber-300 hud-corner">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Badge Highlights</p>
              <div className="mt-4 space-y-2">
                {data.achievements.slice(0, 4).map((achievement) => (
                  <div key={achievement.key} className="border border-white/10 bg-black/20 p-3">
                    <p className="text-xs font-black uppercase tracking-wider text-white">{achievement.icon ?? "Award"} {achievement.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/45">{achievement.description}</p>
                  </div>
                ))}
                {data.achievements.length === 0 && <p className="text-sm text-white/45">No public achievements yet.</p>}
              </div>
            </section>
            {data.leaderboardEntries.length > 0 && (
              <section className="border border-cyan-500/20 bg-cyan-500/[0.045] p-5 text-cyan-300 hud-corner">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Top Arena Scores</p>
                <div className="mt-4 space-y-2">
                  {data.leaderboardEntries.slice(0, 4).map((entry, index) => (
                    <div key={`${entry.startupName}-${index}`} className="flex items-center gap-3 border border-white/10 bg-black/20 p-3">
                      <span className="text-xs font-black text-white/45">#{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black uppercase tracking-wider text-white">{entry.startupName}</p>
                        <p className="text-[10px] text-white/35">{entry.category} - {entry.season}</p>
                      </div>
                      <span className="text-xs font-black text-white">{entry.score.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <ShareSafetyNotice />
          </aside>
        </div>
      </main>
    </div>
  );
}

function ShareOutcomeStamp({ label, verdict, tone }: { label: string; verdict: string; tone: PublicShareTone }) {
  return (
    <div className={cn("inline-flex max-w-full flex-col border px-5 py-4 hud-corner", TONE_CLASS[tone])}>
      <span className="text-[10px] font-black uppercase tracking-[0.36em] opacity-70">Demo Day Verdict</span>
      <span className="mt-1 break-words text-3xl font-black uppercase tracking-normal text-white sm:text-4xl md:text-6xl">{label}</span>
      <span className="mt-1 text-xs font-black uppercase tracking-wider opacity-75">{verdict}</span>
    </div>
  );
}

function ShareStatStrip({
  stats,
}: {
  stats: Array<{ label: string; value: string; icon: ReactNode; tone: PublicShareTone }>;
}) {
  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article key={stat.label} className={cn("border p-4 hud-corner", TONE_CLASS[stat.tone])}>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider opacity-70">
            {stat.icon}
            {stat.label}
          </div>
          <p className="mt-2 text-2xl font-black text-white tabular-nums">{stat.value}</p>
        </article>
      ))}
    </section>
  );
}

function ShareCallToActionPanel({ pageUrl, shareText }: { pageUrl: string; shareText: string }) {
  return (
    <section className="border border-cyan-500/20 bg-cyan-500/[0.045] p-5 text-cyan-300 hud-corner">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Share This Result</p>
      <p className="mt-3 border border-white/10 bg-black/25 p-3 text-xs leading-relaxed text-white/60">{shareText}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <CopyLinkButton url={pageUrl} label="Copy Result Link" />
        <Link href="/startup/new" className="inline-flex items-center gap-2 border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20">
          Start Your Own Run
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link href="/leaderboard" className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black uppercase tracking-wider text-white/50 hover:bg-white/10">
          Arena Leaderboard
        </Link>
      </div>
    </section>
  );
}

function ShareSafetyNotice() {
  return (
    <section className="border border-white/10 bg-white/[0.03] p-4 text-white/45 hud-corner">
      <div className="flex items-start gap-3">
        <Copy className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
        <p className="text-xs leading-relaxed">
          Public share view hides private pitch, AI review, admin, referral, ad, and account details.
        </p>
      </div>
    </section>
  );
}

function ResultIntelCard({
  title,
  icon,
  tone,
  children,
}: {
  title: string;
  icon: ReactNode;
  tone: PublicShareTone;
  children: ReactNode;
}) {
  return (
    <section className={cn("border p-4 hud-corner", TONE_CLASS[tone])}>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-xs font-black uppercase tracking-[0.22em] text-white">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function IntelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border border-white/10 bg-black/20 px-3 py-2">
      <span className="text-[9px] font-black uppercase tracking-wider text-white/35">{label}</span>
      <span className="max-w-[70%] text-right text-xs text-white/65">{value}</span>
    </div>
  );
}

function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white">{title}</h2>
      <p className="mt-1 text-xs text-white/38">{subtitle}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/20 px-2 py-1.5">
      <p className="text-[8px] font-black uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-0.5 truncate text-[11px] font-black uppercase tracking-wider text-white">{value}</p>
    </div>
  );
}
