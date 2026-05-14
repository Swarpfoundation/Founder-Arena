import { z } from "zod";
import { AIProvider, GenerateOptions } from "./ai-provider";
import {
  StartupAnalysis,
  startupAnalysisSchema,
  VcReviewResult,
  vcReviewSchema,
  CommitteeConsensus,
  MarketAnalystNarrative,
  MonthlyBoardUpdate,
  monthlyBoardUpdateSchema,
  FounderCoachingNote,
  founderCoachingNoteSchema,
} from "./schemas";
import { generateCommitteeReview } from "./committee";
import { generateDeterministicMarketNarrative } from "./market-analyst";
import { hashString } from "./hash";

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

const SECTOR_RISKS: Record<string, string[]> = {
  fintech: ["Regulatory compliance", "Banking partnerships", "Fraud prevention", "Interest rate exposure"],
  health: ["FDA/regulatory approval", "Patient privacy (HIPAA)", "Clinical validation", "Reimbursement complexity"],
  climate: ["Policy dependency", "Capital intensity", "Supply chain scaling", "Customer willingness to pay"],
  saas: ["Customer churn", "Sales cycle length", "Feature parity competition", "Platform dependency"],
  consumer: ["CAC inflation", "Retention cliffs", "Viral decay", "Platform algorithm changes"],
  deeptech: ["Technical risk", "Long development cycles", "Talent scarcity", "IP infringement"],
  default: ["Execution risk", "Market competition", "Funding runway", "Team cohesion"],
};

const SECTOR_STRENGTHS: Record<string, string[]> = {
  fintech: ["Recurring revenue potential", "Regulatory moats", "Network effects", "Data advantages"],
  health: ["Mission-driven team", "Clinical need validation", "Regulatory barriers to entry", "Long-term contracts"],
  climate: ["Policy tailwinds", "Corporate ESG demand", "Defensible IP", "Impact alignment"],
  saas: ["Scalable margins", "Land-and-expand model", "Product-led growth", "API ecosystem"],
  consumer: ["Viral potential", "Brand love", "Network effects", "Low marginal cost"],
  deeptech: ["Technical moats", "IP portfolio", "Hard to replicate", "Talent magnet"],
  default: ["Clear problem statement", "Defined target market", "Strong founder vision", "Differentiated approach"],
};

export class MockProvider implements AIProvider {
  async generateText(options: GenerateOptions): Promise<string> {
    return `[MOCK AI] ${options.prompt.slice(0, 80)}...`;
  }

  async generateStructured<T extends z.ZodTypeAny>(
    options: GenerateOptions & { schema: T }
  ): Promise<z.infer<T>> {
    function mockFor(schema: z.ZodTypeAny): unknown {
      if (schema instanceof z.ZodString) return "mock";
      if (schema instanceof z.ZodNumber) return 0;
      if (schema instanceof z.ZodBoolean) return false;
      if (schema instanceof z.ZodArray) return [];
      if (schema instanceof z.ZodObject) {
        const obj: Record<string, unknown> = {};
        const shape = schema.shape as Record<string, z.ZodTypeAny>;
        for (const [k, v] of Object.entries(shape)) {
          obj[k] = mockFor(v);
        }
        return obj;
      }
      if (schema instanceof z.ZodEnum) return schema.options[0];
      if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
        return mockFor(schema.unwrap());
      }
      if (schema instanceof z.ZodDefault) {
        return schema._def.defaultValue();
      }
      if (schema instanceof z.ZodUnion) {
        return mockFor(schema.options[0]);
      }
      if (schema instanceof z.ZodLiteral) {
        return schema.value;
      }
      return null;
    }

