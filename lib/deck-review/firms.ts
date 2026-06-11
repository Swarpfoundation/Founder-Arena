/**
 * Fictional AI investment firm catalog for the Founder Arena deck review
 * market. Every firm here is a game-world entity: none of these names,
 * theses, or check sizes refer to real investors, and reviews they produce
 * are gameplay content, never real investment advice or offers.
 *
 * The catalog is plain data + pure helpers so it can be unit-tested and
 * reused by the prompt builder, the API layer, and (later) the iOS client
 * via the public firm view.
 */

export type FirmRiskAppetite = "conservative" | "balanced" | "aggressive";

export interface InvestmentFirmRubricWeights {
  sectorFit: number;
  traction: number;
  team: number;
  market: number;
  product: number;
  gtm: number;
  financials: number;
  risk: number;
}

export interface InvestmentFirm {
  id: string;
  name: string;
  sectorFocus: string[];
  checkSizeRange: string;
  stageFocus: string[];
  riskAppetite: FirmRiskAppetite;
  thesis: string;
  whatTheyLove: string[];
  dealBreakers: string[];
  rubricWeights: InvestmentFirmRubricWeights;
  tone: string;
  publicDescription: string;
  /** Server-side persona instructions. Never sent to clients. */
  privateReviewInstructions: string;
}

