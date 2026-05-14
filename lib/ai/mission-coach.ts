/**
 * Founder Arena — AI Mission Coach
 *
 * Provides mission-specific tactical coaching. Does NOT mutate game state.
 */

import { z } from "zod";
import { buildMissionCoachPrompt } from "./prompts/mission-coach";
import { ai } from "./index";

export const missionCoachSchema = z.object({
  tips: z.array(z.string()).max(6),
  priorityTip: z.string(),
  reasoning: z.string(),
});

export type MissionCoachResult = z.infer<typeof missionCoachSchema>;

export async function generateMissionCoach(input: {
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
}): Promise<MissionCoachResult> {
  const { system, prompt } = buildMissionCoachPrompt(input);

  try {
    return await ai.generateStructured({
      system,
      prompt,
      schema: missionCoachSchema,
      temperature: 0.5,
      maxTokens: 1200,
    });
  } catch {
    return generateDeterministicMissionCoach(input);
  }
}

export function generateDeterministicMissionCoach(
  input: Parameters<typeof generateMissionCoach>[0]
): MissionCoachResult {
  const tips: string[] = [];

  if (input.roleGaps.length > 0) {
    tips.push(`Hire ${input.roleGaps.join(" and ")} to unblock mission progress.`);
  }

  if (input.missionProgress < 30) {
    tips.push("Focus on foundational work: define requirements and validate the approach.");
  } else if (input.missionProgress < 70) {
    tips.push("You're in the build phase. Maintain velocity and avoid scope creep.");
  } else {
    tips.push("Mission is nearly complete. Focus on polish, testing, and handoff.");
  }

  if (input.runwayMonths < 4) {
    tips.push("Short runway: consider deferring non-critical mission scope to preserve cash.");
  }

  if (input.teamSize < 3 && input.missionCategory !== "product") {
    tips.push("Small team: prioritize the highest-impact workstreams and cut nice-to-haves.");
  }

  const categoryTips: Record<string, string> = {
    product: "Validate each feature with user feedback before moving to the next.",
    engineering: "Write tests early. Technical debt will compound if deferred.",
    ai_model: "Monitor model drift and maintain a holdout evaluation set.",
    compliance: "Document every decision. Auditors will ask for evidence.",
    security: "Fix critical vulnerabilities first. Perfect is the enemy of secure.",
    sales: "Focus on 3 high-probability prospects rather than 20 low-probability ones.",
    marketing: "Measure CAC for every channel. Kill underperformers quickly.",
    operations: "Automate manual steps early. Operational debt is hard to unwind.",
    fundraising: "Lead with traction metrics. Investors pattern-match on proof points.",
    growth: "Run one experiment at a time. Mixed variables yield inconclusive results.",
    partnership: "Get terms in writing early. Verbal agreements create ambiguity.",
    infrastructure: "Plan for 10x scale, but build for 2x. Premature optimization wastes time.",
    research: "Set a timebox. Research missions can expand indefinitely.",
    launch: "Have a rollback plan. Launches with no contingency often fail publicly.",
  };

  const catTip = categoryTips[input.missionCategory] ?? "Stay focused on the mission objectives.";
  tips.push(catTip);

  return {
    tips: tips.slice(0, 5),
    priorityTip: tips[0] ?? "Keep executing on the mission plan.",
    reasoning: "Deterministic coaching based on mission progress, role gaps, runway, and category.",
  };
}
