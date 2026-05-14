import { PrismaClient } from "@prisma/client";

// Prevent accidental client-side import in Next.js.
// In non-Next.js environments (tests, scripts) this safely no-ops.
if (typeof window === "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("server-only");
  } catch {
    // Safe to ignore in test/script environments
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
