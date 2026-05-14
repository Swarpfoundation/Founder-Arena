/**
 * Lightweight admin check for market data generation.
 * In development, any authenticated user can generate.
 * In production, only users whose email is in ADMIN_EMAILS env var.
 */

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const IS_DEV = process.env.NODE_ENV !== "production";

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  if (IS_DEV) return true; // In dev, allow any authenticated user
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export function getAdminErrorMessage(): string {
  if (IS_DEV) {
    return "Admin access requires authentication.";
  }
  return "You do not have permission to generate market snapshots.";
}
