import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");

    const snapshot = monthParam
      ? await db.marketSnapshot.findUnique({
          where: { month: new Date(monthParam) },
          include: { events: true },
        })
      : await db.marketSnapshot.findFirst({
          orderBy: { month: "desc" },
          include: { events: true },
        });

    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json({ error: "Failed to fetch snapshot" }, { status: 500 });
  }
}
