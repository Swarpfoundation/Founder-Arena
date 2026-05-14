import { redirect } from "next/navigation";

export default async function SimulateRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/startup/${id}/operate`);
}
