import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Award, BarChart3, Crown, Map, Radar, Skull, Swords, Trophy, Zap } from "lucide-react";
import type { CareerPageData } from "@/lib/actions/career";
import {
  getBadgeWallPresentation,
  getCareerEmptyStatePresentation,
  getCareerStatCards,
  getFounderLegacyHero,
  getNextChallengePresentation,
  getPlaystyleMasteryPresentation,
  getRivalLegacyPresentation,
  getRunArchivePresentation,
  getSectorMasteryPresentation,
  type CareerTone,
} from "@/lib/game/career-scene";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<CareerTone, string> = {
  cyan: "border-cyan-500/25 bg-cyan-500/[0.055] text-cyan-300",
  violet: "border-violet-500/25 bg-violet-500/[0.055] text-violet-300",
  rose: "border-rose-500/30 bg-rose-500/[0.065] text-rose-300",
  amber: "border-amber-500/30 bg-amber-500/[0.07] text-amber-300",
  emerald: "border-emerald-500/25 bg-emerald-500/[0.055] text-emerald-300",
  white: "border-white/10 bg-white/[0.035] text-white/55",
};

const RARITY_CLASS = {
  common: "border-white/15 bg-white/[0.035] text-white/60",
  rare: "border-violet-500/30 bg-violet-500/[0.06] text-violet-300",
  legendary: "border-amber-500/35 bg-amber-500/[0.08] text-amber-300",
};

export function FounderLegacyScene({ data }: { data: CareerPageData }) {
  const hero = getFounderLegacyHero(data);
  const stats = getCareerStatCards(data);
  const badges = getBadgeWallPresentation(data.legacyBadges);
  const unlockedBadges = badges.filter((badge) => badge.unlocked);
  const lockedBadges = badges.filter((badge) => !badge.unlocked);
  const runs = getRunArchivePresentation(data.recentRuns);
  const playstyles = getPlaystyleMasteryPresentation(data.playstyleStats);
  const sectors = getSectorMasteryPresentation(data.sectorStats);
  const rival = getRivalLegacyPresentation(data.rivalStats);
  const nextChallenge = getNextChallengePresentation(data.nextChallenge);
  const emptyState = getCareerEmptyStatePresentation();
  const hasLegacy = data.totalStartups > 0 || runs.length > 0 || unlockedBadges.length > 0;

  return (
    <div className="space-y-6">
      <LegacyHeroCard hero={hero} publicSlug={data.publicSlug} />

      {!hasLegacy && <CareerEmptyState state={emptyState} />}

      <CareerRecordBoard stats={stats} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <RunArchiveTimeline runs={runs} bestRunId={data.bestRun?.startupId ?? null} />
        <div className="space-y-5">
          <RivalLegacyPanel rival={rival} />
          <NextChallengeConsole challenge={nextChallenge} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <MasteryPanel
          title="Playstyle Mastery"
          subtitle="The founder patterns your runs keep proving"
          icon={<Zap className="h-4 w-4" />}
          entries={playstyles}
          emptyCopy="No playstyle pattern detected yet. Sprint decisions, hires, social actions, and boardroom responses will reveal your founder archetype."
        />
        <MasteryPanel
          title="Sector Mastery"
          subtitle="Where your career has found signal"
          icon={<Map className="h-4 w-4" />}
          entries={sectors}
          emptyCopy="No sector mastery yet. Deploy and finish a run to compare markets."
        />
      </div>

      <LegacyBadgeWall unlocked={unlockedBadges} locked={lockedBadges} />
    </div>
  );
}

