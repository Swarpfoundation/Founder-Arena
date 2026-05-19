import { getOfficeSetup, OFFICE_SETUPS } from "@/lib/team/effects";
import type { Candidate, OfficeSetup } from "@/lib/team/types";

export type TeamTone = "cyan" | "violet" | "rose" | "amber" | "emerald" | "white";
export type TeamRiskLevel = "low" | "normal" | "high" | "severe";
export type CoverageLevel = "missing" | "partial" | "strong";

export interface RosterMemberInput {
  role?: string | null;
  salary?: number | null;
  status?: string | null;
  effectJson?: unknown;
}

export interface StartupHiringInput {
  status?: string | null;
  cash?: number | null;
  monthlyBurn?: number | null;
}

export interface ImpactTag {
  label: string;
  tone: TeamTone;
}

export interface SeniorityPresentation {
  label: string;
  skillRating: number;
  tone: TeamTone;
  summary: string;
}

export interface HiringGatePresentation {
  canHire: boolean;
  label: string;
  reason: string;
  tone: TeamTone;
}

export interface CandidateImpactPresentation {
  label: string;
  value: number;
  tone: TeamTone;
  summary: string;
}

export interface CandidateRiskPresentation {
  risk: TeamRiskLevel;
  label: string;
  warning: string;
  tone: TeamTone;
}

export interface OfficePresentation {
  type: OfficeSetup["type"];
  label: string;
  monthlyCost: number;
  moraleLabel: string;
  productivityLabel: string;
  bestFit: string;
  risk: TeamRiskLevel;
  summary: string;
}

export interface TeamCoverageItem {
  id: string;
  label: string;
  level: CoverageLevel;
  count: number;
  roles: string[];
  summary: string;
}

export interface RosterSummary {
  activeCount: number;
  monthlyPayroll: number;
  burnWarning: string | null;
}

const ROLE_TAGS: Array<{ match: string[]; tags: ImpactTag[] }> = [
  { match: ["cto", "engineer", "ai"], tags: [{ label: "Product", tone: "cyan" }, { label: "Engineering", tone: "violet" }] },
  { match: ["designer", "product"], tags: [{ label: "Product", tone: "cyan" }, { label: "UX", tone: "emerald" }] },
  { match: ["sales", "marketing"], tags: [{ label: "Revenue", tone: "emerald" }, { label: "Growth", tone: "amber" }] },
  { match: ["compliance"], tags: [{ label: "Compliance", tone: "violet" }, { label: "Risk", tone: "rose" }] },
  { match: ["security"], tags: [{ label: "Security", tone: "rose" }, { label: "Risk", tone: "amber" }] },
  { match: ["finance", "ops"], tags: [{ label: "Investor", tone: "violet" }, { label: "Ops", tone: "cyan" }] },
  { match: ["support"], tags: [{ label: "Support", tone: "emerald" }, { label: "Revenue", tone: "cyan" }] },
];

const COVERAGE_RULES: Array<{ id: string; label: string; matches: string[]; summary: string }> = [
  { id: "product", label: "Product", matches: ["cto", "engineer", "designer", "product"], summary: "Can ship and improve the product loop." },
  { id: "engineering", label: "Engineering", matches: ["cto", "engineer", "ai"], summary: "Can build core systems and technical leverage." },
  { id: "revenue", label: "Revenue", matches: ["sales", "marketing", "support"], summary: "Can create and support customer demand." },
  { id: "risk", label: "Risk / Security", matches: ["security", "compliance", "finance", "ops"], summary: "Can reduce operational and investor risk." },
  { id: "compliance", label: "Compliance", matches: ["compliance"], summary: "Can handle regulated-market pressure." },
  { id: "investor", label: "Investor / Ops", matches: ["cto", "finance", "ops", "sales"], summary: "Can keep capital and execution narratives credible." },
  { id: "support", label: "Support", matches: ["support"], summary: "Can protect customers after launch." },
];

export function getRoleImpactTags(role: string | null | undefined): ImpactTag[] {
  const normalized = normalize(role);
  const matched = ROLE_TAGS.find((entry) => entry.match.some((token) => normalized.includes(token)));
  return matched?.tags ?? [{ label: "Generalist", tone: "white" }];
}

