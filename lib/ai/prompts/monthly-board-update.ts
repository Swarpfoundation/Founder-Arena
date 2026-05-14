export function buildMonthlyBoardUpdatePrompt(input: {
  startupName: string;
  month: number;
  decisions: string[];
  cashBefore: number;
  cashAfter: number;
  burnRate: number;
  revenue: number;
  productProgress: number;
  marketCondition: string;
  eventTitle?: string;
  eventSummary?: string;
  sector: string;
}): { system: string; prompt: string } {
  const system =
    "You are a startup advisor and board member writing a monthly operations update. " +
    "Deterministic game math is authoritative. Do not invent exact data sources. " +
    "Output must be valid JSON matching the requested schema.";

  const change = input.cashAfter - input.cashBefore;
  const changeWord = change > 0 ? "up" : change < 0 ? "down" : "flat";

  const prompt = `Write a monthly board update for ${input.startupName} (Month ${input.month}) in the ${input.sector} sector.

Decisions Made: ${input.decisions.join(", ")}
Cash: $${input.cashBefore.toLocaleString()} → $${input.cashAfter.toLocaleString()} (${changeWord} $${Math.abs(change).toLocaleString()})
Burn Rate: $${input.burnRate.toLocaleString()}/month
Revenue: $${input.revenue.toLocaleString()}/month
Product Progress: ${input.productProgress}%
Market Condition: ${input.marketCondition}
${input.eventTitle ? `Event: ${input.eventTitle} — ${input.eventSummary ?? ""}` : ""}

Respond with JSON matching this schema:
{
  "boardUpdateTitle": string (punchy title, e.g. "Burn is under control but runway tightens"),
  "whatWentWell": string[] (2-3 bullets),
  "whatWentWrong": string[] (1-2 bullets),
  "investorReaction": string (1 sentence),
  "founderLesson": string (1 sentence),
  "nextMonthRecommendations": string[] (2-3 bullets),
  "riskAlerts": string[] (1-2 bullets),
  "conciseSummary": string (2-3 sentences, plain text)
}`;

  return { system, prompt };
}
