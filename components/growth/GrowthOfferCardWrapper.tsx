"use client";

import { useRouter } from "next/navigation";
import { GrowthOfferCard } from "./GrowthOfferCard";
import type { StrategicOffer } from "@/lib/growth/types";

interface Props {
  offer: StrategicOffer;
  startupId: string;
}

export function GrowthOfferCardWrapper({ offer, startupId }: Props) {
  const router = useRouter();
  return (
    <GrowthOfferCard
      offer={offer}
      startupId={startupId}
      onResolved={() => router.refresh()}
    />
  );
}