export function getSeniorityPresentation(seniority: string | null | undefined): SeniorityPresentation {
  switch (seniority) {
    case "lead":
      return { label: "Lead", skillRating: 96, tone: "rose", summary: "Maximum impact, maximum burn." };
    case "senior":
      return { label: "Senior", skillRating: 90, tone: "emerald", summary: "High leverage with expensive monthly burn." };
    case "mid":
      return { label: "Mid", skillRating: 75, tone: "violet", summary: "Reliable execution at standard startup cost." };
    case "junior":
      return { label: "Junior", skillRating: 60, tone: "amber", summary: "Cheaper growth hire with lower immediate leverage." };
    default:
      return { label: "Unknown", skillRating: 50, tone: "white", summary: "Unclear seniority signal." };
  }
}

export function getCandidatePrimaryImpact(candidate: Candidate): CandidateImpactPresentation {
  const impacts = [
    { label: "Product", value: candidate.productImpact, tone: "cyan" as TeamTone, summary: "Improves product velocity." },
    { label: "Revenue", value: candidate.revenueImpact, tone: "emerald" as TeamTone, summary: "Improves sales or growth pressure." },
    { label: "Risk", value: Math.abs(candidate.riskImpact), tone: "rose" as TeamTone, summary: candidate.riskImpact < 0 ? "Reduces operational risk." : "Adds operational risk." },
    { label: "Investor", value: candidate.investorImpact, tone: "violet" as TeamTone, summary: "Improves investor confidence." },
  ];
  return impacts.sort((a, b) => b.value - a.value)[0] ?? impacts[0];
}

export function getCandidateRiskLevel(candidate: Pick<Candidate, "warning" | "seniority" | "salary" | "monthlyBurn" | "runwayAfter">): CandidateRiskPresentation {
  if (typeof candidate.runwayAfter === "number" && candidate.runwayAfter < 2) {
    return { risk: "severe", label: "Runway Break Risk", warning: "This recruit would push runway below 2 months.", tone: "rose" };
  }
  if (typeof candidate.runwayAfter === "number" && candidate.runwayAfter < 4) {
    return { risk: "high", label: "Runway Warning", warning: "This recruit leaves less than 4 months of runway.", tone: "amber" };
  }
  if (candidate.warning) {
    return { risk: "high", label: "Warning Flag", warning: candidate.warning, tone: "amber" };
  }
  if (candidate.seniority === "lead" || (candidate.monthlyBurn ?? candidate.salary) >= 25000) {
    return { risk: "normal", label: "High Burn Recruit", warning: "Strong impact, but payroll pressure rises.", tone: "violet" };
  }
  return { risk: "low", label: "Clean Recruit", warning: "No major warning flags.", tone: "emerald" };
}

export function getHiringGatePresentation(input: {
  startup: StartupHiringInput;
  capacity: number;
  candidate?: Candidate | null;
}): HiringGatePresentation {
  const status = input.startup.status;
  if (status !== "funded" && status !== "active") {
    return {
      canHire: false,
      label: "Team Command Locked",
      reason: "Hiring unlocks after funding. Negotiate capital before building the squad.",
      tone: "rose",
    };
  }
  if (input.capacity <= 0) {
    return {
      canHire: false,
      label: "Squad Capacity Full",
      reason: "No open seats remain in the current hiring capacity.",
      tone: "amber",
    };
  }
  if (input.candidate && typeof input.candidate.runwayAfter === "number" && input.candidate.runwayAfter < 2) {
    return {
      canHire: false,
      label: "Runway Too Low",
      reason: "Server-side affordability rules will block hires that drop runway below 2 months.",
      tone: "rose",
    };
  }
  if (input.candidate && typeof input.candidate.runwayAfter === "number" && input.candidate.runwayAfter < 4) {
    return {
      canHire: true,
      label: "High-Burn Recruit",
      reason: "Recruiting is allowed, but runway drops below 4 months.",
      tone: "amber",
    };
  }
  return {
    canHire: true,
    label: "Recruitment Open",
    reason: "This run can recruit from the current candidate draft board.",
    tone: "emerald",
  };
}

