import { getCurrentUser } from "@/lib/auth-helpers";
import { HomeLandingClient } from "@/components/home/HomeLandingClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <HomeLandingClient
      isAuthenticated={!!user}
      displayName={user?.name ?? user?.email ?? null}
    />
  );
}
