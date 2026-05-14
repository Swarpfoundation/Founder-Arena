/**
 * Founder Arena — Region Cost Multipliers
 *
 * Applied to US baseline salary bands.
 */

import { RegionMultiplier } from "./types";

export const REGION_MULTIPLIERS: RegionMultiplier[] = [
  { region: "united states", multiplier: 1.0, label: "United States" },
  { region: "san francisco", multiplier: 1.3, label: "San Francisco" },
  { region: "new york", multiplier: 1.3, label: "New York" },
  { region: "western europe", multiplier: 0.75, label: "Western Europe" },
  { region: "france", multiplier: 0.7, label: "France" },
  { region: "germany", multiplier: 0.8, label: "Germany" },
  { region: "uk", multiplier: 0.9, label: "UK / London" },
  { region: "london", multiplier: 0.9, label: "UK / London" },
  { region: "eastern europe", multiplier: 0.45, label: "Eastern Europe" },
  { region: "india", multiplier: 0.3, label: "India" },
  { region: "africa", multiplier: 0.35, label: "Africa" },
  { region: "remote", multiplier: 0.55, label: "Remote Global" },
  { region: "asia", multiplier: 0.4, label: "Asia" },
  { region: "latin america", multiplier: 0.35, label: "Latin America" },
  { region: "middle east", multiplier: 0.6, label: "Middle East" },
  { region: "canada", multiplier: 0.85, label: "Canada" },
  { region: "australia", multiplier: 0.9, label: "Australia" },
  { region: "southeast asia", multiplier: 0.35, label: "Southeast Asia" },
];

export function getRegionMultiplier(region: string): number {
  const normalized = region.toLowerCase().trim();
  const match = REGION_MULTIPLIERS.find(
    (r) => normalized.includes(r.region) || r.region.includes(normalized)
  );
  return match?.multiplier ?? 0.55; // default to remote global
}

export function getRegionLabel(region: string): string {
  const normalized = region.toLowerCase().trim();
  const match = REGION_MULTIPLIERS.find(
    (r) => normalized.includes(r.region) || r.region.includes(normalized)
  );
  return match?.label ?? "Remote Global";
}