export function getCandidateRunwayImpact(candidate: Pick<Candidate, "runwayAfter" | "salary" | "monthlyBurn">): string {
  if (typeof candidate.runwayAfter === "number") return `${candidate.runwayAfter} mo runway after hire`;
  return `${formatMoney(candidate.monthlyBurn ?? candidate.salary)}/mo burn added`;
}

export function getOfficePresentation(type: string): OfficePresentation {
  const office = getOfficeSetup(type);
  const risk: TeamRiskLevel =
    office.monthlyCost >= 20000 ? "severe" : office.monthlyCost >= 8000 ? "high" : office.monthlyCost > 0 ? "normal" : "low";
  const bestFit =
    office.type === "remote"
      ? "Survival runway"
      : office.type === "coworking"
        ? "Early signal"
        : office.type === "small_office"
          ? "Focused execution"
          : "Investor optics";
  return {
    type: office.type,
    label: office.label,
    monthlyCost: office.monthlyCost,
    moraleLabel: formatModifier(office.moraleModifier),
    productivityLabel: formatModifier(office.productivityModifier - 1),
    bestFit,
    risk,
    summary: office.description,
  };
}

export function getOfficeOptions(): OfficePresentation[] {
  return OFFICE_SETUPS.map((office) => getOfficePresentation(office.type));
}

export function getOfficeRunwayImpact(type: string, startup: StartupHiringInput): string {
  const office = getOfficeSetup(type);
  const cash = startup.cash ?? 0;
  const projectedBurn = Math.max((startup.monthlyBurn ?? 0) + office.monthlyCost, 1);
  return `${Math.floor(cash / projectedBurn)} mo runway at current cash`;
}

export function getTeamCoverage(team: Array<RosterMemberInput | string>): TeamCoverageItem[] {
  const roles = team
    .map((member) => typeof member === "string" ? member : member.status === "active" || !member.status ? member.role ?? "" : "")
    .filter(Boolean);

  return COVERAGE_RULES.map((rule) => {
    const matchedRoles = roles.filter((role) => rule.matches.some((token) => normalize(role).includes(token)));
    const level: CoverageLevel = matchedRoles.length >= 2 ? "strong" : matchedRoles.length === 1 ? "partial" : "missing";
    return {
      id: rule.id,
      label: rule.label,
      level,
      count: matchedRoles.length,
      roles: matchedRoles,
      summary: rule.summary,
    };
  });
}

export function getRosterSummary(team: RosterMemberInput[]): RosterSummary {
  const active = team.filter((member) => member.status === "active" || !member.status);
  const monthlyPayroll = active.reduce((sum, member) => sum + (member.salary ?? 0), 0);
  return {
    activeCount: active.length,
    monthlyPayroll,
    burnWarning:
      monthlyPayroll >= 100000
        ? "Squad burn is heavy. Confirm runway before running another sprint."
        : monthlyPayroll >= 50000
          ? "Payroll pressure is rising."
          : null,
  };
}

export function getHiringConsoleState(input: {
  selectedCandidate?: Candidate | null;
  startup: StartupHiringInput;
  capacity: number;
}): {
  title: string;
  summary: string;
  gate: HiringGatePresentation;
} {
  const gate = getHiringGatePresentation(input);
  if (!input.selectedCandidate) {
    return {
      title: "Select a Draft Candidate",
      summary: "Choose a recruit to inspect burn, runway, and squad impact before committing.",
      gate,
    };
  }
  const impact = getCandidatePrimaryImpact(input.selectedCandidate);
  return {
    title: `Recruit ${input.selectedCandidate.name}`,
    summary: `${impact.label} impact: ${signed(impact.value)}. ${getCandidateRunwayImpact(input.selectedCandidate)}.`,
    gate,
  };
}

export function formatMoney(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

export function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().trim();
}

function formatModifier(value: number): string {
  const percent = Math.round(value * 100);
  return percent > 0 ? `+${percent}%` : `${percent}%`;
}
