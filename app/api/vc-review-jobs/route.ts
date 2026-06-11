import { NextRequest, NextResponse, after } from "next/server";
import { getCurrentUserOrDevDemoUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  consumeWeeklySubmissionAllowance,
  getWeeklySubmissionStatus,
} from "@/lib/growth/submission-limits";
import { resolveSelectedFirms } from "@/lib/deck-review/firms";
import { getDeckReviewRuntimeConfig } from "@/lib/deck-review/config";
import {
  buildDeckStorageKey,
  extractDeckText,
  storeDeckPdf,
  validatePdfUpload,
  PDF_MAX_BYTES,
} from "@/lib/deck-review/pdf";
import { MAX_MANUAL_NOTES_CHARS } from "@/lib/deck-review/prompt";
import {
  auditDeckReview,
  buildSafeDeckReviewJobView,
  countDeckReviewJobsToday,
  getActiveDeckReviewJobForStartup,
  runDeckReviewJob,
} from "@/lib/deck-review/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/vc-review-jobs
 *
 * multipart/form-data:
 * - startupId   (required)
 * - deck        (required, application/pdf, ≤15MB, ≤40 pages, text-based)
 * - manualNotes (optional, ≤2000 chars)
 * - firmIds     (optional, comma-separated firm ids; auto-selected by sector when omitted)
 *
 * Returns 202 with the safe job view. AI firm reviews continue in the
 * background; poll GET /api/vc-review-jobs/:jobId.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUserOrDevDemoUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to submit a deck for review." }, { status: 401 });
  }

  const rateLimitError = await checkRateLimit(user.id, "vcReview");
  if (rateLimitError) {
    return NextResponse.json({ error: rateLimitError }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data with a PDF deck." }, { status: 400 });
  }

  const startupId = String(form.get("startupId") ?? "").trim();
  if (!startupId) {
    return NextResponse.json({ error: "startupId is required." }, { status: 400 });
  }

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    select: { id: true, userId: true, sector: true },
  });
  if (!startup || startup.userId !== user.id) {
    return NextResponse.json({ error: "Startup not found." }, { status: 404 });
  }

  const deck = form.get("deck");
  if (!(deck instanceof File)) {
    return NextResponse.json({ error: "Attach the pitch deck as the 'deck' file field." }, { status: 400 });
  }
  if (deck.size > PDF_MAX_BYTES) {
    return NextResponse.json(
      { error: `Deck exceeds the ${Math.round(PDF_MAX_BYTES / (1024 * 1024))}MB limit.` },
      { status: 413 }
    );
  }

  const manualNotesRaw = form.get("manualNotes");
  const manualNotes =
    typeof manualNotesRaw === "string" && manualNotesRaw.trim().length > 0
      ? manualNotesRaw.trim().slice(0, MAX_MANUAL_NOTES_CHARS)
      : null;

  const firmIdsRaw = form.get("firmIds");
  const selectedFirmIds =
    typeof firmIdsRaw === "string" && firmIdsRaw.trim().length > 0
      ? firmIdsRaw.split(",").map((id) => id.trim()).filter(Boolean)
      : null;

  const firmsResult = resolveSelectedFirms({ selectedFirmIds, sector: startup.sector });
  if (!firmsResult.ok) {
    return NextResponse.json({ error: firmsResult.error }, { status: 400 });
  }

  const config = getDeckReviewRuntimeConfig();
  const firms = firmsResult.firms.slice(0, config.maxFirmsPerJob);

  // Cost + fairness guards: one active job per startup, daily cap, weekly cap.
  const activeJob = await getActiveDeckReviewJobForStartup(user.id, startupId);
  if (activeJob) {
    return NextResponse.json(
      { error: "A deck review is already in progress for this startup.", jobId: activeJob.id },
      { status: 409 }
    );
  }

  const jobsToday = await countDeckReviewJobsToday(user.id);
  if (jobsToday >= config.maxJobsPerUserPerDay) {
    return NextResponse.json({ error: "Daily deck review limit reached. Try again tomorrow." }, { status: 429 });
  }

  const weekly = await getWeeklySubmissionStatus(user.id);
  if (!weekly.canSubmit) {
    return NextResponse.json(
      { error: weekly.reason ?? "Weekly review submission limit reached." },
      { status: 429 }
    );
  }

  const bytes = Buffer.from(await deck.arrayBuffer());
  const validation = validatePdfUpload({
    fileName: deck.name,
    mimeType: deck.type,
    sizeBytes: bytes.byteLength,
    headBytes: bytes.subarray(0, 8),
  });
  if (!validation.ok) {
    const status = validation.error.code === "too_large" ? 413 : 400;
    return NextResponse.json({ error: validation.error.message }, { status });
  }

  // Store privately, then create the job in `uploaded`.
  const storageKey = buildDeckStorageKey();
  const stored = await storeDeckPdf({ bytes, storageKey });

  const job = await db.vcDeckReviewJob.create({
    data: {
      userId: user.id,
      startupId,
      status: "uploaded",
      deckStorageKey: stored.storageKey,
      deckSha256: stored.sha256,
      deckFileName: (deck.name || "deck.pdf").slice(0, 200),
      deckSizeBytes: bytes.byteLength,
      manualNotes,
      selectedFirmIds: firms.map((firm) => firm.id),
    },
  });
  auditDeckReview("deck_review_job_created", {
    jobId: job.id,
    startupId,
    deckSizeBytes: bytes.byteLength,
    deckSha256: stored.sha256,
    firmCount: firms.length,
  });
  auditDeckReview("deck_review_pdf_validated", { jobId: job.id, deckSha256: stored.sha256 });

  // Extraction runs synchronously so unreadable decks fail fast for the user.
  await db.vcDeckReviewJob.update({ where: { id: job.id }, data: { status: "extracting_deck" } });
  const extraction = await extractDeckText(bytes);

  if (!extraction.ok) {
    const category = extraction.error.code === "too_many_pages" ? "deck_too_large" : "extraction_failed";
    const failed = await db.vcDeckReviewJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        errorCategory: category,
        safeErrorMessage: extraction.error.message,
        completedAt: new Date(),
      },
    });
    auditDeckReview("deck_review_extraction_failed", { jobId: job.id, code: extraction.error.code });
    return NextResponse.json({ job: buildSafeDeckReviewJobView(failed) }, { status: 422 });
  }

  await db.vcDeckReviewJob.update({
    where: { id: job.id },
    data: {
      status: "reviewing",
      deckPageCount: extraction.value.totalPages,
      extractedText: extraction.value.text,
      extractedTextSha256: extraction.value.textSha256,
      extractedTextTruncated: extraction.value.truncated,
    },
  });
  auditDeckReview("deck_review_extraction_completed", {
    jobId: job.id,
    pages: extraction.value.totalPages,
    textSha256: extraction.value.textSha256,
    truncated: extraction.value.truncated,
  });

  // Weekly allowance consumed only after the deck is accepted and readable.
  await consumeWeeklySubmissionAllowance({
    userId: user.id,
    startupId,
    pitchDeckUpdatedAt: job.createdAt,
  });

  // Firm reviews continue after the response is sent; the client polls status.
  after(async () => {
    try {
      await runDeckReviewJob(job.id);
    } catch {
      // runDeckReviewJob persists its own failure state; never crash the route.
    }
  });

  const fresh = await db.vcDeckReviewJob.findUnique({ where: { id: job.id } });
  return NextResponse.json({ job: buildSafeDeckReviewJobView(fresh!) }, { status: 202 });
}
