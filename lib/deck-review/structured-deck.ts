import type { StructuredPitchDeck, StructuredPitchDeckSummary } from "./schemas";

const SECTION_LABELS: Record<string, string> = {
  title: "Title",
  problem: "Problem",
  solution: "Solution",
  product: "Product",
  market: "Market",
  targetCustomer: "Target Customer",
  businessModel: "Business Model",
  traction: "Traction",
  goToMarket: "Go-to-Market",
  competition: "Competition",
  team: "Team",
  fundingAsk: "Funding Ask",
  roadmap: "Roadmap",
};

function sectionLabel(kind: string): string {
  return SECTION_LABELS[kind] ?? kind;
}

export function structuredPitchDeckToReviewText(deck: StructuredPitchDeck): string {
  const lines = [
    `Structured pitch deck title: ${deck.title}`,
    deck.oneLinePitch ? `One-line pitch: ${deck.oneLinePitch}` : "One-line pitch: Not stated",
    "",
    "Structured deck sections:",
    "",
    ...deck.sections.flatMap((section, index) => [
      `Section ${index + 1}: ${sectionLabel(section.kind)} (${section.kind})`,
      `Evidence level: ${section.evidenceLevel}`,
      section.headline ? `Headline: ${section.headline}` : "Headline: Not stated",
      section.bullets.length > 0 ? `Bullets: ${section.bullets.join(" | ")}` : "Bullets: Not stated",
      section.speakerNote ? `Speaker note: ${section.speakerNote}` : "Speaker note: Not stated",
      "",
    ]),
  ];
  if (deck.notes) lines.push(`Founder deck notes: ${deck.notes}`);
  return lines.join("\n");
}

export function buildStructuredPitchDeckSummary(deck: StructuredPitchDeck): StructuredPitchDeckSummary {
  const evidenceSummary = {
    missing: 0,
    weak: 0,
    adequate: 0,
    strong: 0,
  };
  for (const section of deck.sections) {
    evidenceSummary[section.evidenceLevel] += 1;
  }
  return {
    title: deck.title,
    oneLinePitch: deck.oneLinePitch || null,
    sectionCount: deck.sections.length,
    sectionKinds: deck.sections.map((section) => section.kind),
    evidenceSummary,
  };
}
