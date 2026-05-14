import { hashString } from "./hash";
import { marketAnalystNarrativeSchema, type MarketAnalystNarrative } from "./schemas";

function deterministicScore(seed: string, min: number, max: number): number {
  const hash = hashString(seed);
  return min + (hash % (max - min + 1));
}

function pickOne<T>(seed: string, items: T[]): T {
  return items[deterministicScore(seed, 0, items.length - 1)];
}

function pickN<T>(seed: string, items: T[], n: number): T[] {
  const result: T[] = [];
  const idx = deterministicScore(seed, 0, items.length - 1);
  for (let i = 0; i < Math.min(n, items.length); i++) {
    result.push(items[(idx + i) % items.length]);
  }
  return result;
}

export function generateDeterministicMarketNarrative(
  snapshot: {
    condition: string;
    scenarioKey?: string | null;
    description: string;
    sectorTrends?: unknown;
    metadata?: unknown;
  },
  _signals?: Array<{ title: string; direction: string }>
): MarketAnalystNarrative {
  const seed = `${snapshot.condition}-${snapshot.scenarioKey ?? "neutral"}`;
  const condition = snapshot.condition;
  const isBullish = condition === "bullish";
  const isBearish = condition === "bearish";

  const hotPool = ["AI / ML", "Climate Tech", "Fintech", "Health Tech", "Cybersecurity", "SaaS"];
  const coldPool = ["Consumer Social", "Crypto", "Traditional Retail", "Ad Tech", "Gaming"];
  const riskPool = [
    "Rising interest rates affecting VC deployment",
    "Geopolitical uncertainty impacting supply chains",
    "Regulatory scrutiny on AI applications",
    "Talent shortage in key engineering roles",
    "Inflation pressure on consumer spending",
  ];
  const oppPool = [
    "AI tooling creating new startup categories",
    "Enterprise digital transformation accelerating",
    "Climate incentives driving green tech demand",
    "Remote work tools still expanding globally",
    "Healthcare data interoperability opening markets",
  ];

  const hotSectors = isBullish
    ? pickN(seed + "hot", hotPool, 3)
    : isBearish
    ? pickN(seed + "hot", hotPool, 1)
    : pickN(seed + "hot", hotPool, 2);

  const coldSectors = isBearish
    ? pickN(seed + "cold", coldPool, 3)
    : isBullish
    ? pickN(seed + "cold", coldPool, 1)
    : pickN(seed + "cold", coldPool, 2);

  const riskWatchlist = pickN(seed + "risk", riskPool, 3);
  const opportunityMap = pickN(seed + "opp", oppPool, 3);

  const confidence = isBullish || isBearish ? deterministicScore(seed + "conf", 65, 90) : deterministicScore(seed + "conf", 50, 75);

  const briefTemplates = {
    bullish: [
      `The current game market snapshot indicates strong tailwinds. Capital is flowing freely and valuations remain elevated. ${snapshot.description}`,
      `Founders are operating in a favorable climate. Investor appetite is high and deal velocity is accelerating. ${snapshot.description}`,
    ],
    bearish: [
      `The current game market snapshot indicates headwinds. Capital is constrained and investors are prioritizing profitability over growth. ${snapshot.description}`,
      `A challenging environment requires disciplined execution. Runway extension and capital efficiency are paramount. ${snapshot.description}`,
    ],
    neutral: [
      `The current game market snapshot indicates balanced conditions. Selective investors are backing strong fundamentals. ${snapshot.description}`,
      `Mixed signals define the current landscape. Sector selection matters more than macro momentum. ${snapshot.description}`,
    ],
  };

  const investorClimateTemplates = {
    bullish: "Investors are aggressive and competition for deals is high.",
    bearish: "Investors are cautious and diligence cycles have lengthened.",
    neutral: "Investors are selective but active for the right opportunities.",
  };

  const executiveBrief = pickOne(seed + "brief", briefTemplates[isBullish ? "bullish" : isBearish ? "bearish" : "neutral"]);
  const investorClimate = investorClimateTemplates[isBullish ? "bullish" : isBearish ? "bearish" : "neutral"];

  return marketAnalystNarrativeSchema.parse({
    executiveBrief,
    hotSectors,
    coldSectors,
    investorClimate,
    riskWatchlist,
    opportunityMap,
    confidence,
    limitations: [
      "Market signals are aggregated for gameplay, not real-time financial analysis.",
      "Sector trends are simplified approximations.",
      "External provider data may be incomplete or delayed.",
    ],
    gameplayNote: "Market conditions affect simulation through bounded modifiers. Strong tailwinds boost revenue and valuation; headwinds increase burn pressure and reduce investor appetite.",
  });
}
