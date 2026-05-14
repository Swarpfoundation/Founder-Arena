export interface InvestorPersona {
  id: string;
  name: string;
  role: string;
  investmentStyle: string;
  prefers: string[];
  dislikes: string[];
  scoringBias: {
    problem?: number;
    solution?: number;
    market?: number;
    team?: number;
    business?: number;
  };
  focusAreas: string[];
  tone: string;
}

export const INVESTOR_PERSONAS: InvestorPersona[] = [
  {
    id: "generalist",
    name: "Alex Chen",
    role: "Generalist VC Partner",
    investmentStyle: "Pattern-matching across sectors. Looks for exceptional founders in large markets.",
    prefers: ["Big TAM", "Strong founder-market fit", "Clear traction path"],
    dislikes: ["Niche markets", "Weak go-to-market", "Feature-not-product startups"],
    scoringBias: { problem: 0, solution: 0, market: 2, team: 3, business: 1 },
    focusAreas: ["market size", "founder quality", "traction"],
    tone: "Direct but fair. Uses pattern recognition from 50+ investments.",
  },
  {
    id: "technical",
    name: "Dr. Sarah Nakamura",
    role: "Technical Deeptech Partner",
    investmentStyle: "Deep technical diligence. Values IP, defensibility, and engineering rigor.",
    prefers: ["Technical moats", "IP portfolio", "Hard engineering problems"],
    dislikes: ["Shallow tech stacks", "Copycat products", "No defensibility"],
    scoringBias: { problem: 1, solution: 4, market: 0, team: 2, business: -1 },
    focusAreas: ["technical architecture", "IP defensibility", "engineering depth"],
    tone: "Analytical and precise. Asks hard technical questions.",
  },
  {
    id: "fintech",
    name: "Marcus Webb",
    role: "Fintech & Regulatory Partner",
    investmentStyle: "Regulatory-aware. Loves compliance moats and unit economics clarity.",
    prefers: ["Regulatory moats", "Clear unit economics", "Recurring revenue"],
    dislikes: ["Regulatory ambiguity", "Unclear monetization", "High CAC"],
    scoringBias: { problem: 1, solution: 0, market: 1, team: 0, business: 4 },
    focusAreas: ["unit economics", "regulatory risk", "capital efficiency"],
    tone: "Cautious and numbers-driven. Always checks the footnotes.",
  },
  {
    id: "growth",
    name: "Priya Sharma",
    role: "Growth & Consumer Partner",
    investmentStyle: "Growth-stage focus. Obsesses over CAC/LTV, viral loops, and brand.",
    prefers: ["Viral growth", "Strong brand", "Low CAC channels"],
    dislikes: ["High acquisition costs", "Weak retention", "B2B complexity"],
    scoringBias: { problem: 0, solution: 1, market: 3, team: 1, business: 2 },
    focusAreas: ["growth mechanics", "brand positioning", "customer love"],
    tone: "Energetic and market-savvy. Thinks in funnels and loops.",
  },
  {
    id: "cfo",
    name: "James Roth",
    role: "CFO & Unit Economics Partner",
    investmentStyle: "Financial rigor. Path to profitability and capital efficiency above all.",
    prefers: ["Capital efficiency", "Clear margins", "Short payback periods"],
    dislikes: ["Burn-heavy models", "Unclear path to profit", "Complex cap tables"],
    scoringBias: { problem: 0, solution: -1, market: 0, team: 0, business: 5 },
    focusAreas: ["burn rate", "margins", "path to profitability"],
    tone: "Skeptical of hype. Wants to see the spreadsheet.",
  },
  {
    id: "skeptic",
    name: "Elena Volkov",
    role: "Skeptical Risk Partner",
    investmentStyle: "Downside-focused. Stress-tests every assumption. Often the dissenting voice.",
    prefers: ["Conservative projections", "Proven markets", "Experienced founders"],
    dislikes: ["Hype cycles", "Unproven markets", "Overly optimistic forecasts"],
    scoringBias: { problem: 2, solution: -2, market: -2, team: 1, business: 1 },
    focusAreas: ["downside risk", "market timing", "execution risk"],
    tone: "Tough and contrarian. The voice you need when everyone else is excited.",
  },
];

export function getPersonaById(id: string): InvestorPersona | undefined {
  return INVESTOR_PERSONAS.find((p) => p.id === id);
}
