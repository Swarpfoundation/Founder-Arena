import type { PlanId } from "@/lib/billing/plans";
import { getPlanConfig } from "@/lib/billing/plans";

export type ProfileTone = "cyan" | "violet" | "rose" | "amber" | "emerald" | "white";

export interface FounderProfileHeroInput {
  displayName?: string | null;
  email?: string | null;
  founderTitle?: string | null;
  founderRank?: string | null;
  level: number;
  totalStartups: number;
  planId: PlanId;
  appEnv?: string | null;
}

export interface FounderProfileHeroPresentation {
  displayName: string;
  maskedEmail: string | null;
  founderTitle: string;
  founderRank: string;
  level: number;
  planLabel: string;
  betaStamp: string;
  identityLine: string;
  tone: ProfileTone;
}

export interface PlanAccessPresentation {
  planId: PlanId;
  planName: string;
  priceLabel: string;
  reviewAccessLabel: string;
  weeklyStatusLabel: string;
  remainingWeeklyReviews: string;
  creditsAvailable: number;
  ctas: Array<{ label: string; href: string; tone: ProfileTone }>;
}

export interface ProfileReferralPresentation {
  code: string;
  link: string;
  founderPoints: number;
  submissionCredits: number;
  signups: number;
  disclaimer: string;
}

export interface ProfileLegacyPresentation {
  founderTitle: string;
  founderRank: string;
  bestScore: number;
  bestValuation: number;
  completedRuns: number;
  deadRuns: number;
  publicHref: string | null;
  ctas: Array<{ label: string; href: string; tone: ProfileTone }>;
}

export interface ProfileSettingsLink {
  label: string;
  href: string;
  tone: ProfileTone;
  description: string;
}

export interface AdminAccessPresentation {
  label: string;
  href: string;
  description: string;
  tone: ProfileTone;
}

export function getFounderProfileHero(input: FounderProfileHeroInput): FounderProfileHeroPresentation {
  const plan = getPlanConfig(input.planId);
  const displayName = sanitizeProfileText(input.displayName || "Founder");
  return {
    displayName,
    maskedEmail: input.email ? maskPrivateIdentifier(input.email) : null,
    founderTitle: sanitizeProfileText(input.founderTitle || "Rookie Founder"),
    founderRank: sanitizeProfileText(input.founderRank || "rookie").replace(/_/g, " "),
    level: input.level,
    planLabel: plan.name,
    betaStamp: input.appEnv === "beta" ? "Private Beta Access" : "Founder Arena Access",
    identityLine: `Level ${input.level} founder - ${input.totalStartups} venture${input.totalStartups === 1 ? "" : "s"} started`,
    tone: input.planId === "max" ? "amber" : input.planId === "pro" ? "violet" : "cyan",
  };
}

export function getPlanAccessPresentation(input: {
  planId: PlanId;
  weekly: {
    isPaid: boolean;
    remainingFreeSubmissions: number;
    submissionCreditsAvailable: number;
    windowEnd: Date | string;
  };
}): PlanAccessPresentation {
  const plan = getPlanConfig(input.planId);
  const reset = new Date(input.weekly.windowEnd).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return {
    planId: input.planId,
    planName: plan.name,
    priceLabel: plan.monthlyPrice === 0 ? "Free access" : `$${plan.monthlyPrice}/mo`,
    reviewAccessLabel: input.weekly.isPaid ? "Unlimited VC review submissions" : "3 VC review submissions per UTC week",
    weeklyStatusLabel: input.weekly.isPaid ? "Paid bypass active" : `Resets ${reset}`,
    remainingWeeklyReviews: input.weekly.isPaid ? "Unlimited" : String(input.weekly.remainingFreeSubmissions),
    creditsAvailable: input.weekly.submissionCreditsAvailable,
    ctas: [
      { label: input.planId === "free" ? "Upgrade Access" : "Manage Billing", href: "/billing", tone: input.planId === "free" ? "cyan" : "violet" },
      { label: "Ad Privacy", href: "/settings/ads", tone: "white" },
    ],
  };
}

export function getProfileReferralPresentation(input: {
  code: string;
  link: string;
  founderPoints: number;
  submissionCreditsAvailable: number;
  signups: number;
}): ProfileReferralPresentation {
  return {
    code: input.code,
    link: input.link,
    founderPoints: input.founderPoints,
    submissionCredits: input.submissionCreditsAvailable,
    signups: input.signups,
    disclaimer: "Founder Points and review credits have no cash value and do not improve score, valuation, VC decisions, or survival.",
  };
}

export function getProfileLegacyPresentation(input: {
  founderTitle: string;
  founderRank: string;
  bestScore: number;
  bestValuation: number;
  completedStartups: number;
  deadStartups: number;
  publicSlug?: string | null;
}): ProfileLegacyPresentation {
  return {
    founderTitle: sanitizeProfileText(input.founderTitle),
    founderRank: sanitizeProfileText(input.founderRank).replace(/_/g, " "),
    bestScore: input.bestScore,
    bestValuation: input.bestValuation,
    completedRuns: input.completedStartups,
    deadRuns: input.deadStartups,
    publicHref: input.publicSlug ? `/f/${input.publicSlug}` : null,
    ctas: [
      { label: "Open Legacy Archive", href: "/career", tone: "amber" },
      ...(input.publicSlug ? [{ label: "Public Founder Card", href: `/f/${input.publicSlug}`, tone: "violet" as ProfileTone }] : []),
    ],
  };
}

export function getProfileSettingsLinks(): ProfileSettingsLink[] {
  return [
    {
      label: "Command Deck",
      href: "/dashboard",
      tone: "cyan",
      description: "Return to run select and active operations.",
    },
    {
      label: "Referrals",
      href: "/referrals",
      tone: "emerald",
      description: "Invite founders and manage non-cash credits.",
    },
    {
      label: "Ad Privacy",
      href: "/settings/ads",
      tone: "white",
      description: "Manage mock reward visibility and private beta ad settings.",
    },
    {
      label: "Billing",
      href: "/billing",
      tone: "violet",
      description: "Manage subscription access without changing gameplay outcomes.",
    },
  ];
}

export function getAdminAccessPresentation(isAdmin: boolean): AdminAccessPresentation | null {
  if (!isAdmin) return null;
  return {
    label: "Private Beta Ops",
    href: "/admin/private-beta",
    description: "Admin-only review queue, referral, feedback, and readiness dashboard.",
    tone: "rose",
  };
}

export function maskPrivateIdentifier(value: string): string {
  const [local, domain] = value.split("@");
  if (!domain) return value.length <= 4 ? "****" : `${value.slice(0, 2)}***${value.slice(-2)}`;
  const visibleLocal = local.length <= 2 ? `${local[0] ?? ""}*` : `${local.slice(0, 2)}***`;
  const [domainName, ...rest] = domain.split(".");
  const maskedDomain = `${domainName.slice(0, 1)}***${rest.length > 0 ? `.${rest.join(".")}` : ""}`;
  return `${visibleLocal}@${maskedDomain}`;
}

export function sanitizeProfileText(value: unknown): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}
