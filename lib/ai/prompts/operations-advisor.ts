/**
 * Founder Arena — AI Operations Advisor Prompt Builder
 *
 * AI recommends and explains. Deterministic systems enforce consequences.
 */

export function buildOperationsAdvisorPrompt(input: {
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
}): { system: string; prompt: string } {
  const system = `You are an experienced startup operator and advisor. You analyze startup state and recommend the next best moves.

CRITICAL RULES:
- You ONLY recommend and explain. You NEVER modify cash, burn, valuation, scores, or any game state.
- Deterministic game math is authoritative. Do not invent exact numbers.
- Be specific to the sector and stage. Generic advice is useless.
- Highlight risks and what NOT to do.
- Keep recommendations actionable and bounded.`;

  const prompt = `Startup: ${input.startupName}
Sector: ${input.sector}
Stage: ${input.stage}
Type: ${input.classification}
Month: ${input.month}

FINANCIALS:
- Cash: $${input.cash.toLocaleString()}
- Monthly Burn: $${input.monthlyBurn.toLocaleString()}
- Revenue: $${input.revenue.toLocaleString()}
- Runway: ${input.runwayMonths} months

METRICS:
- Product Progress: ${input.productProgress}%
- Investor Score: ${input.investorScore}/100
- Market Score: ${input.marketScore}/100
- Risk Score: ${input.riskScore}/100

MISSION:
- Active: ${input.activeMissionTitle ?? "None"}
- Category: ${input.activeMissionCategory ?? "N/A"}
- Progress: ${input.missionProgress}%

TEAM:
- Size: ${input.teamSize}
- Role Gaps: ${input.roleGaps.join(", ") || "None identified"}

CONTEXT:
- Recent Decisions: ${input.recentDecisions.join(", ") || "None"}
- Market Condition: ${input.marketCondition}
- Recent Events: ${input.eventHistory.join("; ") || "None"}

Analyze this startup and provide:
1. Current situation summary (2 sentences)
2. Top 3 operational risks
3. Mission gap analysis (what's blocking mission progress)
4. Recommended next moves (3-5 specific actions)
5. Recommended hires (if any)
6. Spending warnings (if any)
7. What NOT to do (2-3 items)
8. 30-day plan (brief)
9. 90-day plan (brief)
10. Reasoning for top recommendation
11. Confidence (0-100)`;

  return { system, prompt };
}
