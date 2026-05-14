import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FounderRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await db.founderProfile.findUnique({
    where: { userId: id },
    select: { publicSlug: true },
  });
  if (profile?.publicSlug) {
    redirect(`/f/${profile.publicSlug}`);
  }
  notFound();
}
