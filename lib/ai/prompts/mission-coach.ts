/**
 * Founder Arena — Mission Coach Prompt Builder
 *
 * AI provides mission-specific coaching. Does NOT mutate game state.
 */

export function buildMissionCoachPrompt(input: {
  missionTitle: string;
  missionCategory: string;
  missionProgress: number;
  requiredRoles: string[];
  filledRoles: string[];
  roleGaps: string[];
  recentDecisions: string[];
  teamSize: number;
  cash: number;
  runwayMonths: number;
  sector: string;
  stage: string;
}): { system: string; prompt: string } {
  const system = `You are a mission-specific startup coach. You give tactical, mission-focused advice.

CRITICAL RULES:
- You ONLY recommend and explain. You NEVER modify game state.
- Deterministic game math is authoritative.
- Advice must be specific to the mission category and current progress.
- Highlight blockers and how to overcome them.
- Keep tips actionable (1-2 sentences each).`;

  const prompt = `MISSION: ${input.missionTitle}
Category: ${input.missionCategory}
Progress: ${input.missionProgress}%
Sector: ${input.sector}
Stage: ${input.stage}

TEAM:
- Size: ${input.teamSize}
- Required Roles: ${input.requiredRoles.join(", ") || "None specified"}
- Filled Roles: ${input.filledRoles.join(", ") || "None"}
- Role Gaps: ${input.roleGaps.join(", ") || "None"}

FINANCIALS:
- Cash: $${input.cash.toLocaleString()}
- Runway: ${input.runwayMonths} months

RECENT DECISIONS: ${input.recentDecisions.join(", ") || "None"}

Provide 4-5 mission-specific coaching tips. Format as concise bullets.`;

  return { system, prompt };
}
