import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readFileSync } from "fs";
import { join } from "path";

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

/**
 * Returns true if the minimum required auth env vars are present and valid.
 * Does NOT reveal which vars are missing, their values, or their lengths.
 */
function isAuthConfigured(): boolean {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const url = process.env.AUTH_URL;
  return !!secret && secret.length >= 32 && !!url;
}

async function checkDatabase(): Promise<"ok" | "error"> {
  try {
    await db.marketSnapshot.count();
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
 * Minimal public health check. Returns only deployment-necessary signals:
 * service status, version, database reachability, auth configuration flag,
 * and active market snapshot presence.
 *
 * Auth diagnostics, env variable details, secret lengths, provider internals,
 * and rate-limiter configuration are intentionally omitted to prevent
 * information disclosure.
 */
export async function GET() {
  const dbStatus = await checkDatabase();
  const snapshotStatus = dbStatus === "ok" ? await checkActiveSnapshot() : "missing";
  const isProduction = process.env.NODE_ENV === "production";

  const payload = {
    status: dbStatus === "ok" ? "ok" : "degraded",
    version: getVersion(),
    environment: isProduction ? "production" : "development",
    database: dbStatus,
    authConfigured: isAuthConfigured(),
    activeMarketSnapshot: snapshotStatus,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(payload, { status: dbStatus === "ok" ? 200 : 503 });
}
