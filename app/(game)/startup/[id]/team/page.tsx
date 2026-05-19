import Link from "next/link";
import { notFound } from "next/navigation";
import { getStartupById } from "@/lib/actions/startup";
import { getTeamState } from "@/lib/actions/team";
import { getNextBestActionForStartup } from "@/lib/onboarding/progress";
import { ArrowLeft, Lock, Skull } from "lucide-react";
import { GameScene } from "@/components/game/GameScene";
import { GameHudBar } from "@/components/game/GameHudBar";
import { TeamCommand } from "@/components/game/TeamCommand";
import { NextBestActionInline } from "@/components/onboarding/NextBestAction";
import { getNextObjective, getStartupRunStep } from "@/lib/game/objectives";
import { formatMoney } from "@/lib/game/team-scene";

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
  const objective = getNextObjective(startup);
  const currentStep = getStartupRunStep(startup);

  // If not funded, show locked state
  if (startup.status !== "funded" && startup.status !== "active" && startup.status !== "dead" && startup.status !== "completed") {
    return (
      <GameScene
        eyebrow="Team Command"
        title="Founder Squad Locked"
        subtitle="Hiring unlocks after funding. Secure capital before assembling the squad."
        accent="rose"
        actions={
          <Link href={`/startup/${id}`} className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black uppercase tracking-wider text-white/45 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" />
            Startup Dossier
          </Link>
        }
      >
        <GameHudBar
          startupId={id}
          startupName={startup.name}
          currentStep={currentStep}
          cash={startup.cash}
          monthlyBurn={startup.monthlyBurn}
          objective={objective}
        />
        <section className="border border-rose-500/25 bg-rose-500/[0.055] p-5 text-rose-300 hud-corner">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center border border-rose-500/25 bg-rose-500/10">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Command Locked</p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-white">No capital, no squad draft.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/58">
                The team system remains locked until this startup closes funding. Review the VC verdict and term sheet before recruiting.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={`/startup/${id}/review`} className="border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20">
                  VC Verdict
                </Link>
                <Link href={`/startup/${id}/terms`} className="border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-300 hover:bg-amber-500/20">
                  Review Terms
                </Link>
              </div>
            </div>
          </div>
        </section>
      </GameScene>
    );
  }

  const employeesForClient = startup.employees.map((employee) => ({
    ...employee,
    productivity: Number(employee.productivity),
  }));
  const firedEmployees = employeesForClient.filter((e) => e.status === "fired");

  return (
    <GameScene
      eyebrow="Team Command"
      title="Founder Squad Draft"
      subtitle="Recruit operators, protect runway, and choose the base setup before the next sprint."
      accent="violet"
      actions={
        <Link href={`/startup/${id}`} className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black uppercase tracking-wider text-white/45 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" />
          Startup Dossier
        </Link>
      }
    >
      <GameHudBar
        startupId={id}
        startupName={startup.name}
        currentStep={currentStep}
        cash={startup.cash}
        monthlyBurn={startup.monthlyBurn}
        objective={objective}
      />
      {nextAction && (
        <div>
          <NextBestActionInline action={nextAction} />
        </div>
      )}

      {teamState.resignRisk && (
        <section className="border border-rose-500/25 bg-rose-500/[0.055] p-4 text-rose-300 hud-corner">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center border border-rose-500/25 bg-rose-500/10">
              <Skull className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Resignation Risk</h3>
              <p className="mt-1 text-sm text-rose-200/80">
                <strong>{teamState.resignRisk.name}</strong> ({teamState.resignRisk.role}) is at risk of resigning
                due to low morale ({teamState.resignRisk.morale}%). Consider improving conditions.
              </p>
            </div>
          </div>
        </section>
      )}

      {(startup.status === "funded" || startup.status === "active") && (
        <TeamCommand
          startupId={id}
          startupStatus={startup.status}
          cash={startup.cash}
          monthlyBurn={startup.monthlyBurn}
          employees={employeesForClient}
          candidates={teamState.candidates}
          capacity={teamState.capacity}
          currentOffice={startup.workSetup}
          payroll={teamState.payroll}
          productivity={teamState.productivity}
          morale={teamState.morale}
        />
      )}

      {firedEmployees.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white">Archived Squad Members</h2>
            <p className="mt-1 text-xs text-white/38">{firedEmployees.length} past recruit(s)</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {firedEmployees.map((emp) => (
              <article key={emp.id} className="border border-white/10 bg-white/[0.025] p-4 opacity-65 hud-corner">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black uppercase tracking-wider text-white">{emp.name}</div>
                    <div className="text-xs text-white/40">{emp.role}</div>
                  </div>
                  <span className="border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-300">Removed</span>
                </div>
                <p className="text-sm text-white/40">Salary was {formatMoney(emp.salary)}/mo</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </GameScene>
  );
}
