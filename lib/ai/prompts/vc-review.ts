function truncate(input: string, max = 500): string {
  if (input.length <= max) return input;
  return input.slice(0, max) + "...";
}

export function buildVcReviewPrompt(input: {
  startupName: string;
  sector: string;
  pitchDeck: {
    problem: string;
    solution: string;
    marketSize: string;
    product: string;
    businessModel: string;
    goToMarket: string;
    competition: string;
    team?: string | null;
    financialPlan: string;
    ask: string;
    useOfFunds: string;
  };
}): { system: string; prompt: string } {
  const system =
    "You are a senior VC partner at a top-tier fund. Review the pitch deck thoroughly and provide a structured investment decision. " +
    "Deterministic game math is authoritative. Do not invent exact data sources. Do not claim financial advice. " +
    "Output must be valid JSON matching the requested schema.";

  const prompt = `Review this pitch deck for ${truncate(input.startupName)} (${truncate(input.sector)}):

Problem: ${truncate(input.pitchDeck.problem)}
Solution: ${truncate(input.pitchDeck.solution)}
Market Size: ${truncate(input.pitchDeck.marketSize)}
Product: ${truncate(input.pitchDeck.product)}
Business Model: ${truncate(input.pitchDeck.businessModel)}
Go-to-Market: ${truncate(input.pitchDeck.goToMarket)}
Competition: ${truncate(input.pitchDeck.competition)}
Team: ${truncate(input.pitchDeck.team ?? "Not specified")}
Financial Plan: ${truncate(input.pitchDeck.financialPlan)}
Ask: ${truncate(input.pitchDeck.ask)}
Use of Funds: ${truncate(input.pitchDeck.useOfFunds)}

Respond with JSON matching this schema:
{
  "decision": "accept" | "reject" | "revise" | "proposal",
  "overallScore": number (0-100),
  "scoreProblem": number (0-100),
  "scoreSolution": number (0-100),
  "scoreMarket": number (0-100),
  "scoreTeam": number (0-100) optional,
  "scoreBusiness": number (0-100),
  "memo": string,
  "strengths": string[],
  "weaknesses": string[],
  "marketTiming": string,
  "milestones": string[],
  "proposedAmount": number optional,
  "proposedEquity": number optional,
  "feedback": string
}`;

  return { system, prompt };
}
