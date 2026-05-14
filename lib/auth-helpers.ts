import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const DEMO_MODE_ENABLED = process.env.DEMO_MODE_ENABLED === "true";
const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Returns the currently authenticated user, or null if not authenticated.
 * No demo fallback. Use this when you need to optionally know the user.
 */
export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });

  return user;
}

/**
 * Returns the currently authenticated user.
 * Throws an error if not authenticated.
 * Use this in server actions that require auth.
 */
export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized: Please sign in to continue.");
  }

  return user;
}

/**
 * Returns the currently authenticated user, or a dev demo user if in
 * development mode and DEMO_MODE_ENABLED is true.
 * Use this for local development convenience only.
 */
export async function getCurrentUserOrDevDemoUser() {
  const realUser = await getCurrentUser();
  if (realUser) return realUser;

  if (!IS_DEV || !DEMO_MODE_ENABLED) {
    return null;
  }

  // Dev demo fallback
  const demoEmail = "demo@founderarena.local";
  let demoUser = await db.user.findUnique({
    where: { email: demoEmail },
  });

  if (!demoUser) {
    demoUser = await db.user.create({
      data: {
        email: demoEmail,
        name: "Demo Founder",
      },
    });
  }

  return demoUser;
}

/**
 * Redirects unauthenticated users to the login page.
 * Use this in server components that require auth.
 */
export async function requireAuthRedirect(returnPath?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const redirectUrl = returnPath
      ? `/login?callbackUrl=${encodeURIComponent(returnPath)}`
      : "/login";
    redirect(redirectUrl);
  }
  return user;
}

/**
 * Safe wrapper for server actions.
 * Catches errors and returns a structured result instead of throwing
 * raw stack traces to the client.
 */
export async function safeAction<T>(
  action: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await action();
    return { success: true, data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}
