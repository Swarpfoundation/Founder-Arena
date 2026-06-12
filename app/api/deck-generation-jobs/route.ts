import { NextRequest, NextResponse } from "next/server";
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
import { getDeckReviewRuntimeConfig } from "@/lib/deck-review/config";
import { generateDeck } from "@/lib/deck-review/deck-generation";
import { buildSafeDeckGenerationJobView } from "@/lib/deck-review/generation-service";
import { GENERATED_DECK_REQUEST_MAX_CHARS } from "@/lib/deck-review/schemas";
import { parseStartupProfileFromForm, storePrivateLogo } from "@/lib/deck-review/profile";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const authContext = await getFounderArenaAuthContext(request);
  if (!authContext) {
    return NextResponse.json({ error: "Sign in to generate a deck." }, { status: 401 });
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
    select: {
      id: true,
      userId: true,
      name: true,
      sector: true,
      stage: true,
      region: true,
      targetMarket: true,
      description: true,
      problem: true,
      solution: true,
      fundingAsk: true,
    },
  });
  if (!startup || startup.userId !== user.id) {
    return NextResponse.json({ error: "Startup not found." }, { status: 404 });
  }

  const access = await getDeckAiAccessState({ user });
  if (!access.allowed) {
    return NextResponse.json(buildDeckAiAccessResponse(access), { status: 402 });
  }

  const requestText = String(form.get("requestText") ?? "").trim().slice(0, GENERATED_DECK_REQUEST_MAX_CHARS);
  if (requestText.length < 80) {
    return NextResponse.json({ error: "Describe the startup in at least 80 characters." }, { status: 400 });
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

  const config = getDeckReviewRuntimeConfig();
  const now = new Date();
  const job = await db.vcDeckGenerationJob.create({
    data: {
      userId: user.id,
      startupId,
      status: "generating",
      requestText,
      startupProfile: profile as unknown as Prisma.InputJsonValue,
      provider: config.provider,
      model: config.provider === "deepseek" ? config.model : "mock",
      startedAt: now,
    },
  });

  try {
    const consumed = await consumeDeckAiAccess({
      user,
      startupId,
      action: "deck_generation",
      idempotencyKey: job.id,
    });

    const generated = await generateDeck({
      startup,
      startupProfile: profile,
      requestText,
    }, config);

    const completed = await db.vcDeckGenerationJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        generatedDeck: generated.deck as unknown as Prisma.InputJsonValue,
        provider: generated.provider,
        model: generated.model,
        accessConsumedAt: consumed.consumedCredit || consumed.state.willUseCredit || consumed.state.isPremium ? now : null,
        accessUsedCredit: consumed.consumedCredit,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ job: buildSafeDeckGenerationJobView(completed) }, { status: 201 });
  } catch (error) {
    if (error instanceof DeckAiAccessRequiredError) {
      await db.vcDeckGenerationJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          errorCategory: "access_required",
          safeErrorMessage: error.message,
          completedAt: new Date(),
        },
      });
      return NextResponse.json(buildDeckAiAccessResponse(error.state), { status: 402 });
    }

    const safeMessage = error instanceof Error ? error.message : "Deck generation failed.";
    const failed = await db.vcDeckGenerationJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        errorCategory: safeMessage.includes("API key") ? "provider_not_configured" : "provider_failed",
        safeErrorMessage: safeMessage.slice(0, 500),
        completedAt: new Date(),
      },
    });
    return NextResponse.json({ job: buildSafeDeckGenerationJobView(failed) }, { status: 502 });
  }
}
