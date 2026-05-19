"use client";

import type { CareerPageData } from "@/lib/actions/career";
import { FounderLegacyScene } from "@/components/game/FounderLegacy";

export function CareerClient({ data }: { data: CareerPageData }) {
  return <FounderLegacyScene data={data} />;
}
