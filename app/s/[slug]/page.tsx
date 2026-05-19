import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicStartupResultPoster } from "@/components/game/PublicSharePoster";
import { buildPublicStartupShareData, getPublicShareMetadata } from "@/lib/game/public-share";
import { getPublicStartupBySlug } from "@/lib/public/public-startup";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const startup = await getPublicStartupBySlug(slug);

  if (!startup?.publicSlug) {
    return { title: "Result Not Found | Founder Arena" };
  }

  return getPublicShareMetadata(buildPublicStartupShareData(startup));
}

export default async function PublicStartupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const startup = await getPublicStartupBySlug(slug);

  if (!startup?.publicSlug) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://founderarena.xyz";
  const pageUrl = `${baseUrl}/s/${slug}`;
  const shareData = buildPublicStartupShareData(startup);

  return <PublicStartupResultPoster data={shareData} pageUrl={pageUrl} />;
}
