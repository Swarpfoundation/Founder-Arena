"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Briefcase, Check, Crosshair, Radio, Users, X } from "lucide-react";
import type { Employee } from "@prisma/client";
import type { Candidate } from "@/lib/team/types";
import { cn } from "@/lib/utils";
import { fireEmployeeAction, hireEmployeeAction, changeOfficeSetupAction } from "@/lib/actions/team";
import { getOfficeIcon } from "@/lib/assets/office-icon-map";
import { getTeamRoleIcon } from "@/lib/assets/team-icon-map";
import {
  formatMoney,
  getCandidatePrimaryImpact,
  getCandidateRiskLevel,
  getCandidateRunwayImpact,
  getHiringConsoleState,
  getHiringGatePresentation,
  getOfficeOptions,
  getOfficeRunwayImpact,
  getRoleImpactTags,
  getRosterSummary,
  getSeniorityPresentation,
  getTeamCoverage,
  signed,
  type CoverageLevel,
  type TeamTone,
} from "@/lib/game/team-scene";

const TONE_CLASS: Record<TeamTone, string> = {
  cyan: "border-cyan-500/25 bg-cyan-500/[0.055] text-cyan-300",
  violet: "border-violet-500/25 bg-violet-500/[0.055] text-violet-300",
  rose: "border-rose-500/30 bg-rose-500/[0.065] text-rose-300",
  amber: "border-amber-500/25 bg-amber-500/[0.06] text-amber-300",
  emerald: "border-emerald-500/25 bg-emerald-500/[0.055] text-emerald-300",
  white: "border-white/10 bg-white/[0.035] text-white/55",
};

const COVERAGE_CLASS: Record<CoverageLevel, string> = {
  missing: "border-rose-500/25 bg-rose-500/[0.055] text-rose-300",
  partial: "border-amber-500/25 bg-amber-500/[0.055] text-amber-300",
  strong: "border-emerald-500/25 bg-emerald-500/[0.055] text-emerald-300",
};

interface TeamCommandProps {
  startupId: string;
  startupStatus: string;
  cash: number;
  monthlyBurn: number;
  employees: TeamEmployee[];
  candidates: Candidate[];
  capacity: number;
  currentOffice: string;
  payroll: number;
  productivity: number;
  morale: number;
}

type TeamEmployee = Omit<Employee, "productivity"> & {
  productivity: number;
};

