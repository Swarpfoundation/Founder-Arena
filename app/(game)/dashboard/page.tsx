import Link from "next/link";

import { getUserStartups } from "@/lib/actions/startup";
import { getOrCreateFounderProfile } from "@/lib/game/founder-progression";
import { getOnboardingProgress } from "@/lib/onboarding/progress";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-helpers";
import { StatusBadge } from "@/components/game/StatusBadge";
import {
  Plus,
  Crosshair,
  ChevronRight,
  AlertTriangle,
  Trophy,
  Rocket,
} from "lucide-react";

function CountUpDisplay({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  return (
    <span>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}

function StatBlock({ label, value, prefix = "", suffix = "", color = "cyan" }: {
  label: string; value: number; prefix?: string; suffix?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    cyan: "text-cyan-400 border-cyan-400/30",
    violet: "text-violet-400 border-violet-400/30",
    emerald: "text-emerald-400 border-emerald-400/30",
    gold: "text-[#ffcc00] border-[#ffcc00]/30",
    rose: "text-rose-400 border-rose-400/30",
  };
  const c = colors[color] ?? colors.cyan;
  const textColor = c.split(" ")[0];

  return (
    <div
      className={`relative p-4 border ${c} bg-black/40 backdrop-blur-sm`}
     
     
     
    >
      <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-current opacity-50" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-current opacity-50" />
      <p className="text-[10px] tracking-[0.2em] text-white/40 mb-1 uppercase">{label}</p>
      <p className={`text-2xl font-black tracking-tight ${textColor}`} style={{ textShadow: `0 0 20px currentColor` }}>
        <CountUpDisplay value={value} prefix={prefix} suffix={suffix} />
      </p>
    </div>
  );
}

function TacticalCard({ startup }: { startup: Awaited<ReturnType<typeof getUserStartups>>[0] }) {
  const colorMap: Record<string, { border: string; glow: string; text: string; bg: string }> = {
    cyan: { border: "border-cyan-400/30", glow: "glow-cyan", text: "text-cyan-400", bg: "bg-cyan-400/10" },
    violet: { border: "border-violet-400/30", glow: "glow-violet", text: "text-violet-400", bg: "bg-violet-400/10" },
    emerald: { border: "border-emerald-400/30", glow: "glow-emerald", text: "text-emerald-400", bg: "bg-emerald-400/10" },
    rose: { border: "border-rose-400/30", glow: "glow-rose", text: "text-rose-400", bg: "bg-rose-400/10" },
  };

  const statusColor =
    startup.status === "dead" ? "rose" :
    startup.status === "completed" ? "emerald" :
    startup.status === "funded" || startup.status === "active" ? "cyan" :
    "violet";

  const c = colorMap[statusColor];
  const simMonths = startup.simulationMonths.length;
  const isOperating = startup.status === "funded" || startup.status === "active";
  const isComplete = startup.status === "completed" || startup.status === "dead";
  const runway = startup.monthlyBurn > 0 ? Math.round(startup.cash / startup.monthlyBurn) : 99;

  return (
    <div
     
     
     
    >
      <Link
        href={isComplete && startup.publicSlug ? `/s/${startup.publicSlug}` : `/startup/${startup.id}`}
        className="block"
      >
        <div
          className={`relative p-5 border ${c.border} bg-black/60 backdrop-blur-sm cursor-pointer group overflow-hidden`}
         
         
        >
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-current opacity-40" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-current opacity-40" />
          <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"
             
             
            />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`text-lg font-black tracking-wider ${c.text}`} style={{ textShadow: `0 0 15px currentColor` }}>
                  {startup.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 border ${c.border} ${c.text} tracking-wider uppercase`}>
                    {startup.stage}
                  </span>
                  <StatusBadge status={startup.status} />
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 ${c.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className={`p-2 ${c.bg} border ${c.border}`}>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">VALUATION</p>
                <p className={`font-bold ${c.text}`}>${(startup.valuation / 1000000).toFixed(1)}M</p>
              </div>
              <div className={`p-2 ${c.bg} border ${c.border}`}>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">RUNWAY</p>
                <p className={`font-bold ${runway < 6 ? "text-rose-400" : c.text}`}>{runway} MO</p>
              </div>
              <div className={`p-2 ${c.bg} border ${c.border}`}>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">REVENUE</p>
                <p className="text-white font-bold">${(startup.revenue / 1000).toFixed(0)}K/MO</p>
              </div>
              <div className={`p-2 ${c.bg} border ${c.border}`}>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">PROGRESS</p>
                <p className={`font-bold ${startup.productProgress < 30 ? "text-amber-400" : "text-emerald-400"}`}>{startup.productProgress}%</p>
              </div>
            </div>
            {isOperating && (
              <div className="text-[10px] text-white/40">
                Month {simMonths} of 12 • {startup.employees.filter(e => e.status === "active").length} team members
              </div>
            )}
            {isComplete && (
              <div className="text-[10px] text-white/40">
                Simulation complete • Score: {startup.finalScore ?? "—"}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const [profile, startups, onboardingProgress] = await Promise.all([
    getOrCreateFounderProfile(user.id),
    getUserStartups(),
    getOnboardingProgress(user.id),
  ]);

  const [bestEntry] = await Promise.all([
    db.leaderboardEntry.findFirst({
      where: { userId: user.id },
      orderBy: { score: "desc" },
      include: { startup: true },
    }),
  ]);

  const xpForNext = profile.level < 10 ? profile.level * 100 + (profile.level - 1) * 50 : 99999;
  const xpProgress = Math.min(100, Math.round((profile.xp / xpForNext) * 100));

  const activeUnits = startups.filter(s => s.status === "active" || s.status === "funded").length;
  const totalValue = startups.reduce((sum, s) => sum + s.valuation, 0);
  const totalRevenue = startups.reduce((sum, s) => sum + s.revenue, 0);

  // Derive action cards from real state
  const urgentStartups = startups.filter(s => {
    if (s.status !== "active" && s.status !== "funded") return false;
    const runway = s.monthlyBurn > 0 ? s.cash / s.monthlyBurn : 99;
    return runway < 6;
  });

  const actionCards = [];
  if (urgentStartups.length > 0) {
    actionCards.push({
      icon: AlertTriangle,
      label: "URGENT",
      desc: `${urgentStartups[0].name}: Runway critical`,
      color: "rose" as const,
      pulse: true,
      href: `/startup/${urgentStartups[0].id}/operate`,
    });
  }
  if (onboardingProgress.nextAction) {
    actionCards.push({
      icon: Crosshair,
      label: "MISSION",
      desc: onboardingProgress.nextAction.label,
      color: "cyan" as const,
      pulse: false,
      href: onboardingProgress.nextAction.href,
    });
  }
  if (bestEntry) {
    actionCards.push({
      icon: Trophy,
      label: "BEST RUN",
      desc: `${bestEntry.startup.name}: ${bestEntry.score.toLocaleString()} pts`,
      color: "amber" as const,
      pulse: false,
      href: bestEntry.startup.publicSlug ? `/s/${bestEntry.startup.publicSlug}` : `/startup/${bestEntry.startupId}`,
    });
  }

  return (
    <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 md:px-8 space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] tracking-[0.4em] text-cyan-400/40 mb-2 uppercase">COMMAND CENTER</p>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight" style={{ textShadow: "0 0 40px rgba(0,240,255,0.2)" }}>
            OPERATIVE
          </h1>
        </div>
        <Link href="/startup/new">
          <div
            className="relative p-4 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all cursor-pointer"
           
           
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400" />
            <Plus className="w-5 h-5 text-cyan-400" />
          </div>
        </Link>
      </div>

      {/* Stat Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock label="ACTIVE UNITS" value={activeUnits} color="cyan" />
        <StatBlock label="TOTAL VALUE" value={Math.round(totalValue / 1000000 * 10) / 10} prefix="$" suffix="M" color="violet" />
        <StatBlock label="REVENUE" value={Math.round(totalRevenue / 1000)} prefix="$" suffix="K" color="emerald" />
        <StatBlock label="OPERATIVE LVL" value={profile.level} color="gold" />
      </div>

      {/* XP Progress */}
      <div
        className="relative p-4 border border-violet-400/20 bg-black/40"
       
       
       
      >
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-violet-400/30" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-violet-400/30" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <span className="text-lg font-black text-white">{profile.level}</span>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-violet-400/60 tracking-wider uppercase">XP PROGRESS</span>
              <span className="text-violet-400">{profile.xp.toLocaleString()} / {xpForNext.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-white/5 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-fuchsia-400"
                style={{ width: `${xpProgress}%` }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-r from-transparent to-white/40" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Your Units */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Crosshair className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold tracking-wider text-white">YOUR UNITS</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-cyan-400/30 to-transparent" />
        </div>
        {startups.length === 0 ? (
          <div className="relative p-8 text-center border border-cyan-400/20 bg-black/40">
            <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/40" />
            <Rocket className="w-10 h-10 text-cyan-400/60 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2 text-white">No units deployed</h3>
            <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">
              You haven&apos;t deployed any startups. Initialize your first venture and pitch to AI investors.
            </p>
            <Link href="/startup/new">
              <div className="relative inline-flex items-center gap-2 px-6 py-3 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all cursor-pointer">
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400" />
                <Plus className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 font-bold text-xs tracking-wider uppercase">DEPLOY UNIT</span>
              </div>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {startups.map((s) => (
              <TacticalCard key={s.id} startup={s} />
            ))}
          </div>
        )}
      </div>

      {/* Action Cards */}
      {actionCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {actionCards.map((action) => (
            <div
              key={action.label}
            >
              <Link href={action.href}>
                <div className={`relative p-4 border bg-black/40 cursor-pointer group ${
                  action.color === "rose" ? "border-rose-400/30 hover:border-rose-400/60" :
                  action.color === "amber" ? "border-amber-400/30 hover:border-amber-400/60" :
                  "border-cyan-400/30 hover:border-cyan-400/60"
                }`}>
                  <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-current opacity-30" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-current opacity-30" />
                  {action.pulse && <div className="absolute inset-0 border-2 border-rose-400/20 animate-pulse" />}
                  <div className="flex items-center gap-3">
                    <action.icon className={`w-5 h-5 ${
                      action.color === "rose" ? "text-rose-400" :
                      action.color === "amber" ? "text-amber-400" :
                      "text-cyan-400"
                    } ${action.pulse ? "animate-pulse" : ""}`} />
                    <div className="flex-1">
                      <p className="text-xs font-bold tracking-wider text-white">{action.label}</p>
                      <p className="text-[10px] text-white/40">{action.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 ml-auto transition-colors" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
