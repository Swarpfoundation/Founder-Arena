export function buildMarketAnalystPrompt(input: {
  condition: string;
  scenarioKey?: string | null;
  description: string;
  macroScores?: Record<string, number> | null;
  sectorTrends?: Record<string, number> | null;
  topSignals?: Array<{ title: string; direction: string; severity: number }>;
  sourceMode: string;
}): { system: string; prompt: string } {
  const system =
    "You are a market intelligence analyst writing a brief for startup founders. " +
    "Current game market snapshot indicates conditions only. This is not financial advice. " +
    "Do not claim exact real-time data. Do not invent specific sources. " +
    "Deterministic game math is authoritative. Output must be valid JSON.";

  const macroLines = input.macroScores
    ? Object.entries(input.macroScores)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
    : "No macro scores available.";

  const sectorLines = input.sectorTrends
    ? Object.entries(input.sectorTrends)
        .filter(([k]) => k !== "default")
        .map(([k, v]) => `${k}: ${v > 1 ? "hot" : v < 1 ? "cold" : "neutral"} (${v})`)
        .join("\n")
    : "No sector trends available.";

  const signalLines = input.topSignals?.length
    ? input.topSignals.map((s) => `- ${s.title} (${s.direction}, severity ${s.severity})`).join("\n")
    : "No signals available.";

  const prompt = `Generate a market analyst brief based on the current game market snapshot.

Condition: ${input.condition}
Scenario: ${input.scenarioKey ?? "unknown"}
Description: ${input.description}
Source Mode: ${input.sourceMode}

Macro Scores:
${macroLines}

Sector Trends:
${sectorLines}

Top Signals:
${signalLines}

Respond with JSON matching this schema:
{
  "executiveBrief": string (2-3 sentences),
  "hotSectors": string[] (max 5),
  "coldSectors": string[] (max 5),
  "investorClimate": string (1 sentence),
  "riskWatchlist": string[] (max 5),
  "opportunityMap": string[] (max 5),
  "confidence": number (0-100),
  "limitations": string[],
  "gameplayNote": string (brief note on how this affects simulation)
}`;

  return { system, prompt };
}
