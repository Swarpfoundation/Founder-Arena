import "server-only";

import { type NextRequest } from "next/server";
import { evaluatePrivateBetaAdminAccess } from "@/lib/admin/private-beta-dashboard";
import { getCurrentUserOrDevDemoUser } from "@/lib/auth-helpers";
import { extractBearerToken } from "@/lib/mobile-auth/core";
import { validateMobileBearerToken } from "@/lib/mobile-auth/service";

export type FounderArenaAuthContext = {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
  };
  authType: "browser" | "mobile";
  isAdmin: boolean;
};

export async function getFounderArenaAuthContext(request: NextRequest): Promise<FounderArenaAuthContext | null> {
  const bearerToken = extractBearerToken(request.headers.get("authorization"));
  if (bearerToken) {
    const mobileUser = await validateMobileBearerToken(bearerToken);
    if (!mobileUser) return null;
    return {
      user: {
        id: mobileUser.id,
        email: mobileUser.email,
        name: mobileUser.name,
      },
      authType: "mobile",
      isAdmin: evaluatePrivateBetaAdminAccess(mobileUser).allowed,
    };
  }

  const browserUser = await getCurrentUserOrDevDemoUser();
  if (!browserUser) return null;
  return {
    user: browserUser,
    authType: "browser",
    isAdmin: evaluatePrivateBetaAdminAccess(browserUser).allowed,
  };
}
