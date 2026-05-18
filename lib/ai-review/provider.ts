import { getAIReviewRuntimeConfig } from "./config";
import type { AIReviewInput, AIReviewProvider, AIReviewResult, AIReviewRuntimeConfig } from "./types";
import { DeepSeekAIReviewProvider } from "./providers/deepseek";
import { MockAIReviewProvider } from "./providers/mock";

export function getAIReviewProvider(config: AIReviewRuntimeConfig = getAIReviewRuntimeConfig()): AIReviewProvider {
  if (config.provider === "deepseek") {
    return new DeepSeekAIReviewProvider(config);
  }
  return new MockAIReviewProvider();
}

export async function generateReviewWithConfiguredProvider(
  input: AIReviewInput,
  config: AIReviewRuntimeConfig = getAIReviewRuntimeConfig()
): Promise<AIReviewResult> {
  if (!config.enabled || config.mode === "mock") {
    return new MockAIReviewProvider().generateReview(input);
  }

  const provider = getAIReviewProvider(config);
  const validation = provider.validateConfig();
  if (!validation.ok) {
    if (config.fallbackToMock) {
      const fallback = await new MockAIReviewProvider().generateReview(input);
      return {
        ...fallback,
        providerMetadata: {
          ...fallback.providerMetadata,
          usedFallback: true,
          mode: config.mode,
        },
      };
    }
    throw new Error(validation.message ?? "AI review provider is not configured.");
  }

  try {
    return await provider.generateReview(input);
  } catch (error) {
    if (!config.fallbackToMock) throw error;
    const fallback = await new MockAIReviewProvider().generateReview(input);
    return {
      ...fallback,
      providerMetadata: {
        ...fallback.providerMetadata,
        usedFallback: true,
        mode: config.mode,
      },
    };
  }
}
