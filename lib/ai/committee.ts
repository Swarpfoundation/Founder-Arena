import { hashString } from "./hash";
import { INVESTOR_PERSONAS, type InvestorPersona } from "./personas";
import { committeeConsensusSchema, type CommitteeConsensus, type InvestorPersonaReview } from "./schemas";

function deterministicScore(seed: string, min: number, max: number): number {
  const hash = hashString(seed);
  return min + (hash % (max - min + 1));
}

function pickOne<T>(seed: string, items: T[]): T {
  return items[deterministicScore(seed, 0, items.length - 1)];
}

function computePersonaScore(
  persona: InvestorPersona,
  baseScores: Record<string, number>,
  seed: string
): number {
  let total = 0;
  let weightSum = 0;
  const biases = persona.scoringBias;

  for (const [key, base] of Object.entries(baseScores)) {
    const bias = biases[key as keyof typeof biases] ?? 0;
    const weight = 1 + Math.abs(bias) * 0.3;
    total += (base + bias * 3) * weight;
    weightSum += weight;
  }

  const raw = Math.round(total / weightSum);
  const noise = deterministicScore(seed + persona.id, -3, 3);
  return Math.max(0, Math.min(100, raw + noise));
}

function generatePersonaNote(
  persona: InvestorPersona,
  sector: string,
  score: number,
  seed: string
): string {
  const templates: Record<string, string[]> = {
    generalist: [
      "This fits a pattern I've seen work before.",
      "The market is large enough, but execution will be everything.",
      "Solid pitch, but I'm waiting to see traction metrics.",
      "Founder-market fit seems strong here.",
      "Could be interesting at the right valuation.",
    ],
    technical: [
      "The technical approach is sound and defensible.",
      "I have concerns about the depth of the IP moat.",
      "Engineering talent will make or break this.",
      "The architecture is elegant. I like what I see.",
      "Needs stronger technical differentiation to excite me.",
    ],
    fintech: [
      "Unit economics need more clarity before I'm comfortable.",
      "Regulatory risk is manageable if approached correctly.",
      "Recurring revenue model is a strong positive.",
      "I'd want to see audited financials before proceeding.",
      "The compliance strategy is well thought out.",
    ],
    growth: [
      "The growth story is compelling if the loops actually work.",
      "Brand positioning could be sharper.",
      "I love the viral potential here.",
      "CAC assumptions feel optimistic.",
      "This could scale fast with the right growth team.",
    ],
    cfo: [
      "Burn rate concerns me. Need a clearer path to efficiency.",
      "Margins look healthy. This is financially interesting.",
      "Capital efficiency is better than most deals I see.",
      "The payback period is too long for my taste.",
      "Show me the 24-month cash flow projection.",
    ],
    skeptic: [
      "I'm not convinced the market timing is right.",
      "Too many assumptions. What if the TAM is half the size?",
      "The downside scenario here is ugly.",
      "Founder experience doesn't match the ambition level.",
      "If this works, it works big. But that's a big if.",
    ],
  };

  const personTemplates = templates[persona.id] ?? templates.generalist;
  const note = pickOne(seed + persona.id, personTemplates);

  if (score >= 80) return `${note} Overall, I'm positively inclined.`;
  if (score >= 60) return `${note} I'm cautiously interested.`;
  if (score >= 40) return `${note} I have reservations.`;
  return `${note} I'm not convinced.`;
}

function stanceFromScore(score: number): InvestorPersonaReview["stance"] {
  if (score >= 80) return "strong_support";
  if (score >= 65) return "support";
  if (score >= 50) return "neutral";
  if (score >= 35) return "concerned";
  return "oppose";
}

function termsStanceFromSupport(support: number): CommitteeConsensus["termsStance"] {
  if (support >= 75) return "aggressive";
  if (support >= 55) return "standard";
  if (support >= 40) return "cautious";
  return "pass";
}

export function generateCommitteeReview(
  input: {
    startupName: string;
    sector: string;
    baseScores: {
      problem: number;
      solution: number;
      market: number;
      team: number;
      business: number;
    };
    decision: string;
  }
): CommitteeConsensus {
  const seed = `${input.startupName}-${input.sector}-${input.decision}`;
  const personas = INVESTOR_PERSONAS;

  const personaReviews: InvestorPersonaReview[] = personas.map((persona) => {
    const score = computePersonaScore(persona, input.baseScores, seed);
    return {
      personaId: persona.id,
      personaName: persona.name,
      score,
      note: generatePersonaNote(persona, input.sector, score, seed),
      stance: stanceFromScore(score),
      focusArea: persona.focusAreas[0] ?? "general",
    };
  });

  const supportLevel = Math.round(
    personaReviews.reduce((sum, p) => sum + p.score, 0) / personaReviews.length
  );

  const concerned = personaReviews.filter((p) => p.score < 60);
  const supportive = personaReviews.filter((p) => p.score >= 60);

  const mainObjections = concerned
    .slice(0, 3)
    .map((p) => `${p.personaName}: ${p.note}`);

  const whatWouldChangeTheirMind = concerned
    .slice(0, 3)
    .map(() =>
      pickOne(seed + "change", [
        "Show 3 months of paying customers.",
        "Bring on a technical co-founder with domain expertise.",
        "Demonstrate a 10x improvement over incumbents.",
        "Provide a detailed competitive teardown.",
        "Reduce burn by 30% with a clear path to profitability.",
        "Get a letter of intent from a strategic partner.",
      ])
    );

  const strongestSupportQuote =
    supportive.length > 0
      ? supportive.sort((a, b) => b.score - a.score)[0].note
      : "No strong supporters on the committee.";

  const strongestObjectionQuote =
    concerned.length > 0
      ? concerned.sort((a, b) => a.score - b.score)[0].note
      : "No major objections raised.";

  return committeeConsensusSchema.parse({
    supportLevel,
    mainObjections,
    whatWouldChangeTheirMind,
    termsStance: termsStanceFromSupport(supportLevel),
    strongestSupportQuote,
    strongestObjectionQuote,
    personaReviews,
  });
}
