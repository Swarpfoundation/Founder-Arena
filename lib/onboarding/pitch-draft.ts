export interface PitchDraftInput {
  name: string;
  sector: string;
  description: string;
  targetMarket: string;
  problem: string;
  solution: string;
  monetizationModel: string;
  unfairAdvantage: string;
  fundingAsk: number;
}

export interface PitchDraft {
  problem: string;
  solution: string;
  marketSize: string;
  product: string;
  businessModel: string;
  goToMarket: string;
  competition: string;
  team: string;
  financialPlan: string;
  ask: string;
  useOfFunds: string;
}

/**
 * Generate a deterministic pitch draft from startup fields.
 * No external AI call — pure template assembly with smart defaults.
 */
export function generatePitchDraft(input: PitchDraftInput): PitchDraft {
  const {
    name,
    sector,
    description,
    targetMarket,
    problem,
    solution,
    monetizationModel,
    unfairAdvantage,
    fundingAsk,
  } = input;

  const askFormatted = `$${fundingAsk.toLocaleString()}`;

  // Market size heuristic based on sector
  const marketSizeGuess = getMarketSizeGuess(sector);

  const problemDraft = `${problem}\n\nThis problem is especially acute for ${targetMarket}, who currently lack a purpose-built solution and resort to expensive workarounds or manual processes.`;

  const solutionDraft = `${solution}\n\n${name} is designed specifically for ${targetMarket}. By focusing on this segment first, we can deliver 10x better outcomes than horizontal alternatives.`;

  const marketSizeDraft = `Our total addressable market (TAM) is estimated at ${marketSizeGuess.tam}, driven by the growing demand for ${sector.toLowerCase()} solutions globally.\n\nOur serviceable addressable market (SAM) — ${targetMarket} — is approximately ${marketSizeGuess.sam}.\n\nWe believe our initial serviceable obtainable market (SOM) over the next 3 years is ${marketSizeGuess.som}, based on conservative adoption assumptions.`;

  const productDraft = `${name} is a ${sector.toLowerCase()} platform that ${description.toLowerCase().replace(/\.$/, "")}.\n\nKey features in the MVP:\n• Core workflow automation for ${targetMarket}\n• Analytics dashboard with actionable insights\n• Integrations with existing tools in the ${sector} stack\n• Mobile-responsive interface for on-the-go access\n\nOur product roadmap includes AI-powered enhancements, advanced reporting, and enterprise-grade security certifications.`;

  const businessModelDraft = `${monetizationModel}\n\nWe project reaching $20K MRR by month 9 and $50K MRR by month 18, with gross margins improving from 60% to 75% as we scale.`;

  const goToMarketDraft = `We will start narrow and expand:\n\n1. **Founder network** — leverage existing relationships with ${targetMarket} for the first 10 design partners.\n2. **Content & community** — publish sector-specific guides and host webinars to build trust.\n3. **Outbound** — targeted outreach to ${targetMarket} via LinkedIn and industry events.\n4. **Partnerships** — integrate with complementary tools to access their user bases.\n\nWe expect a sales cycle of 2-4 weeks for SMBs and 6-10 weeks for mid-market deals.`;

  const competitionDraft = `The ${sector} landscape includes both incumbents and emerging players:\n\n• **Incumbents**: Large horizontal platforms that are expensive and slow to innovate.\n• **Point solutions**: Narrow tools that solve one piece of the puzzle but require heavy integration.\n• **New entrants**: Other startups in the space, most of whom lack our ${unfairAdvantage.toLowerCase().replace(/\.$/, "")}.\n\nOur moat comes from ${unfairAdvantage.toLowerCase().replace(/\.$/, "")}, giving us faster iteration cycles and deeper customer empathy than well-funded generalists.`;

  const teamDraft = `Our founding team brings deep domain expertise in ${sector}:\n\n${unfairAdvantage}\n\nWe are actively recruiting a senior engineer and a growth lead to accelerate product development and GTM execution.`;

  const financialPlanDraft = `Over the next 12 months, we project:\n\n• Month 3: First paying customers, $2K MRR\n• Month 6: $8K MRR, 15 active customers\n• Month 9: $20K MRR, 40 customers, first hire\n• Month 12: $40K MRR, 80 customers, runway to Series A\n\nUnit economics target: CAC payback within 8 months, LTV/CAC ratio > 3x.`;

  const askDraft = `We are raising ${askFormatted} in a seed round to fund 18 months of runway.`;

  const useOfFundsDraft = `The ${askFormatted} will be allocated as follows:\n\n• 40% Product & Engineering — build core platform and AI features\n• 30% Sales & Marketing — GTM execution and customer acquisition\n• 20% Operations & Compliance — legal, finance, and sector-specific certifications\n• 10% Reserve — contingency and opportunistic hires\n\nThis capital gets us to $40K MRR and positions us for a Series A raise.`;

  return {
    problem: problemDraft,
    solution: solutionDraft,
    marketSize: marketSizeDraft,
    product: productDraft,
    businessModel: businessModelDraft,
    goToMarket: goToMarketDraft,
    competition: competitionDraft,
    team: teamDraft,
    financialPlan: financialPlanDraft,
    ask: askDraft,
    useOfFunds: useOfFundsDraft,
  };
}

function getMarketSizeGuess(sector: string): { tam: string; sam: string; som: string } {
  const defaults = { tam: "$50B+", sam: "$5B", som: "$50M" };
  const map: Record<string, { tam: string; sam: string; som: string }> = {
    "AI / ML": { tam: "$150B+", sam: "$15B", som: "$150M" },
    Fintech: { tam: "$300B+", sam: "$30B", som: "$200M" },
    Healthtech: { tam: "$400B+", sam: "$40B", som: "$250M" },
    SaaS: { tam: "$200B+", sam: "$20B", som: "$150M" },
    Consumer: { tam: "$1T+", sam: "$50B", som: "$300M" },
    Enterprise: { tam: "$500B+", sam: "$50B", som: "$300M" },
    Climate: { tam: "$100B+", sam: "$10B", som: "$100M" },
    "E-commerce": { tam: "$5T+", sam: "$100B", som: "$500M" },
    EdTech: { tam: "$300B+", sam: "$20B", som: "$150M" },
    Other: defaults,
  };
  return map[sector] ?? defaults;
}

export const PITCH_QUALITY_HINTS: Record<string, string> = {
  problem: "Be specific. Name the exact customer, the exact pain, and the current workaround.",
  solution: "Explain how you solve it differently from alternatives. Include one concrete use case.",
  marketSize: "Name a buyer and a budget. Show TAM → SAM → SOM with realistic bottoms-up math.",
  product: "Describe what exists today vs. roadmap. Include one 'wow' feature.",
  businessModel: "Show how you make money, who pays, and what they pay. Include early unit economics if possible.",
  goToMarket: "Start narrow. Pick one channel and one segment first. Avoid 'we'll do everything'.",
  competition: "Map 2-3 real competitors on a 2x2 matrix. Explain your unfair advantage clearly.",
  team: "Highlight relevant experience. If pre-product, emphasize domain expertise and past wins.",
  financialPlan: "Show monthly milestones for 12 months. Include MRR, customers, and burn.",
  ask: "State round size, stage, and intended runway. Match the ask to the use-of-funds total.",
  useOfFunds: "Break down by category (product, sales, ops, reserve). Percentages build trust.",
};