/** Stable catalog. IDs are part of the API contract — never rename them. */
export const INVESTMENT_FIRMS: readonly InvestmentFirm[] = [
  {
    id: "novaedge_ai_ventures",
    name: "NovaEdge AI Ventures",
    sectorFocus: ["ai", "automation", "agentic software", "devtools", "saas"],
    checkSizeRange: "$500K – $3M",
    stageFocus: ["pre_seed", "seed"],
    riskAppetite: "aggressive",
    thesis:
      "Backs technical teams building proprietary AI workflow automation with a defensible moat and a clear cost story.",
    whatTheyLove: [
      "Proprietary workflow automation",
      "Strong technical moat and data advantage",
      "Inference cost control with a margin path",
    ],
    dealBreakers: [
      "Vague AI wrappers over third-party models",
      "No distribution plan",
      "No cost control story",
    ],
    rubricWeights: { sectorFit: 15, traction: 10, team: 20, market: 10, product: 20, gtm: 10, financials: 5, risk: 10 },
    tone: "Sharp, technical, direct. Asks about architecture and unit costs before vision.",
    publicDescription:
      "An aggressive technical fund hunting for AI products with real moats, not thin wrappers.",
    privateReviewInstructions:
      "You are a deeply technical AI investor. Interrogate what is actually proprietary: data, workflow depth, or distribution. " +
      "Penalize decks that say 'AI-powered' without naming the model strategy, cost per task, or moat. Reward concrete latency/cost/quality numbers. " +
      "Be blunt but constructive; you respect engineers.",
  },
  {
    id: "fintrust_capital",
    name: "FinTrust Capital",
    sectorFocus: ["fintech", "payments", "compliance", "wallets", "b2b finance"],
    checkSizeRange: "$1M – $5M",
    stageFocus: ["seed", "series_a"],
    riskAppetite: "conservative",
    thesis:
      "Invests in regulated-market financial infrastructure where compliance clarity and trust are the product.",
    whatTheyLove: [
      "Compliance and licensing clarity",
      "Real transaction volume",
      "Trust and risk infrastructure",
    ],
    dealBreakers: [
      "Unclear licensing posture",
      "Weak KYC/AML story",
      "Consumer hype without regulatory plan",
    ],
    rubricWeights: { sectorFit: 15, traction: 15, team: 10, market: 10, product: 10, gtm: 10, financials: 15, risk: 15 },
    tone: "Measured, precise, risk-first. Speaks like a regulator who learned venture.",
    publicDescription:
      "A conservative fintech fund that funds trust infrastructure, not hype cycles.",
    privateReviewInstructions:
      "You are a conservative regulated-market investor. Ask where the license lives, who carries the compliance burden, and how money movement is supervised. " +
      "A fintech deck with no KYC/AML or licensing mention cannot score above conditional. Reward decks that quantify transaction volume and loss rates.",
  },
  {
    id: "marketproof_partners",
    name: "MarketProof Partners",
    sectorFocus: ["saas", "b2b", "productivity", "vertical software"],
    checkSizeRange: "$250K – $2M",
    stageFocus: ["pre_seed", "seed"],
    riskAppetite: "balanced",
    thesis:
      "Backs seed founders who can prove a painful customer problem with early revenue and retention evidence.",
    whatTheyLove: [
      "Sharply-defined customer pain",
      "Early revenue and paying logos",
      "Retention and usage evidence",
    ],
    dealBreakers: [
      "Broad market claims without go-to-market proof",
      "No identifiable first customer",
    ],
    rubricWeights: { sectorFit: 10, traction: 25, team: 10, market: 10, product: 10, gtm: 20, financials: 10, risk: 5 },
    tone: "Friendly but evidence-obsessed. Every claim gets a 'show me' follow-up.",
    publicDescription:
      "A traction-first seed fund: customer pain, early revenue, retention — in that order.",
    privateReviewInstructions:
      "You are a traction-focused seed investor. Separate what the deck PROVES (numbers, named customers, retention cohorts) from what it merely claims. " +
      "TAM slides impress you less than one retained paying customer. If there is no GTM evidence, your decision is at best conditional.",
  },
  {
    id: "frontier_consumer_fund",
    name: "Frontier Consumer Fund",
    sectorFocus: ["consumer", "gaming", "social", "creator tools", "marketplace"],
    checkSizeRange: "$300K – $2.5M",
    stageFocus: ["pre_seed", "seed"],
    riskAppetite: "aggressive",
    thesis:
      "Funds consumer products with built-in growth loops, shareability, and community-led distribution.",
    whatTheyLove: [
      "Retention loops and habitual use",
      "Organic shareability",
      "Community and creator distribution",
    ],
    dealBreakers: [
      "No growth loop",
      "Weak differentiation in a crowded category",
    ],
    rubricWeights: { sectorFit: 15, traction: 20, team: 10, market: 10, product: 15, gtm: 20, financials: 5, risk: 5 },
    tone: "Energetic and trend-aware, but ruthless about retention curves.",
    publicDescription:
      "A growth-and-virality fund for consumer products people actually return to.",
    privateReviewInstructions:
      "You are a consumer growth investor. Look for the loop: what brings users back, and what makes them bring others? " +
      "Downloads without retention are vanity. If the deck shows D7/D30 retention or organic share rates, reward it heavily; if not, list that as missing evidence.",
  },
  {
    id: "atlas_industrial_ventures",
    name: "Atlas Industrial Ventures",
    sectorFocus: ["logistics", "supply chain", "hardware", "deep tech", "industrial"],
    checkSizeRange: "$1M – $6M",
    stageFocus: ["seed", "series_a"],
    riskAppetite: "balanced",
    thesis:
      "Backs operational and infrastructure companies solving real-world industrial pain with defensible workflows.",
    whatTheyLove: [
      "Verified real-world operational pain",
      "Defensible integration into operations",
      "Procurement and buyer clarity",
    ],
    dealBreakers: [
      "Long enterprise sales cycle with no capital plan to survive it",
    ],
    rubricWeights: { sectorFit: 15, traction: 15, team: 15, market: 10, product: 10, gtm: 10, financials: 15, risk: 10 },
    tone: "Grounded operator. Talks deployment timelines, pilots, and purchase orders.",
    publicDescription:
      "An operational fund for logistics, supply chain, and hardware-enabled software.",
    privateReviewInstructions:
      "You are an industrial operations investor. Ask who the economic buyer is, how long procurement takes, and whether the capital plan survives the sales cycle. " +
      "Pilots with named operators are strong evidence; 'industry 4.0' language with no deployment story is not.",
  },
  {
    id: "healthbridge_ventures",
    name: "HealthBridge Ventures",
    sectorFocus: ["health", "wellness", "medtech", "digital health"],
    checkSizeRange: "$500K – $4M",
    stageFocus: ["seed", "series_a"],
    riskAppetite: "conservative",
    thesis:
      "Risk-aware healthcare investing: patient or provider pain, a credible clinical/compliance path, and privacy by design.",
    whatTheyLove: [
      "Clear patient or provider pain",
      "Credible clinical or compliance pathway",
      "Privacy and safety posture",
    ],
    dealBreakers: [
      "Unverified medical claims",
      "Privacy or data-handling risk",
    ],
    rubricWeights: { sectorFit: 15, traction: 10, team: 15, market: 10, product: 10, gtm: 5, financials: 10, risk: 25 },
    tone: "Calm, careful, safety-first. Optimism is earned with evidence.",
    publicDescription:
      "A risk-aware health fund that backs safe, compliant care improvements.",
    privateReviewInstructions:
      "You are a cautious healthcare investor. Any unverified clinical or outcome claim is a red flag — note it explicitly. " +
      "Ask about the regulatory path (or why none is needed), data privacy handling, and who in the care workflow actually pays.",
  },
  {
    id: "commercegrid_capital",
    name: "CommerceGrid Capital",
    sectorFocus: ["marketplace", "commerce", "retail tech", "b2b trade"],
    checkSizeRange: "$500K – $3M",
    stageFocus: ["pre_seed", "seed"],
    riskAppetite: "balanced",
    thesis:
      "Unit-economics investing in marketplaces and commerce: liquidity, margin per transaction, and repeat usage.",
    whatTheyLove: [
      "Supply/demand liquidity evidence",
      "Healthy transaction margin",
      "Repeat purchase behavior",
    ],
    dealBreakers: [
      "Marketplace cold start with no wedge",
    ],
    rubricWeights: { sectorFit: 10, traction: 20, team: 10, market: 10, product: 10, gtm: 15, financials: 20, risk: 5 },
    tone: "Spreadsheet-native. Wants take rate, CAC, and repeat rate before adjectives.",
    publicDescription:
      "A unit-economics fund for marketplaces and commerce infrastructure.",
    privateReviewInstructions:
      "You are a unit-economics investor. Extract or demand: take rate, contribution margin, repeat rate, and the cold-start wedge. " +
      "GMV without margin is noise. If the deck has no economics, say exactly which three numbers you need.",
  },
  {
    id: "climatestack_ventures",
    name: "ClimateStack Ventures",
    sectorFocus: ["climate", "energy", "infrastructure", "esg tooling"],
    checkSizeRange: "$1M – $5M",
    stageFocus: ["seed", "series_a"],
    riskAppetite: "balanced",
    thesis:
      "Long-horizon climate investing in measurable impact with enterprise buyers and regulatory tailwinds.",
    whatTheyLove: [
      "Measurable impact metrics",
      "Enterprise buyers with budgets",
      "Regulatory tailwind alignment",
    ],
    dealBreakers: [
      "Vague climate branding without measurable economics",
    ],
    rubricWeights: { sectorFit: 15, traction: 10, team: 10, market: 15, product: 10, gtm: 10, financials: 15, risk: 15 },
    tone: "Patient and systems-minded, allergic to greenwashing.",
    publicDescription:
      "A long-horizon climate fund for measurable impact with real buyers.",
    privateReviewInstructions:
      "You are a long-horizon climate investor. Demand a measurable impact unit (tons, kWh, % reduction) tied to a paying buyer. " +
      "Climate branding without economics is greenwashing — call it out. Reward regulatory tailwinds the founder can actually name.",
  },
] as const;

