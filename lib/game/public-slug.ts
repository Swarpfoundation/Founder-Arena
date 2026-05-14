import { db } from "@/lib/db";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 40);
}

export function generateSlugCandidate(startupId: string, name: string, attempt: number = 0): string {
  const base = slugify(name) || "startup";
  const shortId = startupId.slice(-6);
  if (attempt === 0) return `${base}-${shortId}`;
  return `${base}-${shortId}-${attempt}`;
}

export async function generatePublicSlug(startupId: string, name: string): Promise<string> {
  let slug = generateSlugCandidate(startupId, name, 0);

  // Ensure uniqueness
  let exists = await db.startup.findUnique({ where: { publicSlug: slug } });
  let attempt = 1;
  while (exists) {
    slug = generateSlugCandidate(startupId, name, attempt);
    exists = await db.startup.findUnique({ where: { publicSlug: slug } });
    attempt++;
  }

  return slug;
}

export function generateFounderSlugCandidate(userId: string, name: string, attempt: number = 0): string {
  const base = slugify(name) || "founder";
  const shortId = userId.slice(-6);
  if (attempt === 0) return `${base}-${shortId}`;
  return `${base}-${shortId}-${attempt}`;
}

export async function generateFounderPublicSlug(userId: string, name: string): Promise<string> {
  let slug = generateFounderSlugCandidate(userId, name, 0);

  let exists = await db.founderProfile.findUnique({ where: { publicSlug: slug } });
  let attempt = 1;
  while (exists) {
    slug = generateFounderSlugCandidate(userId, name, attempt);
    exists = await db.founderProfile.findUnique({ where: { publicSlug: slug } });
    attempt++;
  }

  return slug;
}
