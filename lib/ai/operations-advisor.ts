/**
 * Founder Arena — AI Operations Advisor
 *
 * Recommends next moves. Does NOT mutate game state.
 */

import { z } from "zod";
import { buildOperationsAdvisorPrompt } from "./prompts/operations-advisor";
import { ai } from "./index";

export const operationsAdvisorSchema = z.object({
  currentSituationSummary: z.string(),
  topOperationalRisks: z.array(z.string()).max(5),
  missionGapAnalysis: z.string(),
  recommendedNextMoves: z.array(z.string()).max(8),
  recommendedHires: z.array(z.string()).max(5),
  spendingWarnings: z.array(z.string()).max(5),
  whatNotToDo: z.array(z.string()).max(5),
  next30DaysPlan: z.string(),
  next90DaysPlan: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(100),
});

export type OperationsAdvisorResult = z.infer<typeof operationsAdvisorSchema>;

export async function generateOperationsAdvisor(input: {
  startupName: string;
  sector: string;
  stage: string;
  classification: string;
  month: number;
  cash: number;
  monthlyBurn: number;
  revenue: number;
  runwayMonths: number;
  productProgress: number;
  investorScore: number;
  marketScore: number;
  riskScore: number;
  activeMissionTitle?: string;
  activeMissionCategory?: string;
  missionProgress: number;
  roleGaps: string[];
  teamSize: number;
  recentDecisions: string[];
  marketCondition: string;
  eventHistory: string[];
}): Promise<OperationsAdvisorResult> {
  const { system, prompt } = buildOperationsAdvisorPrompt(input);

  try {
    return await ai.generateStructured({
      system,
      prompt,
      schema: operationsAdvisorSchema,
      temperature: 0.5,
      maxTokens: 2000,
    });
  } catch {
    // Deterministic fallback
    return generateDeterministicAdvisor(input);
  }
}

export function generateDeterministicAdvisor(input: Parameters<typeof generateOperationsAdvisor>[0]): OperationsAdvisorResult {
  const risks: string[] = [];
  if (input.runwayMonths < 3) risks.push("Critical: Less than 3 months runway.");
  if (input.riskScore > 70) risks.push("High risk score may trigger crises.");
  if (input.productProgress < 30 && input.month > 4) risks.push("Product progress is behind schedule.");
  if (input.roleGaps.length > 0) risks.push(`Missing roles: ${input.roleGaps.join(", ")}.`);
  if (input.revenue < input.monthlyBurn * 0.5) risks.push("Revenue covers less than 50% of burn.");
  if (risks.length === 0) risks.push("Monitor burn and maintain product momentum.");

  const moves: string[] = [];
  if (input.runwayMonths < 4) moves.push("Reduce burn or prepare fundraising materials.");
  if (input.roleGaps.length > 0) moves.push(`Hire ${input.roleGaps[0]} to unblock mission progress.`);
  if (input.productProgress < 40) moves.push("Focus engineering on core product features.");
  if (input.riskScore > 60) moves.push("Invest in compliance or security.");
  if (input.revenue === 0 && input.month > 3) moves.push("Run customer interviews to validate pricing.");
  moves.push("Review monthly metrics and adjust priorities.");

  return {
    currentSituationSummary: `${input.startupName} is a ${input.stage} ${input.sector} startup at month ${input.month} with ${input.runwayMonths} months runway.`,
    topOperationalRisks: risks.slice(0, 3),
    missionGapAnalysis: input.roleGaps.length > 0
      ? `Mission progress is blocked by missing roles: ${input.roleGaps.join(", ")}.`
      : "Mission has adequate role coverage. Focus on execution.",
    recommendedNextMoves: moves.slice(0, 5),
    recommendedHires: input.roleGaps.slice(0, 3),
    spendingWarnings: input.runwayMonths < 4 ? ["Cut non-essential spend immediately."] : [],
    whatNotToDo: [
      "Do not hire ahead of runway.",
      "Do not launch before product is ready.",
    ],
    next30DaysPlan: "Execute active mission, monitor burn, and validate key assumptions.",
    next90DaysPlan: "Complete core missions, prepare for next funding round or revenue milestone.",
    reasoning: "Based on deterministic analysis of cash, runway, role gaps, and product progress.",
    confidence: 75,
  };
}