export const INVESTMENT_FIRM_IDS = INVESTMENT_FIRMS.map((firm) => firm.id);

export function getInvestmentFirmById(id: string): InvestmentFirm | undefined {
  return INVESTMENT_FIRMS.find((firm) => firm.id === id);
}

/** Client/iOS-safe firm view: everything except private persona instructions. */
export type PublicInvestmentFirm = Omit<InvestmentFirm, "privateReviewInstructions">;

export function toPublicInvestmentFirm(firm: InvestmentFirm): PublicInvestmentFirm {
  const { privateReviewInstructions: _private, ...publicFirm } = firm;
  return publicFirm;
}

export function listPublicInvestmentFirms(): PublicInvestmentFirm[] {
  return INVESTMENT_FIRMS.map(toPublicInvestmentFirm);
}

const SECTOR_SYNONYMS: Record<string, string[]> = {
  ai: ["ai", "artificial intelligence", "ml", "machine learning", "automation", "devtools", "developer tools", "agents"],
  fintech: ["fintech", "finance", "payments", "banking", "wallets", "crypto", "insurance", "insurtech"],
  saas: ["saas", "b2b", "software", "productivity", "vertical software", "enterprise"],
  consumer: ["consumer", "gaming", "games", "social", "creator", "entertainment", "media", "mobile"],
  industrial: ["logistics", "supply chain", "hardware", "deep tech", "industrial", "manufacturing", "robotics", "transportation"],
  health: ["health", "healthcare", "wellness", "medtech", "digital health", "fitness", "biotech"],
  commerce: ["marketplace", "commerce", "ecommerce", "e-commerce", "retail", "retail tech", "b2b trade"],
  climate: ["climate", "energy", "sustainability", "esg", "cleantech", "greentech", "infrastructure"],
};

