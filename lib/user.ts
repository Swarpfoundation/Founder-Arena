import {
  getCurrentUser,
  requireCurrentUser,
  getCurrentUserOrDevDemoUser,
} from "@/lib/auth-helpers";

/**
 * @deprecated Use getCurrentUser() for optional auth, requireCurrentUser() for required auth,
 * or getCurrentUserOrDevDemoUser() for dev-only demo fallback.
 */
export async function getCurrentUserOrDemoUser() {
  return getCurrentUserOrDevDemoUser();
}

/**
 * @deprecated Use requireCurrentUser() instead. This helper previously allowed
 * silent demo-user fallback which is not safe in production.
 */
export async function requireUser() {
  const user = await getCurrentUserOrDevDemoUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

// Re-export new helpers for convenience
export { getCurrentUser, requireCurrentUser, getCurrentUserOrDevDemoUser };
