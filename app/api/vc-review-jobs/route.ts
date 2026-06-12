import { createHash } from "crypto";
import { NextRequest, NextResponse, after } from "next/server";
import { Prisma } from "@prisma/client";
import { getFounderArenaAuthContext } from "@/lib/auth-context";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  DeckAiAccessRequiredError,
  buildDeckAiAccessResponse,
  consumeDeckAiAccess,
  getDeckAiAccessState,
} from "@/lib/deck-review/access-gate";
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
import { generatedDeckToReviewText } from "@/lib/deck-review/deck-generation";
import { parseStartupProfileFromForm, storePrivateLogo } from "@/lib/deck-review/profile";
import {
  generatedDeckSchema,
  validateManualPitchText,
  type GeneratedDeck,
  type ReviewInputType,
} from "@/lib/deck-review/schemas";
import {
  auditDeckReview,
  buildSafeDeckReviewJobView,
  countDeckReviewJobsToday,
  getActiveDeckReviewJobForStartup,
  runDeckReviewJob,
} from "@/lib/deck-review/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseReviewInputType(value: FormDataEntryValue | null): ReviewInputType {
  return value === "manual_pitch" || value === "ai_generated_deck" || value === "pdf_upload"
    ? value
    : "pdf_upload";
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function summarizeInput(inputType: ReviewInputType, text: string, generatedDeck?: GeneratedDeck | null): string {
  if (inputType === "ai_generated_deck" && generatedDeck) {
    return `${generatedDeck.deckTitle} · ${generatedDeck.slides.length} generated slides`;
  }
  if (inputType === "manual_pitch") return `Manual pitch · ${text.length} chars`;
  return `PDF deck · ${text.length} extracted chars`;
}

/**
 * POST /api/vc-review-jobs
 *
 * multipart/form-data:
 * - startupId   (required)
 * - inputType   pdf_upload | manual_pitch | ai_generated_deck
 * - deck        required for pdf_upload
 * - pitchText   required for manual_pitch
 * - generatedDeckJobId required for ai_generated_deck
 * - startupProfile/profile.* optional private profile context
 * - logo        optional private PNG/JPEG/WebP logo
 * - manualNotes optional, ≤2000 chars
 * - firmIds     optional, comma-separated firm ids; auto-selected by sector when omitted
 */
