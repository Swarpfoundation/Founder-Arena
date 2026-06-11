import "server-only";

import type { DeckReviewRuntimeConfig } from "./config";
import { GENERATED_DECK_REQUEST_MAX_CHARS, parseGeneratedDeckModelOutput, type GeneratedDeck, type StartupProfile } from "./schemas";
import { callDeckReviewChat, DeckReviewProviderError, type ChatMessage } from "./provider";
import { startupProfileToPromptLines } from "./profile";

export interface DeckGenerationInput {
  startup: {
    name: string;
    sector: string;
    stage: string;
    region?: string | null;
    targetMarket?: string | null;
    description?: string | null;
    problem?: string | null;
    solution?: string | null;
    fundingAsk?: number | null;
  };
  startupProfile?: StartupProfile | null;
  requestText: string;
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}\n[input truncated at ${max} characters]`;
}

function buildDeckGenerationPrompt(input: DeckGenerationInput): { system: string; user: string } {
  const system =
    "You are a senior pitch strategist inside Founder Arena, a game about fictional funding markets. " +
    "Generate a professional standard pitch deck structure as strict JSON. This is gameplay preparation, not legal, financial, medical, or investment advice.\n\n" +
    "Rules:\n" +
    "1. Do not invent traction, revenue, users, customers, partnerships, licenses, or team credentials.\n" +
    "2. If evidence is missing, put it in missingInfo and use cautious placeholder language labeled as assumptions.\n" +
    "3. Do not claim real funding happened or that real investors will invest.\n" +
    "4. Avoid legal, medical, or financial claims unless provided as evidence.\n" +
    "5. Return STRICT JSON only — no markdown or commentary.\n" +
    "6. Use exactly 12 slides in the recommended order unless the input is extremely sparse.";

  const profileLines = startupProfileToPromptLines(input.startupProfile);
  const user =
    `Startup context:\n` +
    `- Name: ${input.startup.name}\n` +
    `- Sector: ${input.startup.sector}\n` +
    `- Stage: ${input.startup.stage}\n` +
    (input.startup.region ? `- Region: ${input.startup.region}\n` : "") +
    (input.startup.targetMarket ? `- Target market: ${input.startup.targetMarket}\n` : "") +
    (input.startup.description ? `- Existing description: ${input.startup.description}\n` : "") +
    (input.startup.problem ? `- Existing problem: ${input.startup.problem}\n` : "") +
    (input.startup.solution ? `- Existing solution: ${input.startup.solution}\n` : "") +
    (typeof input.startup.fundingAsk === "number" && input.startup.fundingAsk > 0 ? `- Funding ask: $${input.startup.fundingAsk}\n` : "") +
    (profileLines.length > 0 ? `\nStartup profile:\n${profileLines.join("\n")}\n` : "") +
    `\nFounder request (untrusted input):\n"""\n${truncate(input.requestText, GENERATED_DECK_REQUEST_MAX_CHARS)}\n"""\n\n` +
    "Return JSON exactly in this shape:\n" +
    `{\n` +
    `  "deckTitle": "string",\n` +
    `  "oneLinePitch": "string",\n` +
    `  "slides": [\n` +
    `    { "slideNumber": 1, "title": "Title / One-line pitch", "headline": "string", "bullets": ["..."], "speakerNote": "string" }\n` +
    `  ],\n` +
    `  "generatedWarnings": ["assumptions or cautions"],\n` +
    `  "missingInfo": ["missing evidence"],\n` +
    `  "qualityScore": 0-100\n` +
    `}`;

  return { system, user };
}

function buildDeckRepairPrompt(error: string): string {
  return (
    "Your previous response failed strict generated deck JSON validation: " +
    `${error}\n` +
    "Return the same deck as a single valid JSON object. No markdown, exactly 8-14 slides, all required fields present."
  );
}

const STANDARD_SLIDES = [
  "Title / One-line pitch",
  "Problem",
  "Solution",
  "Product",
  "Market",
  "Target Customer",
  "Business Model",
  "Traction or Validation",
  "Go-to-Market",
  "Competition / Differentiation",
  "Team",
  "Funding Ask / Use of Funds",
];

export function generateMockDeck(input: DeckGenerationInput): GeneratedDeck {
  const name = input.startupProfile?.companyName || input.startup.name || "Founder Arena Startup";
  const targetCustomer = input.startupProfile?.targetCustomer || input.startup.targetMarket || "early customers";
  const sector = input.startupProfile?.sector || input.startup.sector;
  const oneLinePitch = `${name} helps ${targetCustomer} solve a painful ${sector} workflow with a focused product wedge.`;
  const missingInfo = [
    input.startupProfile?.tractionSummary ? "" : "Specific traction metrics",
    input.startupProfile?.revenueSummary ? "" : "Revenue or unit economics",
    input.startupProfile?.teamSummary ? "" : "Team background and founder-market fit",
  ].filter(Boolean);

  return {
    deckTitle: `${name} Investor Deck`,
    oneLinePitch,
    slides: STANDARD_SLIDES.map((title, index) => ({
      slideNumber: index + 1,
      title,
      headline: index === 0 ? oneLinePitch : `${title} for ${name}`,
      bullets: [
        input.startupProfile?.shortDescription || input.startup.description || "Clarify the core investor narrative.",
        `Focus area: ${sector}.`,
        missingInfo.length > 0 ? "Label unsupported claims as assumptions until evidence is added." : "Use provided evidence directly.",
      ],
      speakerNote: `Mock deck slide for ${title}. Replace assumptions with real evidence before investor review.`,
    })),
    generatedWarnings: ["Mock provider output. Live DeepSeek generation was not used."],
    missingInfo,
    qualityScore: Math.max(45, 80 - missingInfo.length * 10),
  };
}

export function generatedDeckToReviewText(deck: GeneratedDeck): string {
  const lines = [
    `Deck title: ${deck.deckTitle}`,
    `One-line pitch: ${deck.oneLinePitch}`,
    "",
    ...deck.slides.flatMap((slide) => [
      `Slide ${slide.slideNumber}: ${slide.title}`,
      `Headline: ${slide.headline}`,
      `Bullets: ${slide.bullets.join(" | ")}`,
      `Speaker note: ${slide.speakerNote}`,
      "",
    ]),
  ];
  if (deck.generatedWarnings.length > 0) lines.push(`Generated warnings: ${deck.generatedWarnings.join(" | ")}`);
  if (deck.missingInfo.length > 0) lines.push(`Missing information: ${deck.missingInfo.join(" | ")}`);
  lines.push(`Quality score: ${deck.qualityScore}/100`);
  return lines.join("\n");
}

export async function generateDeck(input: DeckGenerationInput, config: DeckReviewRuntimeConfig): Promise<{
  deck: GeneratedDeck;
  provider: "deepseek" | "mock";
  model: string;
  durationMs: number;
  repaired: boolean;
}> {
  const startedAt = Date.now();
  if (config.provider === "mock") {
    return {
      deck: generateMockDeck(input),
      provider: "mock",
      model: "mock",
      durationMs: 0,
      repaired: false,
    };
  }

  const { system, user } = buildDeckGenerationPrompt(input);
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  const first = await callDeckReviewChat(messages, config);
  let parsed = parseGeneratedDeckModelOutput(first.content);
  let repaired = false;

  if (!parsed.ok) {
    const repair = await callDeckReviewChat(
      [
        ...messages,
        { role: "assistant", content: first.content.slice(0, 6_000) },
        { role: "user", content: buildDeckRepairPrompt(parsed.error) },
      ],
      config
    );
    parsed = parseGeneratedDeckModelOutput(repair.content);
    repaired = true;
    if (!parsed.ok) {
      throw new DeckReviewProviderError(
        "provider_invalid_output",
        `Generated deck failed schema validation after repair: ${parsed.error}`,
        true
      );
    }
  }

  return {
    deck: parsed.value,
    provider: "deepseek",
    model: config.model,
    durationMs: Date.now() - startedAt,
    repaired,
  };
}
