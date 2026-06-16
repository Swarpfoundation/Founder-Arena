import { createHash, randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join, resolve, sep } from "path";
import { startupProfileSchema, type StartupProfile } from "./schemas";

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const PROFILE_FORM_FIELDS: Array<keyof StartupProfile> = [
  "companyName",
  "oneLinePitch",
  "city",
  "country",
  "countryCode",
  "websiteUrl",
  "sector",
  "targetCustomer",
  "currentStage",
  "shortDescription",
  "problem",
  "solution",
  "market",
  "businessModel",
  "unfairAdvantage",
  "realLifeStartup",
  "founderGoal",
  "fundingGoal",
  "existingProductUrl",
  "tractionSummary",
  "revenueSummary",
  "teamSummary",
  "roadmapSummary",
];

function stripMarkup(value: string): string {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
}

export function hasStartupProfileInput(form: FormData): boolean {
  const json = form.get("startupProfile");
  if (typeof json === "string" && json.trim().length > 0) return true;
  for (const field of PROFILE_FORM_FIELDS) {
    if (form.has(`profile.${field}`)) return true;
  }
  return false;
}

export function parseStartupProfileFromForm(form: FormData): { ok: true; profile: StartupProfile } | { ok: false; message: string } {
  const json = form.get("startupProfile");
  let raw: Record<string, unknown> = {};

  if (typeof json === "string" && json.trim().length > 0) {
    try {
      const parsed = JSON.parse(json) as unknown;
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return { ok: false, message: "startupProfile must be a JSON object." };
      }
      raw = parsed as Record<string, unknown>;
    } catch {
      return { ok: false, message: "startupProfile must be valid JSON." };
    }
  }

  for (const field of PROFILE_FORM_FIELDS) {
    const value = form.get(`profile.${field}`);
    if (typeof value === "string") raw[field] = field === "realLifeStartup" ? value === "true" : stripMarkup(value);
  }

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") raw[key] = stripMarkup(value);
  }
  if (typeof raw.description === "string" && !raw.shortDescription) raw.shortDescription = raw.description;
  if (typeof raw.summary === "string" && !raw.shortDescription) raw.shortDescription = raw.summary;
  if (typeof raw.websiteURL === "string" && !raw.websiteUrl) raw.websiteUrl = raw.websiteURL;
  if (typeof raw.countryName === "string" && !raw.country) raw.country = raw.countryName;
  delete raw.description;
  delete raw.summary;
  delete raw.websiteURL;
  delete raw.countryName;

  const parsed = startupProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message ?? "Startup profile is invalid." };
  }
  return { ok: true, profile: parsed.data };
}

export function startupProfileToPromptLines(profile: StartupProfile | null | undefined): string[] {
  if (!profile) return [];
  const lines: string[] = [];
  if (profile.companyName) lines.push(`- Company name: ${profile.companyName}`);
  if (profile.oneLinePitch) lines.push(`- One-line pitch: ${profile.oneLinePitch}`);
  if (profile.city || profile.country || profile.countryCode) {
    lines.push(`- Location: ${[profile.city, profile.country, profile.countryCode].filter(Boolean).join(", ")}`);
  }
  if (profile.websiteUrl) lines.push(`- Website: ${profile.websiteUrl}`);
  if (profile.existingProductUrl) lines.push(`- Product URL: ${profile.existingProductUrl}`);
  if (profile.sector) lines.push(`- Profile sector: ${profile.sector}`);
  if (profile.targetCustomer) lines.push(`- Target customer: ${profile.targetCustomer}`);
  if (profile.currentStage) lines.push(`- Current stage: ${profile.currentStage}`);
  if (profile.shortDescription) lines.push(`- Short description: ${profile.shortDescription}`);
  if (profile.problem) lines.push(`- Problem: ${profile.problem}`);
  if (profile.solution) lines.push(`- Solution: ${profile.solution}`);
  if (profile.market) lines.push(`- Market: ${profile.market}`);
  if (profile.businessModel) lines.push(`- Business model: ${profile.businessModel}`);
  if (profile.unfairAdvantage) lines.push(`- Unfair advantage: ${profile.unfairAdvantage}`);
  if (profile.socialLinks.length > 0) {
    lines.push(`- Social/profile links: ${profile.socialLinks.map((link) => [link.platform, link.url].filter(Boolean).join(": ")).join("; ")}`);
  }
  if (profile.realLifeStartup) lines.push("- Real-life startup flag: true");
  if (profile.founderGoal) lines.push(`- Founder goal: ${profile.founderGoal}`);
  if (profile.fundingGoal) lines.push(`- Funding goal: ${profile.fundingGoal}`);
  if (profile.tractionSummary) lines.push(`- Traction summary: ${profile.tractionSummary}`);
  if (profile.revenueSummary) lines.push(`- Revenue summary: ${profile.revenueSummary}`);
  if (profile.teamSummary) lines.push(`- Team summary: ${profile.teamSummary}`);
  if (profile.roadmapSummary) lines.push(`- Roadmap summary: ${profile.roadmapSummary}`);
  if (profile.logoUploadKey) lines.push("- Private logo uploaded: yes");
  return lines;
}

export function getLogoStorageRoot(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.LOGO_UPLOAD_DIR?.trim();
  return configured && configured.length > 0
    ? resolve(configured)
    : resolve(process.cwd(), "private-uploads", "logos");
}

function assertKeyInsideRoot(root: string, key: string): string {
  const fullPath = resolve(join(root, key));
  if (!fullPath.startsWith(root + sep) && fullPath !== root) {
    throw new Error("Invalid logo storage key.");
  }
  return fullPath;
}

function logoExtension(mimeType: string): "png" | "jpg" | "webp" {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

export async function storePrivateLogo(input: {
  bytes: Buffer;
  mimeType: string;
  env?: NodeJS.ProcessEnv;
}): Promise<{ storageKey: string; sha256: string }> {
  if (!LOGO_MIME_TYPES.has(input.mimeType)) {
    throw new Error("Logo must be PNG, JPEG, or WebP.");
  }
  if (input.bytes.byteLength <= 0 || input.bytes.byteLength > LOGO_MAX_BYTES) {
    throw new Error(`Logo must be smaller than ${Math.round(LOGO_MAX_BYTES / (1024 * 1024))}MB.`);
  }
  const datePart = new Date().toISOString().slice(0, 10);
  const storageKey = `${datePart}/${randomUUID()}.${logoExtension(input.mimeType)}`;
  const root = getLogoStorageRoot(input.env);
  const fullPath = assertKeyInsideRoot(root, storageKey);
  await mkdir(resolve(fullPath, ".."), { recursive: true });
  await writeFile(fullPath, input.bytes, { mode: 0o600 });
  return {
    storageKey,
    sha256: createHash("sha256").update(input.bytes).digest("hex"),
  };
}
