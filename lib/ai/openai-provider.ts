import { z } from "zod";
import { AIProvider, GenerateOptions } from "./ai-provider";
import {
  StartupAnalysis,
  startupAnalysisSchema,
  VcReviewResult,
  vcReviewSchema,
  CommitteeConsensus,
  committeeConsensusSchema,
  MarketAnalystNarrative,
  marketAnalystNarrativeSchema,
  MonthlyBoardUpdate,
  monthlyBoardUpdateSchema,
  FounderCoachingNote,
  founderCoachingNoteSchema,
} from "./schemas";
import { withTiming } from "@/lib/observability/timing";
import { logger } from "@/lib/observability/logger";
import { trackEvent } from "@/lib/observability/events";
import { MockProvider } from "./mock-provider";
import { generateCommitteeReview } from "./committee";
import { generateDeterministicMarketNarrative } from "./market-analyst";
import {
  buildStartupAnalysisPrompt,
  buildVcReviewPrompt,
  buildMarketAnalystPrompt,
  buildMonthlyBoardUpdatePrompt,
} from "./prompts";

const REQUEST_TIMEOUT_MS = 30_000;

function extractJsonFromMarkdown(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) return codeBlock[1].trim();
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) return jsonMatch[1].trim();
  return text.trim();
}

function safeLogMeta(options: GenerateOptions & { schema?: z.ZodTypeAny }) {
  return {
    hasSchema: !!options.schema,
    systemLength: options.system?.length ?? 0,
    promptLength: options.prompt.length,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
  };
}

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private fallback: MockProvider;

  constructor(apiKey: string, baseUrl?: string, model?: string) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
    this.model = model ?? "gpt-4o";
    this.fallback = new MockProvider();
  }

  async generateText(options: GenerateOptions): Promise<string> {
    return withTiming("ai.generateText", async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              ...(options.system ? [{ role: "system", content: options.system }] : []),
              { role: "user", content: options.prompt },
            ],
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content ?? "";
        logger.info("[ai] generateText success", safeLogMeta(options));
        return content;
      } catch (err) {
        clearTimeout(timeout);
        const error = err instanceof Error ? err.message : String(err);
        logger.error("[ai] generateText failed, using fallback", { error, ...safeLogMeta(options) });
        return this.fallback.generateText(options);
      }
    }, safeLogMeta(options));
  }

  async generateStructured<T extends z.ZodTypeAny>(
    options: GenerateOptions & { schema: T }
  ): Promise<z.infer<T>> {
    return withTiming("ai.generateStructured", async () => {
      try {
        const text = await this.generateText({
          ...options,
          system: `${options.system ?? ""}\n\nRespond ONLY with valid JSON that matches the requested schema. Do not wrap in markdown.`,
        });

        const cleaned = extractJsonFromMarkdown(text);
        const parsed = JSON.parse(cleaned);
        const result = options.schema.parse(parsed);
        logger.info("[ai] generateStructured success", safeLogMeta(options));
        return result;
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        logger.error("[ai] generateStructured failed, using fallback", { error, ...safeLogMeta(options) });
        trackEvent("startup_created", { aiFallback: true, reason: "parse_error" });
        return this.fallback.generateStructured(options);
      }
    }, safeLogMeta(options));
  }

  async analyzeStartupIdea(input: Parameters<AIProvider["analyzeStartupIdea"]>[0]): Promise<StartupAnalysis> {
    const { system, prompt } = buildStartupAnalysisPrompt(input);
    trackEvent("startup_created", { provider: "openai", sector: input.sector });
    return this.generateStructured({
      system,
      prompt,
      schema: startupAnalysisSchema,
      temperature: 0.6,
      maxTokens: 1200,
    });
  }

  async reviewPitch(input: Parameters<AIProvider["reviewPitch"]>[0]): Promise<VcReviewResult> {
    const { system, prompt } = buildVcReviewPrompt(input);
    trackEvent("pitch_review_submitted", { provider: "openai", sector: input.sector });
    return this.generateStructured({
      system,
      prompt,
      schema: vcReviewSchema,
      temperature: 0.5,
      maxTokens: 2000,
    });
  }

  async generateCommitteeReview(
    input: Parameters<AIProvider["generateCommitteeReview"]>[0]
  ): Promise<CommitteeConsensus> {
    return withTiming("ai.generateCommitteeReview", async () => {
      try {
        const deterministic = generateCommitteeReview(input);
        const prompt = `You are an investment committee secretary. Enrich the following committee review with more articulate, investor-specific language. Keep all scores, stances, and structure exactly the same. Only improve the wording of notes, quotes, and objections.

Base data:
${JSON.stringify(deterministic, null, 2)}

Respond with valid JSON matching the committee consensus schema.`;

        const text = await this.generateText({
          system: "You refine investment committee reviews. Preserve all data exactly. Only improve prose quality.",
          prompt,
          temperature: 0.4,
          maxTokens: 2500,
        });

        const cleaned = extractJsonFromMarkdown(text);
        const parsed = JSON.parse(cleaned);
        const enriched = committeeConsensusSchema.parse({ ...deterministic, ...parsed });
        trackEvent("pitch_review_submitted", { provider: "openai", committee: true });
        return enriched;
      } catch (err) {
        logger.error("[ai] committee enrichment failed, using deterministic", {
          error: err instanceof Error ? err.message : String(err),
        });
        return generateCommitteeReview(input);
      }
    }, { sector: input.sector });
  }

  async generateMarketAnalystNarrative(
    input: Parameters<AIProvider["generateMarketAnalystNarrative"]>[0]
  ): Promise<MarketAnalystNarrative> {
    return withTiming("ai.generateMarketAnalystNarrative", async () => {
      try {
        const { system, prompt } = buildMarketAnalystPrompt({
          condition: input.snapshot.condition,
          scenarioKey: input.snapshot.scenarioKey,
          description: input.snapshot.description,
          macroScores:
            input.snapshot.metadata && typeof input.snapshot.metadata === "object"
              ? (input.snapshot.metadata as Record<string, unknown>).macro as Record<string, number>
              : null,
          sectorTrends: input.snapshot.sectorTrends as Record<string, number> | undefined,
          topSignals: input.signals?.map((s) => ({
            title: s.title,
            direction: s.direction,
            severity: 50,
          })),
          sourceMode: "external",
        });

        const result = await this.generateStructured({
          system,
          prompt,
          schema: marketAnalystNarrativeSchema,
          temperature: 0.5,
          maxTokens: 1500,
        });
        trackEvent("market_snapshot_generated", { provider: "openai", analyst: true });
        return result;
      } catch (err) {
        logger.error("[ai] market analyst failed, using deterministic", {
          error: err instanceof Error ? err.message : String(err),
        });
        return generateDeterministicMarketNarrative(input.snapshot, input.signals);
      }
    });
  }

  async generateMonthlyBoardUpdate(
    input: Parameters<AIProvider["generateMonthlyBoardUpdate"]>[0]
  ): Promise<MonthlyBoardUpdate> {
    const { system, prompt } = buildMonthlyBoardUpdatePrompt(input);
    trackEvent("simulation_month_run", { provider: "openai", boardUpdate: true });
    return this.generateStructured({
      system,
      prompt,
      schema: monthlyBoardUpdateSchema,
      temperature: 0.6,
      maxTokens: 1500,
    });
  }

  async generateFounderCoaching(
    input: Parameters<AIProvider["generateFounderCoaching"]>[0]
  ): Promise<FounderCoachingNote> {
    return withTiming("ai.generateFounderCoaching", async () => {
      const prompt = `You are a startup coach reflecting on a founder's recent ${input.context.replace("_", " ")} for ${input.startupName} in the ${input.sector} sector.

Outcome summary: ${input.outcomeSummary}

Respond with JSON matching this schema:
{
  "strongDecision": string (what they did well),
  "weakDecision": string (what they could improve),
  "nextAction": string (one concrete next step),
  "startupLesson": string (one transferable lesson)
}`;

      return this.generateStructured({
        system: "You are a concise startup coach. Be specific, kind, and actionable.",
        prompt,
        schema: founderCoachingNoteSchema,
        temperature: 0.6,
        maxTokens: 800,
      });
    }, { context: input.context, sector: input.sector });
  }

  async generateOperationsAdvisor(
    input: Parameters<AIProvider["generateOperationsAdvisor"]>[0]
  ) {
    const { generateOperationsAdvisor } = await import("./operations-advisor");
    return generateOperationsAdvisor(input);
  }
}
