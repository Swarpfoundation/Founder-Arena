import { NextResponse } from "next/server";
import { listPublicInvestmentFirms } from "@/lib/deck-review/firms";

export const dynamic = "force-static";

/**
 * GET /api/vc-review-firms
 *
 * Public catalog of the FICTIONAL in-game investment firms (id, name, thesis,
 * sector focus, check size, public description). Private partner review
 * instructions are stripped server-side and are never part of this payload.
 */
export async function GET() {
  return NextResponse.json({
    firms: listPublicInvestmentFirms(),
    disclaimer:
      "All investment firms in Founder Arena are fictional game entities. Reviews are gameplay feedback, not real funding offers or financial advice.",
  });
}