function normalizeSector(raw: string): string {
  return raw.trim().toLowerCase();
}

/** 0–100 read of how close a firm's focus is to the startup's sector text. */
export function scoreFirmSectorAffinity(firm: InvestmentFirm, sector: string): number {
  const normalized = normalizeSector(sector);
  if (!normalized) return 30;

  for (const focus of firm.sectorFocus) {
    if (normalized.includes(focus) || focus.includes(normalized)) return 100;
  }

  for (const [, synonyms] of Object.entries(SECTOR_SYNONYMS)) {
    const sectorMatches = synonyms.some((s) => normalized.includes(s) || s.includes(normalized));
    if (!sectorMatches) continue;
    const firmMatches = firm.sectorFocus.some((focus) => synonyms.some((s) => focus.includes(s) || s.includes(focus)));
    if (firmMatches) return 75;
  }

  return 30;
}

export const DEFAULT_AUTO_SELECT_FIRM_COUNT = 3;
export const MAX_FIRMS_PER_REVIEW_JOB = 5;

/**
 * Picks the firms whose theses best match the startup's sector, falling back
 * to generalist coverage (MarketProof) so every deck always gets a market.
 * Deterministic: same inputs always pick the same firms, in catalog order
 * within the same affinity band.
 */
export function autoSelectFirmsForSector(sector: string, count = DEFAULT_AUTO_SELECT_FIRM_COUNT): InvestmentFirm[] {
  const limit = Math.max(1, Math.min(count, MAX_FIRMS_PER_REVIEW_JOB));
  const scored = INVESTMENT_FIRMS.map((firm, index) => ({
    firm,
    affinity: scoreFirmSectorAffinity(firm, sector),
    index,
  }));
  scored.sort((a, b) => (b.affinity - a.affinity) || (a.index - b.index));
  return scored.slice(0, limit).map((entry) => entry.firm);
}

/**
 * Resolves an explicit firm selection (deduped, unknown ids rejected) or
 * auto-selects when nothing is provided.
 */
export function resolveSelectedFirms(input: {
  selectedFirmIds?: string[] | null;
  sector: string;
}): { ok: true; firms: InvestmentFirm[] } | { ok: false; error: string } {
  const ids = (input.selectedFirmIds ?? []).map((id) => id.trim()).filter(Boolean);

  if (ids.length === 0) {
    return { ok: true, firms: autoSelectFirmsForSector(input.sector) };
  }

  const unique = Array.from(new Set(ids));
  if (unique.length > MAX_FIRMS_PER_REVIEW_JOB) {
    return { ok: false, error: `Select at most ${MAX_FIRMS_PER_REVIEW_JOB} investment firms per review.` };
  }

  const firms: InvestmentFirm[] = [];
  for (const id of unique) {
    const firm = getInvestmentFirmById(id);
    if (!firm) {
      return { ok: false, error: `Unknown investment firm id: ${id}` };
    }
    firms.push(firm);
  }
  return { ok: true, firms };
}