    const mockData = mockFor(options.schema);
    return options.schema.parse(mockData);
  }

  async analyzeStartupIdea(input: {
    name: string;
    description: string;
    sector: string;
    problem: string;
    solution: string;
    monetizationModel: string;
    fundingAsk: number;
  }): Promise<StartupAnalysis> {
    const seed = input.name + input.sector;
    const sectorKey = input.sector.toLowerCase();
    const overallScore = deterministicScore(seed + "overall", 50, 85);
    const investorScore = deterministicScore(seed + "investor", 45, 80);
    const marketScore = deterministicScore(seed + "market", 40, 85);
    const riskScore = deterministicScore(seed + "risk", 20, 60);
    const timingScore = deterministicScore(seed + "timing", 50, 90);
    const initialValuationEstimate = Math.round(input.fundingAsk * (2 + (overallScore % 5)));

    const risks = pickN(seed + "risks", SECTOR_RISKS[sectorKey] ?? SECTOR_RISKS.default, 3);
    const strengths = pickN(seed + "strengths", SECTOR_STRENGTHS[sectorKey] ?? SECTOR_STRENGTHS.default, 3);

    return startupAnalysisSchema.parse({
      overallScore,
      investorScore,
      marketScore,
      riskScore,
      timingScore,
      summary: `The ${input.name} concept in ${input.sector} shows ${overallScore > 70 ? "strong" : "moderate"} potential. The ${input.monetizationModel} model aligns with current market dynamics, though execution risk remains.`,
      marketTiming: timingScore > 70
        ? "Favorable timing with growing demand and limited incumbent dominance."
        : "Market is maturing; differentiation and speed-to-market are critical.",
      risks,
      strengths,
      initialValuationEstimate,
    });
  }

  async reviewPitch(input: {
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
  }): Promise<VcReviewResult> {
    const seed = input.startupName + input.sector + input.pitchDeck.problem.slice(0, 20);
    const overallScore = deterministicScore(seed + "overall", 55, 88);
    const scoreProblem = deterministicScore(seed + "problem", 50, 90);
    const scoreSolution = deterministicScore(seed + "solution", 55, 92);
    const scoreMarket = deterministicScore(seed + "market", 45, 85);
    const scoreBusiness = deterministicScore(seed + "business", 50, 88);

    const decision = overallScore >= 75 ? "proposal" : overallScore >= 60 ? "revise" : "reject";
    const proposedAmount = decision === "proposal" ? Math.round(500 + overallScore * 50) : undefined;
    const proposedEquity = decision === "proposal" ? Number((10 + (overallScore % 15) * 0.1).toFixed(2)) : undefined;

    const strengthPool = [
      "Strong problem articulation",
      "Clear go-to-market strategy",
      "Differentiated technology approach",
      "Experienced founding team",
      "Compelling market timing",
      "Capital-efficient model",
    ];
    const weaknessPool = [
      "Competitive landscape is intense",
      "Financial projections need refinement",
      "Go-to-market lacks specificity",
      "Team gaps in key roles",
      "Market size claims feel inflated",
      "Monetization timeline is unclear",
    ];

    const strengths = pickN(seed + "strengths", strengthPool, 2);
    const weaknesses = pickN(seed + "weaknesses", weaknessPool, 2);

    return vcReviewSchema.parse({
      decision,
      overallScore,
      scoreProblem,
      scoreSolution,
      scoreMarket,
      scoreBusiness,
      memo: `We reviewed the pitch for ${input.startupName}. The ${input.sector} opportunity is ${scoreMarket > 70 ? "compelling" : "interesting but crowded"}. ${decision === "proposal" ? "We are prepared to make an offer." : decision === "revise" ? "We see potential but recommend addressing key concerns before funding." : "We are passing at this time."}`,
      strengths,
      weaknesses,
      marketTiming: scoreMarket > 70 ? "Entering at an opportune moment." : "Market timing is acceptable but not optimal.",
      milestones: ["Launch MVP", "Acquire first 100 customers", "Reach $10K MRR"],
      proposedAmount,
      proposedEquity,
      feedback: decision === "proposal" ? "We like the direction. Let's discuss terms." : "Review the feedback and refine your pitch.",
    });
  }

  async generateCommitteeReview(input: Parameters<AIProvider["generateCommitteeReview"]>[0]): Promise<CommitteeConsensus> {
    return generateCommitteeReview(input);
  }

  async generateMarketAnalystNarrative(
    input: Parameters<AIProvider["generateMarketAnalystNarrative"]>[0]
  ): Promise<MarketAnalystNarrative> {
    return generateDeterministicMarketNarrative(input.snapshot, input.signals);
  }

  async generateMonthlyBoardUpdate(
    input: Parameters<AIProvider["generateMonthlyBoardUpdate"]>[0]
  ): Promise<MonthlyBoardUpdate> {
    const seed = `${input.startupName}-${input.month}`;
    const change = input.cashAfter - input.cashBefore;
    const changeWord = change > 0 ? "up" : change < 0 ? "down" : "flat";

    const wellPool = [
      "Product development stayed on track",
      "Customer feedback was broadly positive",
      "Team morale remained high",
      "Key partnership discussions advanced",
      "Burn rate was within forecast",
    ];
    const wrongPool = [
      "Revenue growth fell short of target",
      "One key hire fell through",
      "Market headwinds increased customer churn",
      "Product delay pushed back launch timeline",
      "Competitor launched a similar feature",
    ];
    const recPool = [
      "Focus on revenue-generating features",
      "Extend runway through cost discipline",
      "Accelerate customer acquisition experiments",
      "Strengthen technical hiring pipeline",
      "Validate pricing with pilot customers",
    ];
    const riskPool = [
      "Cash runway is tightening",
      "Market sentiment may worsen",
      "Key customer concentration risk",
      "Technical debt accumulating",
      "Hiring competition intensifying",
    ];

    const whatWentWell = pickN(seed + "well", wellPool, 2);
    const whatWentWrong = pickN(seed + "wrong", wrongPool, 1);
    const nextMonthRecommendations = pickN(seed + "rec", recPool, 2);
    const riskAlerts = pickN(seed + "risk", riskPool, 1);

    return monthlyBoardUpdateSchema.parse({
      boardUpdateTitle: `Month ${input.month}: Cash ${changeWord}, burn at $${input.burnRate.toLocaleString()}`,
      whatWentWell,
      whatWentWrong,
      investorReaction: change >= 0
        ? "Investors are pleased with capital discipline."
        : "Investors are watching burn carefully.",
      founderLesson: "Execution consistency matters more than any single decision.",
      nextMonthRecommendations,
      riskAlerts,
      conciseSummary: `Month ${input.month} for ${input.startupName}: Cash is ${changeWord} to $${input.cashAfter.toLocaleString()}. Burn is $${input.burnRate.toLocaleString()}/mo. Revenue at $${input.revenue.toLocaleString()}. Product progress at ${input.productProgress}%. Market was ${input.marketCondition}.${input.eventTitle ? ` Event: ${input.eventTitle}.` : ""}`,
    });
  }

  async generateFounderCoaching(
    input: Parameters<AIProvider["generateFounderCoaching"]>[0]
  ): Promise<FounderCoachingNote> {
    const seed = `${input.startupName}-${input.context}`;

    const strongPool: Record<string, string[]> = {
      pitch_review: ["Clear problem-solution narrative", "Strong market size justification", "Confident delivery"],
      term_sheet: ["Negotiated from a position of knowledge", "Didn't accept first terms blindly", "Asked the right questions"],
      monthly_simulation: ["Balanced product and growth spend", "Kept burn under control", "Made decisive trade-offs"],
      final_outcome: ["Learned from each month", "Adapted strategy when needed", "Built something real"],
    };

    const weakPool: Record<string, string[]> = {
      pitch_review: ["Could deepen competitive differentiation", "Financial plan lacked detail", "Team slide was thin"],
      term_sheet: ["Could have pushed for better valuation", "Didn't fully understand liquidation preference", "Rushed the decision"],
      monthly_simulation: ["Over-invested in one area", "Ignored early warning signs", "Hired too fast"],
      final_outcome: ["Started too conservatively", "Didn't pivot when data suggested it", "Let runway get too tight"],
    };

    const nextPool: Record<string, string[]> = {
      pitch_review: ["Refine financial model with monthly granularity", "Add customer validation quotes", "Practice the 2-minute version"],
      term_sheet: ["Model dilution across multiple rounds", "Get founder references on the VC", "Understand board dynamics"],
      monthly_simulation: ["Diversify revenue channels", "Build a hiring pipeline before you need it", "Track unit economics weekly"],
      final_outcome: ["Start your next startup with clearer metrics", "Find a co-founder with complementary skills", "Build in public for early feedback"],
    };

    const lessonPool: Record<string, string[]> = {
      pitch_review: ["Investors bet on clarity before they bet on vision.", "A tight narrative beats a comprehensive one."],
      term_sheet: ["Terms matter as much as valuation.", "The best deal is one where both sides win."],
      monthly_simulation: ["Cash is oxygen. Protect it ruthlessly.", "Speed without direction is just expensive motion."],
      final_outcome: ["Every startup teaches you something the next one needs.", "Failure is data, not identity."],
    };

    const ctx = input.context;
    return founderCoachingNoteSchema.parse({
      strongDecision: pickOne(seed + "strong", strongPool[ctx]),
      weakDecision: pickOne(seed + "weak", weakPool[ctx]),
      nextAction: pickOne(seed + "next", nextPool[ctx]),
      startupLesson: pickOne(seed + "lesson", lessonPool[ctx]),
    });
  }

  async generateOperationsAdvisor(input: Parameters<import("./ai-provider").AIProvider["generateOperationsAdvisor"]>[0]) {
    const { generateDeterministicAdvisor } = await import("./operations-advisor");
    return generateDeterministicAdvisor(input);
  }
}