export function TeamCommand({
  startupId,
  startupStatus,
  cash,
  monthlyBurn,
  employees,
  candidates,
  capacity,
  currentOffice,
  payroll,
  productivity,
  morale,
}: TeamCommandProps) {
  const router = useRouter();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [fireConfirmId, setFireConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeEmployees = employees.filter((employee) => employee.status === "active");
  const rosterSummary = useMemo(() => getRosterSummary(activeEmployees), [activeEmployees]);
  const coverage = useMemo(() => getTeamCoverage(activeEmployees), [activeEmployees]);
  const selectedGate = getHiringGatePresentation({
    startup: { status: startupStatus, cash, monthlyBurn },
    capacity,
    candidate: selectedCandidate,
  });
  const consoleState = getHiringConsoleState({
    selectedCandidate,
    startup: { status: startupStatus, cash, monthlyBurn },
    capacity,
  });

  async function handleHire(candidate: Candidate) {
    setIsLoading(true);
    setError(null);
    try {
      await hireEmployeeAction(startupId, candidate.id);
      setSelectedCandidate(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to recruit");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFire(employeeId: string) {
    setIsLoading(true);
    setError(null);
    try {
      await fireEmployeeAction(startupId, employeeId);
      setFireConfirmId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove squad member");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOfficeChange(setup: string) {
    setIsLoading(true);
    setError(null);
    try {
      await changeOfficeSetupAction(startupId, setup);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set base");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <section className="border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 hud-corner">
          {error}
        </section>
      )}

      <section className="grid gap-3 md:grid-cols-4">
        <CommandMetric label="Squad Size" value={`${activeEmployees.length}`} tone="cyan" />
        <CommandMetric label="Squad Burn" value={`${formatMoney(payroll)}/mo`} tone="violet" />
        <CommandMetric label="Morale" value={`${morale}%`} tone={morale >= 75 ? "emerald" : morale >= 55 ? "amber" : "rose"} />
        <CommandMetric label="Productivity" value={`${Math.round(productivity * 100)}%`} tone="emerald" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <FounderSquadRoster
            employees={activeEmployees}
            burnWarning={rosterSummary.burnWarning}
            onFire={setFireConfirmId}
          />

          <CandidateDraftBoard
            candidates={candidates}
            capacity={capacity}
            startupStatus={startupStatus}
            cash={cash}
            monthlyBurn={monthlyBurn}
            selectedCandidateId={selectedCandidate?.id ?? null}
            onSelect={setSelectedCandidate}
          />

          <OfficeBaseSetup
            currentOffice={currentOffice}
            startup={{ cash, monthlyBurn }}
            isLoading={isLoading}
            onSelect={handleOfficeChange}
          />
        </div>

        <aside className="space-y-5">
          <HiringConsole
            title={consoleState.title}
            summary={consoleState.summary}
            tone={consoleState.gate.tone}
            gateLabel={consoleState.gate.label}
            gateReason={consoleState.gate.reason}
            selectedCandidate={selectedCandidate}
            canHire={selectedGate.canHire}
            isLoading={isLoading}
            onHire={() => selectedCandidate && handleHire(selectedCandidate)}
            onClear={() => setSelectedCandidate(null)}
          />
          <TeamCoveragePanel coverage={coverage} />
        </aside>
      </div>

      {fireConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <section className="w-full max-w-sm border border-rose-500/30 bg-[#0a0f1e] p-5 text-rose-300 shadow-2xl hud-corner">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Squad Change</p>
            <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-white">Remove Squad Member?</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/58">
              This uses the existing termination action and will recompute burn server-side.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFireConfirmId(null)}
                className="border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-black uppercase tracking-wider text-white/55 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleFire(fireConfirmId)}
                disabled={isLoading}
                className="border border-rose-500/35 bg-rose-500/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-rose-200 hover:bg-rose-500/25 disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Remove"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function FounderSquadRoster({
  employees,
  burnWarning,
  onFire,
}: {
  employees: TeamEmployee[];
  burnWarning: string | null;
  onFire: (employeeId: string) => void;
}) {
  return (
    <section className="space-y-3">
      <PanelHeader icon={<Users className="h-4 w-4" />} title="Founder Squad" subtitle={`${employees.length} active recruits`} />
      {burnWarning && (
        <div className="border border-amber-500/25 bg-amber-500/[0.055] p-3 text-sm text-amber-300 hud-corner">
          {burnWarning}
        </div>
      )}
      {employees.length === 0 ? (
        <EmptyPanel
          title="No Squad Recruited"
          body="Your first hire changes burn, runway, and operating leverage. Draft carefully before the next sprint."
          tone="cyan"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {employees.map((employee) => (
            <RosterCard key={employee.id} employee={employee} onFire={onFire} />
          ))}
        </div>
      )}
    </section>
  );
}

function RosterCard({ employee, onFire }: { employee: TeamEmployee; onFire: (employeeId: string) => void }) {
  const RoleIcon = getTeamRoleIcon(employee.role);
  const seniority = getSeniorityPresentation(employee.seniority);
  const tags = getRoleImpactTags(employee.role);
  return (
    <article className="border border-cyan-500/15 bg-cyan-500/[0.035] p-4 hud-corner">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center border border-cyan-500/25 bg-cyan-500/10 text-cyan-300">
          <RoleIcon className="h-6 w-6" size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black uppercase tracking-wider text-white">{employee.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-wider text-white/35">{employee.role}</p>
            </div>
            <button
              type="button"
              onClick={() => onFire(employee.id)}
              className="grid h-8 w-8 shrink-0 place-items-center border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
              aria-label={`Remove ${employee.name}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <TonePill tone={seniority.tone}>{seniority.label} {seniority.skillRating}</TonePill>
            {tags.map((tag) => <TonePill key={`${employee.id}-${tag.label}`} tone={tag.tone}>{tag.label}</TonePill>)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <MiniMetric label="Salary/mo" value={formatMoney(employee.salary)} />
            <MiniMetric label="Morale" value={`${employee.morale}%`} />
          </div>
          {employee.notes && <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-white/45">{employee.notes}</p>}
        </div>
      </div>
    </article>
  );
}

function CandidateDraftBoard({
  candidates,
  capacity,
  startupStatus,
  cash,
  monthlyBurn,
  selectedCandidateId,
  onSelect,
}: {
  candidates: Candidate[];
  capacity: number;
  startupStatus: string;
  cash: number;
  monthlyBurn: number;
  selectedCandidateId: string | null;
  onSelect: (candidate: Candidate) => void;
}) {
  return (
    <section className="space-y-3">
      <PanelHeader icon={<Crosshair className="h-4 w-4" />} title="Candidate Draft Board" subtitle={`${capacity} open squad slot(s)`} />
      {capacity <= 0 ? (
        <EmptyPanel title="Squad Capacity Full" body="No open hiring capacity remains. Upgrade your base or conserve runway." tone="amber" />
      ) : candidates.length === 0 ? (
        <EmptyPanel title="Candidate Pool Refreshing" body="No candidates are available this sprint. The deterministic pool rotates with the run." tone="cyan" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {candidates.map((candidate) => {
            const gate = getHiringGatePresentation({ startup: { status: startupStatus, cash, monthlyBurn }, capacity, candidate });
            return (
              <CandidateDraftCard
                key={candidate.id}
                candidate={candidate}
                selected={candidate.id === selectedCandidateId}
                gate={gate}
                onSelect={() => onSelect(candidate)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function CandidateDraftCard({
  candidate,
  selected,
  gate,
  onSelect,
}: {
  candidate: Candidate;
  selected: boolean;
  gate: { canHire: boolean; label: string; reason: string; tone: TeamTone };
  onSelect: () => void;
}) {
  const RoleIcon = getTeamRoleIcon(candidate.role);
  const seniority = getSeniorityPresentation(candidate.seniority);
  const impact = getCandidatePrimaryImpact(candidate);
  const risk = getCandidateRiskLevel(candidate);
  const tags = getRoleImpactTags(candidate.role);

  return (
    <article className={cn("group border p-4 transition-colors hud-corner", selected ? "border-emerald-500/35 bg-emerald-500/[0.075]" : "border-white/10 bg-white/[0.025] hover:border-cyan-500/25")}>
      <div className="flex items-start gap-3">
        <div className="relative grid h-14 w-14 shrink-0 place-items-center border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
          <RoleIcon className="h-7 w-7" size={28} />
          {candidate.missionRelevance === "critical" && (
            <span className="absolute -right-1 -top-1 h-3 w-3 border border-amber-300 bg-amber-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black uppercase tracking-wider text-white">{candidate.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-wider text-white/35">{candidate.role}</p>
            </div>
            <TonePill tone={seniority.tone}>{seniority.skillRating}</TonePill>
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/48">{candidate.bio}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <TonePill tone={seniority.tone}>{seniority.label}</TonePill>
            {tags.map((tag) => <TonePill key={`${candidate.id}-${tag.label}`} tone={tag.tone}>{tag.label}</TonePill>)}
            <TonePill tone={risk.tone}>{risk.label}</TonePill>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <MiniMetric label="Salary/mo" value={formatMoney(candidate.salary)} />
            <MiniMetric label="All-in burn" value={`${formatMoney(candidate.monthlyBurn ?? candidate.salary)}/mo`} />
            <MiniMetric label={`${impact.label} impact`} value={signed(impact.value)} />
            <MiniMetric label="Runway" value={getCandidateRunwayImpact(candidate)} />
          </div>
          {(candidate.warning || risk.risk === "high" || risk.risk === "severe") && (
            <div className={cn("mt-3 flex items-start gap-2 border p-2 text-[11px] leading-relaxed", TONE_CLASS[risk.tone])}>
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {risk.warning}
            </div>
          )}
          <button
            type="button"
            onClick={onSelect}
            className={cn("mt-3 inline-flex w-full items-center justify-center gap-2 border px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors", TONE_CLASS[gate.tone])}
          >
            <Radio className="h-3.5 w-3.5" />
            {selected ? "Selected Recruit" : gate.canHire ? "Inspect Recruit" : gate.label}
          </button>
        </div>
      </div>
    </article>
  );
}

function HiringConsole({
  title,
  summary,
  tone,
  gateLabel,
  gateReason,
  selectedCandidate,
  canHire,
  isLoading,
  onHire,
  onClear,
}: {
  title: string;
  summary: string;
  tone: TeamTone;
  gateLabel: string;
  gateReason: string;
  selectedCandidate: Candidate | null;
  canHire: boolean;
  isLoading: boolean;
  onHire: () => void;
  onClear: () => void;
}) {
  return (
    <section className={cn("sticky top-24 border p-5 hud-corner", TONE_CLASS[tone])}>
      <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Hiring Console</p>
      <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/58">{summary}</p>
      <div className="mt-4 border border-current/20 bg-black/20 p-3">
        <p className="text-[9px] font-black uppercase tracking-wider opacity-70">{gateLabel}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/58">{gateReason}</p>
      </div>
      {selectedCandidate && (
        <div className="mt-4 space-y-2">
          <HiringImpactPreview candidate={selectedCandidate} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onHire}
              disabled={!canHire || isLoading}
              className="inline-flex flex-1 items-center justify-center gap-2 border border-emerald-500/35 bg-emerald-500/15 px-3 py-2 text-xs font-black uppercase tracking-wider text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {isLoading ? "Recruiting..." : "Recruit"}
            </button>
            <button
              type="button"
              onClick={onClear}
              className="border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black uppercase tracking-wider text-white/45 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function HiringImpactPreview({ candidate }: { candidate: Candidate }) {
  const primary = getCandidatePrimaryImpact(candidate);
  return (
    <div className="grid gap-2">
      <MiniMetric label="Primary impact" value={`${primary.label} ${signed(primary.value)}`} />
      <MiniMetric label="Morale" value={signed(candidate.moraleImpact)} />
      <MiniMetric label="Risk" value={signed(candidate.riskImpact)} />
      <MiniMetric label="Investor" value={signed(candidate.investorImpact)} />
    </div>
  );
}

function OfficeBaseSetup({
  currentOffice,
  startup,
  isLoading,
  onSelect,
}: {
  currentOffice: string;
  startup: { cash: number; monthlyBurn: number };
  isLoading: boolean;
  onSelect: (officeType: string) => void;
}) {
  return (
    <section className="space-y-3">
      <PanelHeader icon={<Briefcase className="h-4 w-4" />} title="Base Setup" subtitle="Office choice changes burn, morale, and productivity" />
      <div className="grid gap-3 lg:grid-cols-2">
        {getOfficeOptions().map((office) => {
          const OfficeIcon = getOfficeIcon(office.type);
          const selected = currentOffice === office.type;
          return (
            <button
              key={office.type}
              type="button"
              disabled={selected || isLoading}
              onClick={() => onSelect(office.type)}
              className="text-left disabled:cursor-default"
            >
              <article className={cn("h-full border p-4 transition-colors hud-corner", selected ? "border-cyan-500/35 bg-cyan-500/[0.075]" : "border-white/10 bg-white/[0.025] hover:border-violet-500/30")}>
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center border border-cyan-500/25 bg-cyan-500/10 text-cyan-300">
                    <OfficeIcon className="h-6 w-6" size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">{office.label}</h3>
                      {selected && <TonePill tone="cyan">Current</TonePill>}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-white/48">{office.summary}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <MiniMetric label="Cost/mo" value={formatMoney(office.monthlyCost)} />
                      <MiniMetric label="Runway" value={getOfficeRunwayImpact(office.type, startup)} />
                      <MiniMetric label="Morale" value={office.moraleLabel} />
                      <MiniMetric label="Productivity" value={office.productivityLabel} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <TonePill tone={office.risk === "severe" ? "rose" : office.risk === "high" ? "amber" : office.risk === "normal" ? "violet" : "emerald"}>
                        {office.risk} burn
                      </TonePill>
                      <TonePill tone="white">{office.bestFit}</TonePill>
                    </div>
                  </div>
                </div>
              </article>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TeamCoveragePanel({ coverage }: { coverage: ReturnType<typeof getTeamCoverage> }) {
  return (
    <section className="border border-violet-500/20 bg-violet-500/[0.04] p-5 text-violet-300 hud-corner">
      <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Team Coverage</p>
      <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-white">Squad Gaps</h2>
      <div className="mt-4 grid gap-2">
        {coverage.map((item) => (
          <div key={item.id} className={cn("border p-3", COVERAGE_CLASS[item.level])}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black uppercase tracking-wider text-white">{item.label}</p>
              <span className="text-[9px] font-black uppercase tracking-wider opacity-70">{item.level}</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-white/48">{item.summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CommandMetric({ label, value, tone }: { label: string; value: string; tone: TeamTone }) {
  return (
    <div className={cn("border p-3 text-center hud-corner", TONE_CLASS[tone])}>
      <p className="text-[9px] font-black uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 truncate text-xl font-black text-white">{value}</p>
    </div>
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

function EmptyPanel({ title, body, tone }: { title: string; body: string; tone: TeamTone }) {
  return (
    <section className={cn("border p-5 hud-corner", TONE_CLASS[tone])}>
      <p className="text-sm font-black uppercase tracking-wider text-white">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
    </section>
  );
}

function TonePill({ tone, children }: { tone: TeamTone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider", TONE_CLASS[tone])}>
      {children}
    </span>
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
