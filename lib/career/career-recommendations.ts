import type { CareerProfileSnapshot } from "./types";

const SECTORS = ["SaaS", "Fintech", "HealthTech", "AI/ML", "E-commerce", "EdTech", "Web3"];

export function generateNextChallenge(profile: CareerProfileSnapshot): string {
  const { completedStartups, totalBreakouts, totalAcquisitions, totalSurvived12,
    sectorStats, playstyleStats, rivalStats, founderRank, bestOutcome } = profile;

  // First run ever
  if (completedStartups === 0 && profile.deadStartups === 0) {
    return "Deploy your first startup. Any sector counts — the journey starts now.";
  }

  // Never survived a full run
  if (totalSurvived12 === 0 && completedStartups >= 1) {
    return "You haven't survived a full 12-week accelerator run yet. Focus on burn rate and run the clock down.";
  }

  // Never beaten rivals
  if (rivalStats.rivalsDefeated === 0 && completedStartups >= 2) {
    return "You have never defeated a rival. Try using counter-actions aggressively next run to build your Rival Killer stack.";
  }

  // Never hit BREAKOUT
  if (totalBreakouts === 0 && completedStartups >= 3) {
    return "You've never reached BREAKOUT. Focus on Product-Led Growth + high revenue before Week 10.";
  }

  // Never exited via acquisition
  if (totalAcquisitions === 0 && completedStartups >= 5) {
    return "Try building toward an acquisition: grow valuation past $3M with strong investor scores.";
  }

  // Sector gaps — find sectors never tried
  const triedSectors = Object.keys(sectorStats);
  const untriedSectors = SECTORS.filter((s) => !triedSectors.includes(s));
  if (untriedSectors.length > 0) {
    return `You haven't tried ${untriedSectors[0]} yet. Each sector has unique market dynamics and strategy signals.`;
  }

  // Playstyle gaps — find playstyles never reached dominant
  const PLAYSTYLE_LABELS: Record<string, string> = {
    regulated_operator: "a Regulated Operator run",
    trust_builder: "a Trust Builder run",
    capital_blitzscaler: "a Capital Blitzscaler run",
    rival_killer: "a Rival Killer run",
    community_led: "a Community-Led Growth run",
  };
  for (const [ps, label] of Object.entries(PLAYSTYLE_LABELS)) {
    if (!playstyleStats[ps] || playstyleStats[ps].timesDominant === 0) {
      return `Try ${label} — you've never reached dominant level in that archetype.`;
    }
  }

  // Near next rank
  if (founderRank === "builder" && completedStartups < 5) {
    const needed = 5 - completedStartups;
    return `${needed} more completed run${needed > 1 ? "s" : ""} to reach Operator rank.`;
  }
  if (founderRank === "operator" && totalBreakouts === 0 && totalAcquisitions === 0) {
    return "One breakout or acquisition will promote you to Closer rank.";
  }
  if (founderRank === "closer" && completedStartups < 10) {
    const needed = 10 - completedStartups;
    return `${needed} more run${needed > 1 ? "s" : ""} to reach Veteran rank.`;
  }
  if (founderRank === "veteran" && totalBreakouts < 3) {
    const needed = 3 - totalBreakouts;
    return `${needed} more breakout${needed > 1 ? "s" : ""} will unlock Arena Legend rank.`;
  }

  // High achiever — push for arena legend
  if (founderRank === "arena_legend") {
    return "You're Arena Legend. Try a sector you haven't fully mastered and push for a clean sweep.";
  }

  // Fallback based on best outcome
  if (bestOutcome === "SEED_READY") {
    return "You're consistently reaching Seed stage. Push further: grow revenue past $50K for Series A Ready.";
  }
  if (bestOutcome === "SERIES_A_READY") {
    return "You're near the top. Optimize capital efficiency past 2× for a BREAKOUT run.";
  }

  return "Keep building. Each run teaches you something new about the market.";
}
