import "server-only";

import type { InvestmentFirm } from "./firms";
import type { DeckReviewRuntimeConfig } from "./config";
import type { DeckReviewErrorCategory, FirmReview } from "./schemas";
import { parseFirmReviewModelOutput } from "./schemas";
import { buildFirmReviewPrompt, buildRepairPrompt, type DeckReviewPromptInput } from "./prompt";
import { logger } from "@/lib/observability/logger";

/**
 * DeepSeek-backed firm reviewer. Server-only: the API key never leaves this
 * module, prompts and deck text are never logged, and only safe metadata
 * (provider, model label, duration, token counts, error category) is emitted.
 */

export class DeckReviewProviderError extends Error {
  constructor(
    public category: DeckReviewErrorCategory,
    message: string,
    public retryable = false
  ) {
    super(message);
    this.name = "DeckReviewProviderError";
  }
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callDeepSeekChat(
  messages: ChatMessage[],
  config: DeckReviewRuntimeConfig
): Promise<{ content: string; usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } }> {
  if (!config.apiKey) {
    throw new DeckReviewProviderError("provider_not_configured", "DeepSeek API key is not configured.", false);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: 2600,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      throw new DeckReviewProviderError("provider_not_configured", "DeepSeek rejected the configured API key.", false);
    }
    if (response.status === 429) {
      throw new DeckReviewProviderError("provider_rate_limited", "DeepSeek rate limited the request.", true);
    }
    if (!response.ok) {
      throw new DeckReviewProviderError(
        "provider_failed",
        `DeepSeek request failed with HTTP ${response.status}.`,
        response.status >= 500
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new DeckReviewProviderError("provider_invalid_output", "DeepSeek returned an empty response.", true);
    }

    return {
      content,
      usage: {
        promptTokens: typeof data?.usage?.prompt_tokens === "number" ? data.usage.prompt_tokens : undefined,
        completionTokens: typeof data?.usage?.completion_tokens === "number" ? data.usage.completion_tokens : undefined,
        totalTokens: typeof data?.usage?.total_tokens === "number" ? data.usage.total_tokens : undefined,
      },
    };
  } catch (error) {
    if (error instanceof DeckReviewProviderError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new DeckReviewProviderError("provider_timeout", "DeepSeek request timed out.", true);
    }
    throw new DeckReviewProviderError(
      "provider_failed",
      "DeepSeek request failed.",
      true
    );
  } finally {
    clearTimeout(timeout);
  }
}

function backoffMs(attempt: number): number {
  return Math.min(8_000, 1_000 * 2 ** attempt);
}

const sleep = (ms: number) => new Promise<void>((resolveSleep) => setTimeout(resolveSleep, ms));

/**
 * Runs one firm's review with retry on retryable provider errors and a single
 * schema-repair round-trip when the model returns invalid JSON.
 */
export async function generateFirmReview(
  input: DeckReviewPromptInput,
  config: DeckReviewRuntimeConfig
): Promise<FirmReview> {
  const startedAt = Date.now();
  const { system, user } = buildFirmReviewPrompt(input);
  const baseMessages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  let lastError: DeckReviewProviderError | null = null;

  for (let attempt = 0; attempt < config.maxAttemptsPerFirm; attempt += 1) {
    if (attempt > 0) await sleep(backoffMs(attempt - 1));

    try {
      const first = await callDeepSeekChat(baseMessages, config);
      let parsed = parseFirmReviewModelOutput(first.content);
      let repaired = false;

      if (!parsed.ok) {
        // One repair round-trip: send the invalid output back with the error.
        const repair = await callDeepSeekChat(
          [
            ...baseMessages,
            { role: "assistant", content: first.content.slice(0, 6_000) },
            { role: "user", content: buildRepairPrompt(parsed.error) },
          ],
          config
        );
        parsed = parseFirmReviewModelOutput(repair.content);
        repaired = true;
        if (!parsed.ok) {
          throw new DeckReviewProviderError(
            "provider_invalid_output",
            `Firm review failed schema validation after repair: ${parsed.error}`,
            true
          );
        }
      }

      const durationMs = Date.now() - startedAt;
      logger.info("[deck-review] firm review completed", {
        firmId: input.firm.id,
        provider: "deepseek",
        model: config.model,
        durationMs,
        repaired,
        attempt: attempt + 1,
      });

      return {
        ...parsed.value,
        firmId: input.firm.id,
        firmName: input.firm.name,
        provider: "deepseek",
        model: config.model,
        durationMs,
        repaired,
      };
    } catch (error) {
      const providerError =
        error instanceof DeckReviewProviderError
          ? error
          : new DeckReviewProviderError("provider_failed", "Firm review failed.", false);
      lastError = providerError;

      logger.warn("[deck-review] firm review attempt failed", {
        firmId: input.firm.id,
        provider: "deepseek",
        model: config.model,
        attempt: attempt + 1,
        category: providerError.category,
      });

      if (!providerError.retryable) throw providerError;
    }
  }

  throw lastError ?? new DeckReviewProviderError("provider_failed", "Firm review failed.", false);
}

/**
 * Deterministic mock firm review for local development and tests — keeps the
 * full job flow runnable with no API key and no network.
 */
export function generateMockFirmReview(input: { firm: InvestmentFirm; deckText: string }): FirmReview {
  const { firm, deckText } = input;
  const seed = Array.from(deckText.slice(0, 512)).reduce((sum, ch) => (sum + ch.charCodeAt(0)) % 9973, firm.id.length);
  const base = 35 + (seed % 41); // 35..75 — deterministic per deck+firm
  const decision = base >= 65 ? "interested" : base >= 50 ? "conditional" : "pass";

  return {
    firmId: firm.id,
    firmName: firm.name,
    decision,
    score: base,
    confidence: 55,
    checkSizeSuggestion: decision === "pass" ? "" : firm.checkSizeRange,
    valuationView: "Mock review — valuation view unavailable without the live provider.",
    whyTheyLikeIt: decision === "pass" ? [] : [`Deck overlaps with ${firm.name}'s thesis.`],
    mainConcerns: ["Mock provider cannot assess deck evidence in depth."],
    dealBreakers: [],
    questionsForFounder: ["What single metric best proves current momentum?"],
    requiredMilestones: ["Replace mock review with a live provider review."],
    evidenceFromDeck: [],
    missingInformation: ["Live AI review was not configured; evidence was not analyzed."],
    assumptionsMade: ["This is a deterministic mock review."],
    sectorFit: base,
    tractionScore: base,
    teamScore: base,
    marketScore: base,
    productScore: base,
    gtmScore: base,
    financialsScore: base,
    riskScore: 100 - base,
    summary: `${firm.name} produced a mock game-world review (no live AI provider configured).`,
    provider: "mock",
    model: "mock",
    durationMs: 0,
    repaired: false,
  };
}
