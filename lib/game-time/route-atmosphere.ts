import type { CeremonyAccent } from "@/lib/gamefeel/ceremony";
import type { CriticalEventPresentation } from "@/lib/gamefeel/critical-events";
import {
  getDemoDayCountdown,
  getRunPhase,
  getRunStepLabel,
  getSprintPressureLevel,
} from "./time-scale";

export type SprintRouteKey =
  | "social"
  | "rivals"
  | "strategy"
  | "boardroom"
  | "growth"
  | "documentary"
  | "career"
  | "leaderboard"
  | "demo";

const ROUTE_COPY: Record<SprintRouteKey, {
  eyebrow: string;
  title: string;
  description: string;
  accent: CeremonyAccent;
}> = {
  social: {
    eyebrow: "Sprint Media Pressure",
    title: "Public Narrative Compounds",
    description: "Public narrative can turn sprint momentum into trust — or backlash.",
    accent: "cyan",
  },
  rivals: {
    eyebrow: "Rival Escalation",
    title: "Competitors Move Toward Demo Day",
    description: "Rivals escalate as Demo Day approaches. Expect sharper pressure if your signal is visible.",
    accent: "rose",
  },
  strategy: {
    eyebrow: "Strategy Stack",
    title: "Playstyle Emerges Sprint By Sprint",
    description: "Your decisions create a founder pattern. The current phase changes which signals matter most.",
    accent: "violet",
  },
  boardroom: {
    eyebrow: "Investor Checkpoint",
    title: "Board Pressure Tracks The Sprint Clock",
    description: "Investor checkpoints intensify as Demo Day approaches. Control the narrative before the board does.",
    accent: "amber",
  },
  growth: {
    eyebrow: "Growth Window",
    title: "Offers Sharpen Near Demo Day",
    description: "Growth and acquisition offers become sharper as the run approaches Demo Day Runway.",
    accent: "emerald",
  },
  documentary: {
    eyebrow: "Story System",
    title: "Every Sprint Becomes A Chapter",
    description: "After Demo Day, your decisions become a documentary, career record, and public result.",
    accent: "violet",
  },
  career: {
    eyebrow: "Founder Legacy",
    title: "Founder Weeks Become Reputation",
    description: "Founder Weeks survived, outcomes, badges, and playstyles compound into career legacy.",
    accent: "amber",
  },
  leaderboard: {
    eyebrow: "Arena Season",
    title: "Demo Day Verdicts Power The Board",
    description: "Season rankings are built from Demo Day Verdicts, survival, valuation, revenue, and outcome score.",
    accent: "cyan",
  },
  demo: {
    eyebrow: "Presenter Path",
    title: "Show The 12-Week Accelerator Arc",
    description: "The strongest demo path shows Deployment Bay, Week 1, mid-run pressure, Demo Day story, career, and arena ranking.",
    accent: "cyan",
  },
};

export function getRouteSprintAtmosphere(
  routeKey: SprintRouteKey,
  step?: number | null
): CriticalEventPresentation {
  const copy = ROUTE_COPY[routeKey];
  const phase = getRunPhase(step);
  const pressure = getSprintPressureLevel(step);
  const pressureLabel =
    pressure === "demo_day"
      ? "Demo Day Runway"
      : pressure === "dangerous"
        ? "Dangerous"
        : pressure === "rising"
          ? "Pressure Rising"
          : "Early Signal";

  return {
    type:
      routeKey === "rivals"
        ? "rival"
        : routeKey === "boardroom"
          ? "boardroom"
          : routeKey === "growth"
            ? "acquisition"
            : routeKey === "leaderboard"
              ? "leaderboard"
              : routeKey === "strategy"
                ? "strategy"
                : "neutral",
    severity: pressure === "demo_day" || pressure === "dangerous" ? "high" : "medium",
    eyebrow: copy.eyebrow,
    title: copy.title,
    subtitle: step
      ? `${getRunStepLabel(step)} / ${phase.label}. ${copy.description} ${getDemoDayCountdown(step)}. Pressure: ${pressureLabel}.`
      : copy.description,
    accent: copy.accent,
    affectedStats: step
      ? [
          { label: "Phase", value: phase.label, accent: copy.accent },
          { label: "Pressure", value: pressureLabel, accent: pressure === "demo_day" ? "rose" : copy.accent },
        ]
      : undefined,
    displayKey: `route-atmosphere:${routeKey}:${step ?? "global"}`,
  };
}
