import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Crosshair,
  Rocket,
  Trophy,
  Users,
} from "lucide-react";

import { getUserStartups } from "@/lib/actions/startup";
import { captureReferralFromCookie } from "@/lib/actions/referrals";
import { getOrCreateFounderProfile } from "@/lib/game/founder-progression";
import { getOnboardingProgress } from "@/lib/onboarding/progress";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-helpers";
import {
  getDashboardObjective,
  getNextObjective,
  getStartupRunStep,
  pickPrimaryStartup,
} from "@/lib/game/objectives";
import { getDemoDayCountdown, getRunPhaseLabel, getShortRunStepLabel } from "@/lib/game-time/time-scale";
import { GameCard } from "@/components/game/GameCard";
import { GameHudBar } from "@/components/game/GameHudBar";
import { GameScene } from "@/components/game/GameScene";
import { ObjectiveTracker } from "@/components/game/ObjectiveTracker";
import { RunSlotCard } from "@/components/game/RunSlotCard";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  await captureReferralFromCookie();

  const [profile, startups, onboardingProgress] = await Promise.all([
    getOrCreateFounderProfile(user.id),
    getUserStartups(),
    getOnboardingProgress(user.id),
  ]);

  const bestEntry = await db.leaderboardEntry.findFirst({
    where: { userId: user.id },
    orderBy: { score: "desc" },
    include: { startup: true },
  });

  const primaryStartup = pickPrimaryStartup(startups);
  const dashboardObjective = getDashboardObjective(startups);
  const activeRuns = startups.filter((startup) => startup.status === "active" || startup.status === "funded");
  const setupRuns = startups.filter((startup) => startup.status === "draft" || startup.status === "pitching");
  const archivedRuns = startups.filter((startup) => startup.status === "completed" || startup.status === "dead");
  const totalValue = startups.reduce((sum, startup) => sum + startup.valuation, 0);
  const totalRevenue = startups.reduce((sum, startup) => sum + startup.revenue, 0);
  const criticalRunway = activeRuns.filter((startup) => {
    const runway = startup.monthlyBurn > 0 ? startup.cash / startup.monthlyBurn : 99;
    return runway < 6;
  });
  const runStep = primaryStartup ? getStartupRunStep(primaryStartup) : undefined;
  const objective = primaryStartup ? getNextObjective(primaryStartup) : dashboardObjective;
  const activeIncidentCount = criticalRunway.length + (onboardingProgress.nextAction ? 1 : 0);
  const xpForNext = profile.level < 10 ? profile.level * 100 + (profile.level - 1) * 50 : 99999;
  const xpProgress = Math.min(100, Math.round((profile.xp / xpForNext) * 100));

  const sidePanel = (
    <>
      <ObjectiveTracker objective={dashboardObjective} />

      <GameCard glow="violet" className="hud-corner">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-violet-300/60">Founder Signal</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center border border-violet-500/30 bg-violet-500/10 text-2xl font-black text-white">
            {profile.level}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex justify-between gap-3 text-xs">
              <span className="font-black uppercase tracking-wider text-violet-300/70">Operative XP</span>
              <span className="text-violet-200/70">{profile.xp.toLocaleString()} / {xpForNext.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-white/10">
              <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </div>
      </GameCard>

      <GameCard glow={criticalRunway.length > 0 ? "rose" : "cyan"} className="hud-corner">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-300/60">Active Incidents</p>
        <div className="mt-3 space-y-2">
          {criticalRunway.length > 0 ? (
            criticalRunway.slice(0, 3).map((startup) => (
              <Link
                key={startup.id}
                href={`/startup/${startup.id}/operate`}
                className="flex items-center gap-2 border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200/80"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {startup.name}: runway critical
              </Link>
            ))
          ) : (
            <p className="text-sm text-white/45">No critical operation warnings detected.</p>
          )}
          {onboardingProgress.nextAction && (
            <Link
              href={onboardingProgress.nextAction.href}
              className="flex items-center gap-2 border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200/80"
            >
              <Crosshair className="h-3.5 w-3.5" />
              {onboardingProgress.nextAction.label}
            </Link>
          )}
        </div>
      </GameCard>

      <GameCard className="hud-corner">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/35">Quick Gates</p>
        <div className="mt-3 grid gap-2">
          <QuickLink href="/startup/new" icon={<Rocket className="h-4 w-4" />} label="Deploy New Founder" />
          <QuickLink href="/career" icon={<BookOpen className="h-4 w-4" />} label="Founder Career" />
          <QuickLink href="/leaderboard" icon={<Trophy className="h-4 w-4" />} label="Arena Rankings" />
          <QuickLink href="/referrals" icon={<Users className="h-4 w-4" />} label="Referral Command" />
        </div>
      </GameCard>
    </>
  );

  return (
    <GameScene
      eyebrow="Private Beta Command Deck"
      title="Run Select"
      subtitle="Choose an active operation, resume the next Founder Week, or deploy a fresh startup into the arena."
      accent="cyan"
      actions={
        <Link href="/startup/new" className="inline-flex items-center gap-2 border border-cyan-500/35 bg-cyan-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-cyan-300 transition-colors hover:bg-cyan-500/20">
          <Rocket className="h-4 w-4" />
          Deploy New Run
        </Link>
      }
      sidePanel={sidePanel}
    >
      <GameHudBar
        startupId={primaryStartup?.id}
        startupName={primaryStartup?.name}
        currentStep={runStep}
        cash={primaryStartup?.cash}
        monthlyBurn={primaryStartup?.monthlyBurn}
        activeIncidents={activeIncidentCount}
        objective={objective}
      />

      {primaryStartup ? (
        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <RunSlotCard startup={primaryStartup} featured />
          <GameCard glow="amber" className="hud-corner">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-amber-300/65">Command Brief</p>
            <h2 className="mt-2 text-xl font-black uppercase tracking-wider text-white">{objective.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{objective.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <CommandMetric label="Founder Week" value={runStep ? `${getShortRunStepLabel(runStep)} / 12` : "--"} />
              <CommandMetric label="Phase" value={runStep ? getRunPhaseLabel(runStep) : "Standby"} />
              <CommandMetric label="Demo Day" value={runStep ? getDemoDayCountdown(runStep) : "Awaiting Run"} />
              <CommandMetric label="Best Score" value={bestEntry ? bestEntry.score.toLocaleString() : "Unranked"} />
            </div>
            <Link
              href={objective.href}
              className="mt-4 inline-flex items-center gap-2 border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-amber-300 transition-colors hover:bg-amber-500/20"
            >
              {objective.ctaLabel}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </GameCard>
        </section>
      ) : (
        <GameCard glow="cyan" className="hud-corner py-10 text-center">
          <Rocket className="mx-auto mb-4 h-12 w-12 text-cyan-300/70" />
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300/55">Empty Save Deck</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-wider text-white">No runs deployed</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-white/45">
            Start with a venture archetype, pitch the AI committee, and enter the first Founder Week.
          </p>
          <Link href="/startup/new" className="mt-6 inline-flex items-center gap-2 border border-cyan-500/35 bg-cyan-500/10 px-5 py-3 text-xs font-black uppercase tracking-wider text-cyan-300 transition-colors hover:bg-cyan-500/20">
            Deploy Startup
            <ChevronRight className="h-4 w-4" />
          </Link>
        </GameCard>
      )}

      <section>
        <div className="mb-3 flex items-center gap-3">
          <Crosshair className="h-5 w-5 text-cyan-300" />
          <h2 className="text-sm font-black uppercase tracking-[0.24em] text-white">Operation Slots</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/30 to-transparent" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...activeRuns, ...setupRuns, ...archivedRuns].map((startup) => (
            <RunSlotCard key={startup.id} startup={startup} />
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <DeckStat label="Active Runs" value={String(activeRuns.length)} tone="cyan" />
        <DeckStat label="Portfolio Value" value={`$${(totalValue / 1_000_000).toFixed(1)}M`} tone="violet" />
        <DeckStat label="Monthly Revenue" value={`$${(totalRevenue / 1_000).toFixed(0)}K`} tone="emerald" />
      </section>
    </GameScene>
  );
}

function CommandMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[9px] font-black uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-1 truncate text-sm font-black uppercase tracking-wider text-white">{value}</p>
    </div>
  );
}

function DeckStat({ label, value, tone }: { label: string; value: string; tone: "cyan" | "violet" | "emerald" }) {
  const classes = {
    cyan: "border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300",
    violet: "border-violet-500/25 bg-violet-500/[0.06] text-violet-300",
    emerald: "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300",
  }[tone];

  return (
    <div className={cn("border p-4 hud-corner", classes)}>
      <p className="text-[9px] font-black uppercase tracking-[0.28em] opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black uppercase tracking-wider text-white">{value}</p>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black uppercase tracking-wider text-white/52 transition-colors hover:border-cyan-500/30 hover:text-cyan-300"
    >
      {icon}
      {label}
    </Link>
  );
}
