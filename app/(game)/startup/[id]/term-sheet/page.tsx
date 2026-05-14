import { redirect } from "next/navigation";

export default async function TermSheetRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/startup/${id}/terms`);
}
