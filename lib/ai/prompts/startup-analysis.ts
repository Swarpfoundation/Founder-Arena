function truncate(input: string, max = 500): string {
  if (input.length <= max) return input;
  return input.slice(0, max) + "...";
}

export function buildStartupAnalysisPrompt(input: {
  name: string;
  description: string;
  sector: string;
  problem: string;
  solution: string;
  monetizationModel: string;
  fundingAsk: number;
}): { system: string; prompt: string } {
  const system =
    "You are an experienced startup analyst and seed investor. Analyze the startup idea and return structured scores and feedback. " +
    "Deterministic game math is authoritative. Do not invent exact data sources. " +
    "Output must be valid JSON matching the requested schema.";

  const prompt = `Analyze this startup idea:
Name: ${truncate(input.name)}
Sector: ${truncate(input.sector)}
Description: ${truncate(input.description)}
Problem: ${truncate(input.problem)}
Solution: ${truncate(input.solution)}
Business Model: ${truncate(input.monetizationModel)}
Funding Ask: $${input.fundingAsk.toLocaleString()}

Respond with JSON matching this schema:
{
  "overallScore": number (0-100),
  "investorScore": number (0-100),
  "marketScore": number (0-100),
  "riskScore": number (0-100),
  "timingScore": number (0-100),
  "summary": string,
  "marketTiming": string,
  "risks": string[],
  "strengths": string[],
  "initialValuationEstimate": number
}`;

  return { system, prompt };
}
