/**
 * Demo sample data for empty states in development/demo mode.
 * These are NOT seeded to the database — they are rendered as static
 * example cards when the DB is empty to help users understand the UI.
 */

export function isDemoSamplesEnabled(): boolean {
  return process.env.DEMO_MODE_ENABLED === "true" || process.env.NODE_ENV !== "production";
}

export interface SampleLeaderboardEntry {
  name: string;
  sector: string;
  founderName: string;
  score: number;
  valuation: number;
  survivalMonths: number;
  outcome: string;
}

export const SAMPLE_LEADERBOARD_ENTRIES: SampleLeaderboardEntry[] = [
  {
    name: "ReguLens (Demo)",
    sector: "AI / ML",
    founderName: "Demo Founder",
    score: 2840,
    valuation: 4_200_000,
    survivalMonths: 12,
    outcome: "SERIES_A_READY",
  },
  {
    name: "BridgeSend (Demo)",
    sector: "Fintech",
    founderName: "Demo Founder",
    score: 1520,
    valuation: 2_800_000,
    survivalMonths: 12,
    outcome: "SEED_READY",
  },
];

export interface SampleGraveyardEntry {
  name: string;
  sector: string;
  founderName: string;
  monthsSurvived: number;
  valuation: number;
  deathReason: string;
}

export const SAMPLE_GRAVEYARD_ENTRIES: SampleGraveyardEntry[] = [
  {
    name: "StreamForge (Demo)",
    sector: "Consumer",
    founderName: "Demo Founder",
    monthsSurvived: 5,
    valuation: 180_000,
    deathReason: "Cash ran out after aggressive hiring in a crypto bear market. Revenue never materialized.",
  },
];