function LegacyHeroCard({
  hero,
  publicSlug,
}: {
  hero: ReturnType<typeof getFounderLegacyHero>;
  publicSlug: string | null;
}) {
  return (
    <section className={cn("relative overflow-hidden border p-5 hud-corner md:p-6", TONE_CLASS[hero.tone])}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-55" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-current/25 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.26em]">
              {hero.identityStamp}
            </span>
            <span className="border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/55">
              Founder Rank: {hero.rankLabel}
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-black uppercase tracking-tight text-white md:text-5xl">{hero.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
            This archive records every run that shaped your founder identity: exits, shutdowns, rivals, playstyles, and earned badges.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <LegacyLink href="/startup/new" label="Start New Run" tone="cyan" />
            <LegacyLink href="/leaderboard" label="View Leaderboard" tone="amber" />
            {publicSlug && <LegacyLink href={`/founder/${publicSlug}`} label="Public Legacy" tone="white" />}
          </div>
        </div>
        <div className="border border-white/10 bg-black/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-white/35">Reputation Signal</p>
              <p className="mt-1 text-4xl font-black text-white tabular-nums">{hero.reputationScore}</p>
            </div>
            <Crown className="h-10 w-10 text-current" />
          </div>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-white/35">
              <span>Level {hero.level}</span>
              <span>{hero.xp} / {hero.xpForNextLevel} XP</span>
            </div>
            <div className="h-2 border border-white/10 bg-black/40">
              <div className="h-full bg-current" style={{ width: `${hero.xpProgress}%` }} />
            </div>
          </div>
          {hero.nextRankLabel && (
            <p className="mt-4 text-xs leading-relaxed text-white/45">
              <span className="font-black uppercase tracking-wider text-current">Next Rank:</span>{" "}
              {hero.nextRankLabel} - {hero.nextRankRequirement}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function CareerRecordBoard({ stats }: { stats: ReturnType<typeof getCareerStatCards> }) {
  return (
    <section className="space-y-3">
      <PanelHeader icon={<BarChart3 className="h-4 w-4" />} title="Career Record Board" subtitle="Lifetime run record, framed as founder legacy" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className={cn("border p-4 hud-corner", TONE_CLASS[stat.tone])}>
            <p className="text-[9px] font-black uppercase tracking-wider opacity-70">{stat.label}</p>
            <p className="mt-1 text-2xl font-black text-white tabular-nums">{stat.value}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-white/42">{stat.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function LegacyBadgeWall({
  unlocked,
  locked,
}: {
  unlocked: ReturnType<typeof getBadgeWallPresentation>;
  locked: ReturnType<typeof getBadgeWallPresentation>;
}) {
  return (
    <section className="space-y-3">
      <PanelHeader icon={<Award className="h-4 w-4" />} title="Legacy Badge Wall" subtitle={`${unlocked.length} unlocked / ${unlocked.length + locked.length} total trophies`} />
      {unlocked.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {unlocked.map((badge) => (
            <article key={badge.id} className={cn("border p-4 hud-corner", RARITY_CLASS[badge.rarity])}>
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center border border-current/25 bg-black/25 text-lg">{badge.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-wider text-white">{badge.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/48">{badge.description}</p>
                  <p className="mt-2 text-[9px] font-black uppercase tracking-wider opacity-65">
                    {badge.rarity} - unlocked {badge.unlockedAt ? new Date(badge.unlockedAt).toLocaleDateString() : "earned"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {locked.length > 0 && (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {locked.map((badge) => (
            <article key={badge.id} className="border border-white/10 bg-white/[0.025] p-3 text-white/35 hud-corner">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center border border-white/10 bg-black/25 text-sm opacity-50">{badge.icon}</span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-white/55">{badge.title}</p>
                  <p className="text-[9px] font-black uppercase tracking-wider text-white/24">{badge.rarity}</p>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-white/32">{badge.requirement}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function RunArchiveTimeline({
  runs,
  bestRunId,
}: {
  runs: ReturnType<typeof getRunArchivePresentation>;
  bestRunId: string | null;
}) {
  return (
    <section className="space-y-3">
      <PanelHeader icon={<Trophy className="h-4 w-4" />} title="Run Archive" subtitle="Completed, dead, and legendary startups in your founder timeline" />
      {runs.length === 0 ? (
        <div className="border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-white/45 hud-corner">
          No archived runs yet.
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <Link key={run.startupId} href={`/startup/${run.startupId}`} className={cn("block border p-4 transition-colors hover:bg-white/[0.06] hud-corner", TONE_CLASS[run.tone])}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black uppercase tracking-wider text-white">{run.startupName}</p>
                    <span className="border border-current/25 bg-black/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">{run.stamp}</span>
                    {bestRunId === run.startupId && <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">Best Run</span>}
                  </div>
                  <p className="mt-1 text-xs text-white/42">
                    {run.sector} - Week {run.weeksSurvived}/12{run.playstyleLabel ? ` - ${run.playstyleLabel}` : ""}
                  </p>
                  {run.rivalSummary && <p className="mt-1 text-[10px] text-white/32">{run.rivalSummary}</p>}
                </div>
                <div className="grid grid-cols-3 gap-3 text-right md:w-64">
                  <MiniMetric label="Score" value={String(run.score)} />
                  <MiniMetric label="Value" value={run.valuation} />
                  <MiniMetric label="Revenue" value={run.revenue} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function MasteryPanel({
  title,
  subtitle,
  icon,
  entries,
  emptyCopy,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  entries: ReturnType<typeof getPlaystyleMasteryPresentation>;
  emptyCopy: string;
}) {
  return (
    <section className="space-y-3">
      <PanelHeader icon={icon} title={title} subtitle={subtitle} />
      {entries.length === 0 ? (
        <div className="border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45 hud-corner">{emptyCopy}</div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <article key={entry.id} className={cn("border p-3 hud-corner", TONE_CLASS[entry.tone])}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-wider text-white">{entry.label}</p>
                  <p className="mt-1 text-xs text-white/45">{entry.detail}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black tabular-nums text-white">{entry.bestScore}</p>
                  <p className="text-[8px] font-black uppercase tracking-wider opacity-60">{entry.status}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function RivalLegacyPanel({ rival }: { rival: ReturnType<typeof getRivalLegacyPresentation> }) {
  return (
    <section className={cn("border p-5 hud-corner", TONE_CLASS[rival.tone])}>
      <PanelHeader icon={<Swords className="h-4 w-4" />} title="Rival Record" subtitle="Nemesis pressure across your founder career" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniMetric label="Faced" value={String(rival.rivalsFaced)} />
        <MiniMetric label="Defeated" value={String(rival.rivalsDefeated)} />
        <MiniMetric label="Losses" value={String(rival.rivalLosses)} />
        <MiniMetric label="Win Rate" value={`${rival.winRate}%`} />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-white/52">{rival.summary}</p>
      {(rival.mostDangerousRivalName || rival.lastNemesisName) && (
        <div className="mt-4 border border-white/10 bg-black/20 p-3 text-xs text-white/45">
          {rival.mostDangerousRivalName && <p><span className="font-black uppercase tracking-wider text-current">Most Dangerous:</span> {rival.mostDangerousRivalName}</p>}
          {rival.lastNemesisName && <p><span className="font-black uppercase tracking-wider text-current">Last Nemesis:</span> {rival.lastNemesisName}</p>}
        </div>
      )}
    </section>
  );
}

function NextChallengeConsole({ challenge }: { challenge: ReturnType<typeof getNextChallengePresentation> }) {
  return (
    <section className="border border-cyan-500/20 bg-cyan-500/[0.045] p-5 text-cyan-300 hud-corner">
      <PanelHeader icon={<Radar className="h-4 w-4" />} title={challenge.title} subtitle="Give the next run a purpose" />
      <p className="mt-4 text-sm leading-relaxed text-white/65">{challenge.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {challenge.ctas.map((cta) => (
          <LegacyLink key={cta.href} href={cta.href} label={cta.label} tone={cta.tone} />
        ))}
      </div>
    </section>
  );
}

function CareerEmptyState({ state }: { state: ReturnType<typeof getCareerEmptyStatePresentation> }) {
  return (
    <section className="border border-amber-500/25 bg-amber-500/[0.055] p-6 text-amber-300 hud-corner">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center border border-current/25 bg-black/20">
          <Skull className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-black uppercase tracking-wider text-white">{state.title}</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{state.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {state.ctas.map((cta) => (
              <LegacyLink key={cta.href} href={cta.href} label={cta.label} tone={cta.tone} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LegacyLink({ href, label, tone }: { href: string; label: string; tone: CareerTone }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 border px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors hover:bg-white/10", TONE_CLASS[tone])}>
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function PanelHeader({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-white">
          <span className="text-cyan-300">{icon}</span>
          {title}
        </h2>
        <p className="mt-1 text-xs text-white/38">{subtitle}</p>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/25 to-transparent md:max-w-xs" />
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[8px] font-black uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-0.5 truncate text-sm font-black uppercase tracking-wider text-white">{value}</p>
    </div>
  );
}
