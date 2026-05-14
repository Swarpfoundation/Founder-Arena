import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readFileSync } from "fs";
import { join } from "path";
import { getProviderStatus } from "@/lib/market-data/service";

let cachedVersion: string | null = null;

function getVersion(): string {
  if (cachedVersion) return cachedVersion;
  try {
    const pkgPath = join(process.cwd(), "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string };
    cachedVersion = pkg.version ?? "unknown";
  } catch {
    cachedVersion = "unknown";
  }
  return cachedVersion;
}

function checkAuthConfig() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const url = process.env.AUTH_URL;

  const issues: string[] = [];

  if (!secret) {
    issues.push("AUTH_SECRET is missing");
  } else if (secret.length < 32) {
    issues.push(`AUTH_SECRET is only ${secret.length} chars (needs >= 32)`);
  }

  if (!url) {
    issues.push("AUTH_URL is missing");
  } else {
    if (url.endsWith("/")) {
      issues.push("AUTH_URL has trailing slash");
    }
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      issues.push("AUTH_URL missing protocol (needs https://)");
    }
  }

  if (!process.env.AUTH_GOOGLE_ID) {
    issues.push("AUTH_GOOGLE_ID is missing");
  }
  if (!process.env.AUTH_GOOGLE_SECRET) {
    issues.push("AUTH_GOOGLE_SECRET is missing");
  }
  if (!process.env.AUTH_GITHUB_ID) {
    issues.push("AUTH_GITHUB_ID is missing");
  }
  if (!process.env.AUTH_GITHUB_SECRET) {
    issues.push("AUTH_GITHUB_SECRET is missing");
  }

  return {
    ok: issues.length === 0,
    issues,
    secretLength: secret?.length ?? 0,
    url: url ?? null,
  };
}

function isRateLimiterConfigured(): "upstash" | "in-memory" | "unknown" {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return "upstash";
  }
  return "in-memory";
}

async function checkDatabase(): Promise<"ok" | "error"> {
  try {
    await db.marketSnapshot.count({ take: 1 });
    return "ok";
  } catch {
    return "error";
  }
}

async function checkActiveSnapshot(): Promise<"present" | "missing"> {
  try {
    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    const snapshot = await db.marketSnapshot.findFirst({
      where: { month },
      select: { id: true },
    });
    return snapshot ? "present" : "missing";
  } catch {
    return "missing";
  }
}

/**
 * GET /api/health
 *
 * Safe health check endpoint. No secrets exposed.
 * Returns application status, version, and dependency health.
 */
export async function GET() {
  const dbStatus = await checkDatabase();
  const snapshotStatus = dbStatus === "ok" ? await checkActiveSnapshot() : "missing";
  const isProduction = process.env.NODE_ENV === "production";

  const providers = getProviderStatus();
  const providerAvailability = providers.reduce(
    (acc, p) => {
      acc[p.name] = p.available ? "available" : "unavailable";
      return acc;
    },
    {} as Record<string, string>
  );

  const authCheck = checkAuthConfig();

  const payload = {
    status: dbStatus === "ok" ? "ok" : "degraded",
    version: getVersion(),
    environment: isProduction ? "production" : "development",
    database: dbStatus,
    auth: {
      configured: authCheck.ok,
      issues: authCheck.issues,
      secretLength: authCheck.secretLength,
      url: authCheck.url,
    },
    rateLimiter: isRateLimiterConfigured(),
    marketDataMode: process.env.MARKET_DATA_PROVIDER_MODE ?? "static",
    providerAvailability,
    activeMarketSnapshot: snapshotStatus,
    timestamp: new Date().toISOString(),
  };

  const statusCode = dbStatus === "ok" ? 200 : 503;

  return NextResponse.json(payload, { status: statusCode });
}
