import Link from "next/link";
import { notFound } from "next/navigation";
import { getStartupById } from "@/lib/actions/startup";
import { getTeamState } from "@/lib/actions/team";
import { getNextBestActionForStartup } from "@/lib/onboarding/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeamClient } from "./team-client";
import { GameCard } from "@/components/game/GameCard";
import { SectionHeader } from "@/components/game/SectionHeader";
import { NextBestActionInline } from "@/components/onboarding/NextBestAction";

function getDeterministicMorale(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return 80 + (Math.abs(hash) % 16);
}

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let startup;
  try {
    startup = await getStartupById(id);
  } catch {
    notFound();
  }

  const teamState = await getTeamState(id);
  const nextAction = getNextBestActionForStartup(startup);

  // If not funded, show locked state
  if (startup.status !== "funded" && startup.status !== "active" && startup.status !== "dead" && startup.status !== "completed") {
    return (
      <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 md:px-8">
        <div className="mb-6">
          <Link href={`/startup/${id}`} className="text-sm text-white/40 hover:text-white">
            ← Back to Startup
          </Link>
        </div>
        <GameCard>
          <div className="mb-4">
            <h2 className="text-xl font-bold">Team Management Locked</h2>
            <p className="text-white/40 text-sm mt-1">
              You need to complete funding before you can build your team.
            </p>
          </div>
          <Link href={`/startup/${id}/terms`}>
            <Button>Review Term Sheet</Button>
          </Link>
        </GameCard>
      </div>
    );
  }

  const activeEmployees = startup.employees.filter((e) => e.status === "active");
  const firedEmployees = startup.employees.filter((e) => e.status === "fired");

  const avgMorale = activeEmployees.length > 0
    ? Math.round(activeEmployees.reduce((sum, e) => sum + getDeterministicMorale(e.id), 0) / activeEmployees.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 md:px-8">
      <div className="mb-6">
        <Link href={`/startup/${id}`} className="text-sm text-white/40 hover:text-white">
          ← Back to Startup
        </Link>
      </div>

      {/* v2 Header */}
      <div className="mb-6">
        <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase mb-1">Crew Manifest</p>
        <h1 className="text-2xl font-black text-white tracking-tight">Team</h1>
      </div>

      {nextAction && (
        <div className="mb-8">
          <NextBestActionInline action={nextAction} />
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <GameCard className="p-3 text-center hud-corner" variant="default">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Size</p>
          <p className="text-xl font-black text-white">{activeEmployees.length}</p>
        </GameCard>
        <GameCard className="p-3 text-center hud-corner" variant="default">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Morale</p>
          <p className={`text-xl font-black ${avgMorale > 80 ? "text-emerald-400" : avgMorale > 60 ? "text-amber-400" : "text-rose-400"}`}>
            {avgMorale}%
          </p>
        </GameCard>
        <GameCard className="p-3 text-center hud-corner" variant="default">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Payroll</p>
          <p className="text-xl font-black text-violet-400">${teamState.payroll.toLocaleString()}</p>
        </GameCard>
      </div>

      {/* Current Office */}
      <GameCard className="mb-8">
        <SectionHeader title="Office Setup" subtitle="Current workspace arrangement" className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <GameCard glow="cyan" variant="solid" className="p-4">
            <div className="font-semibold text-white">{teamState.officeSetup.label}</div>
            <div className="text-sm text-white/40 mt-1">${teamState.officeSetup.monthlyCost.toLocaleString()}/mo</div>
            <div className="text-xs text-white/40 mt-2">{teamState.officeSetup.description}</div>
          </GameCard>
        </div>
      </GameCard>

      {/* Resignation Warning */}
      {teamState.resignRisk && (
        <GameCard glow="rose" className="mb-8">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-300">Resignation Risk</h3>
              <p className="text-sm text-rose-200/80 mt-1">
                <strong>{teamState.resignRisk.name}</strong> ({teamState.resignRisk.role}) is at risk of resigning
                due to low morale ({teamState.resignRisk.morale}%). Consider improving conditions.
              </p>
            </div>
          </div>
        </GameCard>
      )}

      {/* Interactive Team Management */}
      {(startup.status === "funded" || startup.status === "active") && (
        <TeamClient
          startupId={id}
          employees={startup.employees}
          candidates={teamState.candidates}
          capacity={teamState.capacity}
          currentOffice={startup.workSetup}
        />
      )}

      {/* Fired Employees */}
      {firedEmployees.length > 0 && (
        <div className="mt-8">
          <SectionHeader title="Former Employees" subtitle={`${firedEmployees.length} past team member(s)`} accent="violet" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {firedEmployees.map((emp) => (
              <GameCard key={emp.id} className="opacity-60">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-white">{emp.name}</div>
                    <div className="text-sm text-white/40">{emp.role}</div>
                  </div>
                  <Badge variant="destructive">Fired</Badge>
                </div>
                <p className="text-sm text-white/40">Salary was ${emp.salary.toLocaleString()}/mo</p>
              </GameCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