export async function POST(request: NextRequest) {
  const authContext = await getFounderArenaAuthContext(request);
  if (!authContext) {
    return NextResponse.json({ error: "Sign in to submit a deck for review." }, { status: 401 });
  }
  const user = authContext.user;

  const rateLimitError = await checkRateLimit(user.id, "vcReview");
  if (rateLimitError) {
    return NextResponse.json({ error: rateLimitError }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
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

  const access = await getDeckAiAccessState({ user });
  if (!access.allowed) {
    return NextResponse.json(buildDeckAiAccessResponse(access), { status: 402 });
  }

  const config = getDeckReviewRuntimeConfig();

  // Cost + fairness guards: one active job per startup and daily cap.
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

  const profileResult = parseStartupProfileFromForm(form);
  if (!profileResult.ok) {
    return NextResponse.json({ error: profileResult.message, errorCategory: "invalid_profile" }, { status: 400 });
  }
  const profile = profileResult.profile;
  const logo = form.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      const storedLogo = await storePrivateLogo({
        bytes: Buffer.from(await logo.arrayBuffer()),
        mimeType: logo.type,
      });
      profile.logoUploadKey = storedLogo.storageKey;
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Logo upload failed.", errorCategory: "invalid_profile" },
        { status: 400 }
      );
    }
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

  const firmsResult = resolveSelectedFirms({ selectedFirmIds, sector: profile.sector ?? startup.sector });
  if (!firmsResult.ok) {
    return NextResponse.json({ error: firmsResult.error }, { status: 400 });
  }
  const firms = firmsResult.firms.slice(0, config.maxFirmsPerJob);

  const inputType = parseReviewInputType(form.get("inputType"));
  let extractedText = "";
  let extractedTextSha256 = "";
  let extractedTextTruncated = false;
  let deckPageCount: number | null = null;
  let deckStorageKey: string | null = null;
  let deckSha256: string | null = null;
  let deckFileName: string | null = null;
  let deckSizeBytes = 0;
  let generatedDeck: GeneratedDeck | null = null;

  if (inputType === "pdf_upload") {
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

    const bytes = Buffer.from(await deck.arrayBuffer());
    const validation = validatePdfUpload({
      fileName: deck.name,
      mimeType: deck.type,
      sizeBytes: bytes.byteLength,
      headBytes: bytes.subarray(0, 8),
    });
    if (!validation.ok) {
      const status = validation.error.code === "too_large" ? 413 : 400;
      return NextResponse.json({ error: validation.error.message, errorCategory: "invalid_pdf" }, { status });
    }

    const stored = await storeDeckPdf({ bytes, storageKey: buildDeckStorageKey() });
    deckStorageKey = stored.storageKey;
    deckSha256 = stored.sha256;
    deckFileName = (deck.name || "deck.pdf").slice(0, 200);
    deckSizeBytes = bytes.byteLength;

    const extraction = await extractDeckText(bytes);
    if (!extraction.ok) {
      const category = extraction.error.code === "too_many_pages" ? "deck_too_large" : "extraction_failed";
      const failed = await db.vcDeckReviewJob.create({
        data: {
          userId: user.id,
          startupId,
          reviewInputType: inputType,
          status: "failed",
          deckStorageKey,
          deckSha256,
          deckFileName,
          deckSizeBytes,
          manualNotes,
          startupProfile: profile as unknown as Prisma.InputJsonValue,
          selectedFirmIds: firms.map((firm) => firm.id),
          errorCategory: category,
          safeErrorMessage: extraction.error.message,
          completedAt: new Date(),
        },
      });
      auditDeckReview("deck_review_extraction_failed", { jobId: failed.id, code: extraction.error.code });
      return NextResponse.json({ job: buildSafeDeckReviewJobView(failed) }, { status: 422 });
    }

    extractedText = extraction.value.text;
    extractedTextSha256 = extraction.value.textSha256;
    extractedTextTruncated = extraction.value.truncated;
    deckPageCount = extraction.value.totalPages;
  } else if (inputType === "manual_pitch") {
    const pitch = validateManualPitchText(form.get("pitchText"));
    if (!pitch.ok) {
      return NextResponse.json({ error: pitch.message, errorCategory: "invalid_pitch" }, { status: 400 });
    }
    extractedText = pitch.text;
    extractedTextSha256 = sha256(extractedText);
    deckFileName = "Manual pitch";
  } else {
    const generatedDeckJobId = String(form.get("generatedDeckJobId") ?? "").trim();
    if (!generatedDeckJobId) {
      return NextResponse.json({ error: "generatedDeckJobId is required.", errorCategory: "invalid_pitch" }, { status: 400 });
    }
    const generationJob = await db.vcDeckGenerationJob.findUnique({ where: { id: generatedDeckJobId } });
    if (!generationJob || generationJob.userId !== user.id || generationJob.startupId !== startupId || generationJob.status !== "completed") {
      return NextResponse.json({ error: "Generated deck not found.", errorCategory: "invalid_pitch" }, { status: 404 });
    }
    const parsedDeck = generatedDeckSchema.safeParse(generationJob.generatedDeck);
    if (!parsedDeck.success) {
      return NextResponse.json({ error: "Generated deck is invalid. Generate a new deck.", errorCategory: "invalid_pitch" }, { status: 400 });
    }
    generatedDeck = parsedDeck.data;
    extractedText = generatedDeckToReviewText(generatedDeck);
    extractedTextSha256 = sha256(extractedText);
    deckFileName = generatedDeck.deckTitle;
  }

  const now = new Date();
  const job = await db.vcDeckReviewJob.create({
    data: {
      userId: user.id,
      startupId,
      reviewInputType: inputType,
      status: "reviewing",
      deckStorageKey,
      deckSha256,
      deckFileName,
      deckSizeBytes,
      deckPageCount,
      extractedText,
      extractedTextSha256,
      extractedTextTruncated,
      manualNotes,
      startupProfile: profile as unknown as Prisma.InputJsonValue,
      generatedDeck: generatedDeck ? generatedDeck as unknown as Prisma.InputJsonValue : undefined,
      sourceSummary: summarizeInput(inputType, extractedText, generatedDeck),
      selectedFirmIds: firms.map((firm) => firm.id),
    },
  });

  try {
    const consumed = await consumeDeckAiAccess({
      user,
      startupId,
      action: "deck_review",
      idempotencyKey: job.id,
    });
    await db.vcDeckReviewJob.update({
      where: { id: job.id },
      data: {
        accessConsumedAt: now,
        accessUsedCredit: consumed.consumedCredit,
      },
    });
    auditDeckReview("deck_review_access_consumed", {
      jobId: job.id,
      usedCredit: consumed.consumedCredit,
      planId: consumed.state.planId,
    });
  } catch (error) {
    if (error instanceof DeckAiAccessRequiredError) {
      const failed = await db.vcDeckReviewJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          errorCategory: "access_required",
          safeErrorMessage: error.message,
          completedAt: new Date(),
        },
      });
      return NextResponse.json({ ...buildDeckAiAccessResponse(error.state), job: buildSafeDeckReviewJobView(failed) }, { status: 402 });
    }
    throw error;
  }

  auditDeckReview("deck_review_job_created", {
    jobId: job.id,
    startupId,
    inputType,
    deckSizeBytes,
    firmCount: firms.length,
  });
  if (inputType === "pdf_upload") {
    auditDeckReview("deck_review_pdf_validated", { jobId: job.id, deckSha256 });
    auditDeckReview("deck_review_extraction_completed", {
      jobId: job.id,
      pages: deckPageCount,
      textSha256: extractedTextSha256,
      truncated: extractedTextTruncated,
    });
  }

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
