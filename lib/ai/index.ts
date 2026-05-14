import { OpenAIProvider } from "./openai-provider";
import { MockProvider } from "./mock-provider";

function resolveProvider() {
  // DeepSeek — https://api.deepseek.com (OpenAI-compatible)
  if (process.env.DEEPSEEK_API_KEY) {
    return new OpenAIProvider(
      process.env.DEEPSEEK_API_KEY,
      process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
      process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      "deepseek"
    );
  }

  // Qwen (Alibaba DashScope) — OpenAI-compatible mode
  if (process.env.QWEN_API_KEY) {
    return new OpenAIProvider(
      process.env.QWEN_API_KEY,
      process.env.QWEN_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1",
      process.env.QWEN_MODEL ?? "qwen-max",
      "qwen"
    );
  }

  // OpenAI / OpenRouter (legacy fallback)
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? process.env.OPENROUTER_BASE_URL;
  const model = process.env.OPENAI_MODEL ?? process.env.OPENROUTER_MODEL;
  if (apiKey) return new OpenAIProvider(apiKey, baseUrl, model, "openai");

  return new MockProvider();
}

export const ai = resolveProvider();
