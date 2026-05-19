import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicFounderLegacyCard } from "@/components/game/PublicSharePoster";
import { buildPublicFounderShareData, getPublicShareMetadata } from "@/lib/game/public-share";
import { getPublicFounderProfileBySlug } from "@/lib/public/public-profile";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicFounderProfileBySlug(slug);

  if (!profile) {
    return { title: "Founder Not Found | Founder Arena" };
  }

  return getPublicShareMetadata(buildPublicFounderShareData(profile));
}

export default async function PublicFounderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPublicFounderProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://founderarena.xyz";
  const pageUrl = `${baseUrl}/f/${slug}`;
  const shareData = buildPublicFounderShareData(profile);

  return <PublicFounderLegacyCard data={shareData} pageUrl={pageUrl} />;
}
