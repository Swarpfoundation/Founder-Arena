import { NextRequest, NextResponse } from "next/server";
import { generateAndActivateMarketSnapshot } from "@/lib/market-data/service";
import { getActiveMarketSnapshot } from "@/lib/market-data/snapshot-builder";

const CRON_SECRET = process.env.CRON_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * GET /api/cron/generate-market-snapshot
 *
 * Vercel Cron-compatible market snapshot generation endpoint.
 * Vercel Cron triggers use GET requests, so this route supports GET
 * with Authorization: Bearer <CRON_SECRET> header protection.
 *
 * This endpoint calls the same generation service as POST /api/cron/market-snapshot.
 * It is idempotent: skips generation if an active snapshot was already created today.
 *
 * Returns safe JSON with status, runId, snapshotId, mode, and provider info.
 * Rejects unauthorized calls with 401.
 * Returns 503 if CRON_SECRET is not configured in production.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  // Missing CRON_SECRET in production → service unavailable
  if (!CRON_SECRET || CRON_SECRET.length < 16) {
    const status = IS_PRODUCTION ? 503 : 500;
    return NextResponse.json(
      {
        status: "not_configured",
        message: "Cron secret is not configured",
      },
      { status }
    );
  }

  // Wrong or missing token
  if (!token || token !== CRON_SECRET) {
    return NextResponse.json(
      { status: "unauthorized" },
      { status: 401 }
    );
  }

  const mode = (process.env.MARKET_DATA_PROVIDER_MODE as "static" | "external" | "hybrid" | "seeded") ?? "static";
  const fallback = (process.env.MARKET_DATA_EXTERNAL_FALLBACK as "static" | "seeded" | "none") ?? "static";

  // Idempotency check: don't regenerate if already active today
  try {
    const existing = await getActiveMarketSnapshot();
    const now = new Date();
    if (existing && existing.isActive) {
      const existingMonth = new Date(existing.month);
      if (
        existingMonth.getFullYear() === now.getFullYear() &&
        existingMonth.getMonth() === now.getMonth()
      ) {
        const createdToday =
          existing.createdAt.getFullYear() === now.getFullYear() &&
          existing.createdAt.getMonth() === now.getMonth() &&
          existing.createdAt.getDate() === now.getDate();
        if (createdToday) {
          return NextResponse.json({
            status: "skipped",
            reason: "Active snapshot already exists for today",
            runId: null,
            snapshotId: existing.id,
            mode,
            providerSourcesUsed: existing.scenarioKey ? [existing.scenarioKey] : ["static"],
            fallbackUsed: false,
            signalsFetched: 0,
            signalsStored: 0,
          });
        }
      }
    }
  } catch {
    // Continue to generation even if idempotency check fails
  }

  try {
    const result = await generateAndActivateMarketSnapshot(mode);

    if (!result.success) {
      return NextResponse.json(
        {
          status: "failed",
          error: result.error,
          runId: result.runId,
          snapshotId: null,
          mode,
          providerSourcesUsed: [],
          fallbackUsed: !!result.scenarioKey?.includes("seeded") || fallback !== "none",
          signalsFetched: result.signalsUsed ?? 0,
          signalsStored: 0,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      runId: result.runId,
      snapshotId: result.snapshotId,
      mode,
      providerSourcesUsed: result.scenarioKey?.includes("seeded")
        ? ["seeded (fallback)"]
        : [mode],
      fallbackUsed: result.scenarioKey?.includes("seeded") || fallback !== "none",
      signalsFetched: result.signalsUsed ?? 0,
      signalsStored: result.signalsUsed ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        status: "error",
        error: message,
        runId: null,
        snapshotId: null,
        mode,
        providerSourcesUsed: [],
        fallbackUsed: fallback !== "none",
        signalsFetched: 0,
        signalsStored: 0,
      },
      { status: 500 }
    );
  }
}
