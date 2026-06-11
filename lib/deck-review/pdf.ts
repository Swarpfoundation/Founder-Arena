import { createHash, randomUUID } from "crypto";
import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import { join, resolve, sep } from "path";

/**
 * Private PDF deck handling: validation, storage, and text extraction.
 *
 * Privacy rules enforced here:
 * - Decks are written to a private directory OUTSIDE `public/` (never served).
 * - Storage keys are opaque (uuid-based), never derived from filenames.
 * - Raw deck text is never logged by this module; callers get bounded text
 *   and a hash for audit purposes.
 */

export const PDF_MAX_BYTES = 15 * 1024 * 1024; // 15 MB
export const PDF_MAX_PAGES = 40;
export const PDF_MAX_EXTRACTED_CHARS = 60_000;
export const PDF_MIN_EXTRACTED_CHARS = 200;

export type PdfValidationError =
  | { code: "not_pdf"; message: string }
  | { code: "too_large"; message: string }
  | { code: "empty_file"; message: string };

export function validatePdfUpload(input: {
  fileName: string | null | undefined;
  mimeType: string | null | undefined;
  sizeBytes: number;
  headBytes: Uint8Array;
}): { ok: true } | { ok: false; error: PdfValidationError } {
  if (input.sizeBytes <= 0) {
    return { ok: false, error: { code: "empty_file", message: "Uploaded file is empty." } };
  }
  if (input.sizeBytes > PDF_MAX_BYTES) {
    return {
      ok: false,
      error: {
        code: "too_large",
        message: `Deck exceeds the ${Math.round(PDF_MAX_BYTES / (1024 * 1024))}MB limit.`,
      },
    };
  }

  const name = (input.fileName ?? "").toLowerCase();
  const mime = (input.mimeType ?? "").toLowerCase();
  const extensionOk = name.endsWith(".pdf");
  const mimeOk = mime === "application/pdf" || mime === "application/x-pdf";

  // Magic bytes: a real PDF starts with "%PDF-".
  const head = new TextDecoder("ascii").decode(input.headBytes.slice(0, 5));
  const magicOk = head === "%PDF-";

  if (!magicOk || (!extensionOk && !mimeOk)) {
    return {
      ok: false,
      error: { code: "not_pdf", message: "Only PDF pitch decks are accepted (application/pdf)." },
    };
  }

  return { ok: true };
}

/** Private storage root — env-overridable, never inside `public/`. */
export function getDeckStorageRoot(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.DECK_UPLOAD_DIR?.trim();
  const root = configured && configured.length > 0
    ? resolve(configured)
    : resolve(process.cwd(), "private-uploads", "decks");
  return root;
}

export function buildDeckStorageKey(now = new Date()): string {
  const datePart = now.toISOString().slice(0, 10);
  return `${datePart}/${randomUUID()}.pdf`;
}

function assertKeyInsideRoot(root: string, key: string): string {
  const fullPath = resolve(join(root, key));
  if (!fullPath.startsWith(root + sep) && fullPath !== root) {
    throw new Error("Invalid deck storage key.");
  }
  return fullPath;
}

export async function storeDeckPdf(input: {
  bytes: Buffer;
  storageKey: string;
  env?: NodeJS.ProcessEnv;
}): Promise<{ storageKey: string; sha256: string }> {
  const root = getDeckStorageRoot(input.env);
  const fullPath = assertKeyInsideRoot(root, input.storageKey);
  await mkdir(resolve(fullPath, ".."), { recursive: true });
  await writeFile(fullPath, input.bytes, { mode: 0o600 });
  const sha256 = createHash("sha256").update(input.bytes).digest("hex");
  return { storageKey: input.storageKey, sha256 };
}

export async function readDeckPdf(storageKey: string, env?: NodeJS.ProcessEnv): Promise<Buffer> {
  const root = getDeckStorageRoot(env);
  const fullPath = assertKeyInsideRoot(root, storageKey);
  return readFile(fullPath);
}

export async function deleteDeckPdf(storageKey: string, env?: NodeJS.ProcessEnv): Promise<void> {
  const root = getDeckStorageRoot(env);
  const fullPath = assertKeyInsideRoot(root, storageKey);
  await unlink(fullPath).catch(() => undefined);
}

export type PdfExtractionFailure =
  | { code: "too_many_pages"; message: string }
  | { code: "no_text"; message: string }
  | { code: "extraction_failed"; message: string };

export interface PdfExtractionSuccess {
  text: string;
  totalPages: number;
  textSha256: string;
  truncated: boolean;
}

/**
 * Extracts text from a text-based PDF. Scanned/image-only PDFs fail with a
 * clear `no_text` error — OCR is intentionally out of scope for this phase.
 */
export async function extractDeckText(
  pdfBytes: Buffer
): Promise<{ ok: true; value: PdfExtractionSuccess } | { ok: false; error: PdfExtractionFailure }> {
  let totalPages = 0;
  let rawText = "";

  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const document = await getDocumentProxy(new Uint8Array(pdfBytes));
    totalPages = document.numPages;

    if (totalPages > PDF_MAX_PAGES) {
      return {
        ok: false,
        error: {
          code: "too_many_pages",
          message: `Deck has ${totalPages} pages; the limit is ${PDF_MAX_PAGES}.`,
        },
      };
    }

    const extracted = await extractText(document, { mergePages: true });
    rawText = typeof extracted.text === "string" ? extracted.text : "";
  } catch {
    return {
      ok: false,
      error: {
        code: "extraction_failed",
        message: "Could not parse this PDF. Re-export it from your slide tool and try again.",
      },
    };
  }

  const normalized = rawText.replace(/\0/g, "").replace(/[ \t]+\n/g, "\n").trim();

  if (normalized.length < PDF_MIN_EXTRACTED_CHARS) {
    return {
      ok: false,
      error: {
        code: "no_text",
        message:
          "This PDF contains no readable text (it may be a scanned or image-only export). " +
          "Export a text-based PDF and try again — OCR is not supported yet.",
      },
    };
  }

  const truncated = normalized.length > PDF_MAX_EXTRACTED_CHARS;
  const text = truncated ? normalized.slice(0, PDF_MAX_EXTRACTED_CHARS) : normalized;
  const textSha256 = createHash("sha256").update(text).digest("hex");

  return { ok: true, value: { text, totalPages, textSha256, truncated } };
}
