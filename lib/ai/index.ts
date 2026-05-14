import { OpenAIProvider } from "./openai-provider";
import { MockProvider } from "./mock-provider";

const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENROUTER_API_KEY;
const baseUrl = process.env.OPENAI_BASE_URL ?? process.env.OPENROUTER_BASE_URL;
const model = process.env.OPENAI_MODEL ?? process.env.OPENROUTER_MODEL;

export const ai = apiKey ? new OpenAIProvider(apiKey, baseUrl, model) : new MockProvider();
