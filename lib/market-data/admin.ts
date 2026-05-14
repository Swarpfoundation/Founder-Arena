/**
 * Lightweight admin check for market data generation.
 *
 * Development  (NODE_ENV !== "production"):
 *   Any authenticated user is treated as admin for local workflow convenience.
 *
 * Production   (NODE_ENV === "production"):
 *   Only emails listed in ADMIN_EMAILS are allowed.
 *   FAIL-CLOSED: if ADMIN_EMAILS is empty or unset, NO authenticated user
 *   can generate snapshots. This is intentional — a missing env var disables
 *   admin generation rather than opening it to all users.
 */

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const IS_DEV = process.env.NODE_ENV !== "production";

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  if (IS_DEV) return true; // any authenticated user is admin in local dev
  // Production: explicit allowlist only. Empty list → false for everyone.
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export function getAdminErrorMessage(): string {
  if (IS_DEV) {
    return "Admin access requires authentication.";
  }
  return "You do not have permission to generate market snapshots.";
}
