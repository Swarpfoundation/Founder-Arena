/**
 * Builds a minimal, valid, text-based one-page PDF entirely in memory for
 * deck-review tests. No sample decks are committed; everything is generated.
 */
export function buildTextPdf(lines: string[]): Buffer {
  const escape = (text: string) => text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  const contentLines = lines
    .map((line, index) => `BT /F1 12 Tf 50 ${720 - index * 16} Td (${escape(line)}) Tj ET`)
    .join("\n");
  const stream = contentLines;

  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body, "utf8"));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(body, "utf8");
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(body + xref + trailer, "utf8");
}

/** A valid PDF whose page draws nothing — simulates a scanned/image-only deck. */
export function buildTextlessPdf(): Buffer {
  return buildTextPdf([]);
}

/** Enough deck-like text to clear the minimum extracted-character threshold. */
export function buildDeckLines(): string[] {
  return [
    "FounderArena Demo Deck - CloudLedger",
    "Problem: mid-market CFOs reconcile multi-entity books by hand, losing 30 hours per close.",
    "Solution: CloudLedger automates consolidation with audit-ready lineage for every journal entry.",
    "Traction: 14 paying customers, $18k MRR, 96 percent logo retention over the last two quarters.",
    "Market: 48,000 mid-market companies in the US and EU close books manually today.",
    "Team: two founders, one ex-controller and one infrastructure engineer from a payments company.",
    "Go to market: accounting-firm channel partnerships plus direct outbound to VP Finance.",
    "Ask: raising 1.5M to expand integrations and hire two implementation engineers.",
  ];
}
