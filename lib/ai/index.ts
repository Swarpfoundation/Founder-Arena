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

  // OpenRouter — proxy for 200+ models including DeepSeek/Qwen/Llama (free tier available)
  if (process.env.OPENROUTER_API_KEY) {
    return new OpenAIProvider(
      process.env.OPENROUTER_API_KEY,
      process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
      process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-chat",
      "openrouter"
    );
  }

  // OpenAI (legacy)
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIProvider(
      process.env.OPENAI_API_KEY,
      process.env.OPENAI_BASE_URL,
      process.env.OPENAI_MODEL,
      "openai"
    );
  }

  return new MockProvider();
}

export const ai = resolveProvider();
