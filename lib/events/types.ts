export type EventCategory =
  | "market"
  | "team"
  | "product"
  | "security"
  | "regulatory"
  | "investor"
  | "customer"
  | "competitor"
  | "finance"
  | "viral"
  | "operational";

export type EventSeverity = "minor" | "moderate" | "critical";

export interface EventEffect {
  cashDelta?: number;
  burnDelta?: number;
  revenueDelta?: number;
  productDelta?: number;
  investorDelta?: number;
  marketDelta?: number;
  riskDelta?: number;
  valuationMultiplier?: number;
  revenueMultiplier?: number;
  burnMultiplier?: number;
}

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  effects: EventEffect;
  /** If set, this choice requires the startup to have at least this much cash */
  minCashRequired?: number;
  /** If set, this choice requires the startup to have at least this much product progress */
  minProductProgress?: number;
  /** If set, this choice requires the startup to have at least this many employees */
  minEmployees?: number;
  /** If set, this choice is only available in certain months or later */
  minMonth?: number;
  /** If true, this choice is only available if the startup has an active compliance/security hire */
  requiresSecurityHire?: boolean;
}

export interface SimulationEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  severity: EventSeverity;
  /** Narrative flavor text shown to the player */
  narrative: string;
  /** Which months this event can appear (1-12). Empty = any month. */
  eligibleMonths?: number[];
  /** Minimum month this event can appear */
  minMonth?: number;
  /** Maximum month this event can appear */
  maxMonth?: number;
  /** Sector restrictions. Empty = all sectors. */
  eligibleSectors?: string[];
  /** Choices the player can make */
  choices: EventChoice[];
  /** If true, this event can only happen once per startup */
  oncePerRun: boolean;
  /** Base probability weight (relative to other events). Higher = more likely. */
  weight: number;
}

export interface ResolvedEvent {
  eventId: string;
  title: string;
  category: EventCategory;
  severity: EventSeverity;
  selectedChoiceId: string;
  selectedChoiceLabel: string;
  effects: EventEffect;
  narrative: string;
  /** AI-generated narrative for this specific event+choice combination */
  aiNarrative?: string;
  /** AI coaching tip for the player */
  aiCoaching?: string;
}

export interface EventStateContext {
  startupId: string;
  monthNumber: number;
  cash: number;
  monthlyBurn: number;
  revenue: number;
  productProgress: number;
  investorScore: number;
  marketScore: number;
  riskScore: number;
  employeeCount: number;
  sector: string;
  /** IDs of events already triggered this run */
  eventsTriggered: string[];
  /** IDs of decisions selected this month */
  selectedDecisionIds?: string[];
}

/** Deterministic pseudo-random number generator (mulberry32) */
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash a string to a 32-bit integer seed */
export function hashString(str: string): number {
  let h = 1779033703;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}
