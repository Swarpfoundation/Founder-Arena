import { NextRequest, NextResponse } from "next/server";
import { generateAndActivateMarketSnapshot } from "@/lib/market-data/service";
import { getActiveMarketSnapshot } from "@/lib/market-data/snapshot-builder";

const CRON_SECRET = process.env.CRON_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * POST /api/cron/market-snapshot
 *
 * Scheduled endpoint for automated market snapshot generation.
 * Requires Authorization: Bearer <CRON_SECRET>
 *
 * Uses MARKET_DATA_PROVIDER_MODE env var (default: static)
 * Supports: static, external, hybrid, seeded
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  // Missing CRON_SECRET in production → service unavailable
  if (!CRON_SECRET || CRON_SECRET.length < 16) {
    const status = IS_PRODUCTION ? 503 : 500;
    return NextResponse.json(
      {
        status: "not_configured",
        message: "Cron is not configured",
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

  // Idempotency check: don't regenerate if already active today
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
          snapshotId: existing.id,
          scenarioKey: existing.scenarioKey,
        });
      }
    }
  }

  const mode = (process.env.MARKET_DATA_PROVIDER_MODE as "static" | "external" | "hybrid" | "seeded") ?? "static";
  const fallback = (process.env.MARKET_DATA_EXTERNAL_FALLBACK as "static" | "seeded" | "none") ?? "static";

  try {
    const result = await generateAndActivateMarketSnapshot(mode);

    if (!result.success) {
      return NextResponse.json(
        {
          status: "failed",
          error: result.error,
          runId: result.runId,
          mode,
          fallback,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      runId: result.runId,
      snapshotId: result.snapshotId,
      signalsUsed: result.signalsUsed,
      scenarioKey: result.scenarioKey,
      mode,
      fallback,
      providerSourcesUsed: result.scenarioKey?.includes("seeded") ? ["seeded (fallback)"] : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { status: "error", error: message, mode, fallback },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/market-snapshot
 *
 * Public health check. Returns current active snapshot info without generating.
 * Does NOT require CRON_SECRET — safe to call from monitoring/health checks.
 */
export async function GET() {
  try {
    const active = await getActiveMarketSnapshot();
    const mode = process.env.MARKET_DATA_PROVIDER_MODE ?? "static";
    const fallback = process.env.MARKET_DATA_EXTERNAL_FALLBACK ?? "static";

    return NextResponse.json({
      status: "ok",
      mode,
      fallback,
      activeSnapshot: active
        ? {
            id: active.id,
            scenarioKey: active.scenarioKey,
            condition: active.condition,
            isActive: active.isActive,
            activatedAt: active.activatedAt,
            createdAt: active.createdAt,
          }
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { status: "error", error: message },
      { status: 500 }
    );
  }
}
