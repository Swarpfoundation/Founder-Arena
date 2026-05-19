import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BadgeCheck, CreditCard, Crown, Gift, KeyRound, Lock, LogOut, Shield, Sparkles, Trophy } from "lucide-react";
import { CopyLinkButton } from "@/components/social/CopyLinkButton";
import type {
  AdminAccessPresentation,
  FounderProfileHeroPresentation,
  PlanAccessPresentation,
  ProfileLegacyPresentation,
  ProfileReferralPresentation,
  ProfileSettingsLink,
  ProfileTone,
} from "@/lib/game/profile-scene";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<ProfileTone, string> = {
  cyan: "border-cyan-500/25 bg-cyan-500/[0.055] text-cyan-300",
  violet: "border-violet-500/25 bg-violet-500/[0.055] text-violet-300",
  rose: "border-rose-500/30 bg-rose-500/[0.065] text-rose-300",
  amber: "border-amber-500/30 bg-amber-500/[0.075] text-amber-300",
  emerald: "border-emerald-500/25 bg-emerald-500/[0.055] text-emerald-300",
  white: "border-white/10 bg-white/[0.035] text-white/55",
};

export function FounderProfileScene({
  hero,
  account,
  plan,
  referral,
  legacy,
  settings,
  admin,
  logoutAction,
}: {
  hero: FounderProfileHeroPresentation;
  account: {
    email: string;
    createdAt: Date;
    providerCount: number;
  };
  plan: PlanAccessPresentation;
  referral: ProfileReferralPresentation;
  legacy: ProfileLegacyPresentation;
  settings: ProfileSettingsLink[];
  admin: AdminAccessPresentation | null;
  logoutAction: () => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <FounderIdHero hero={hero} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <AccountAccessPanel account={account} hero={hero} />
          <PlanAccessPanel plan={plan} />
          <ProfileReferralPanel referral={referral} />
          <ProfileLegacyPanel legacy={legacy} />
        </div>
        <div className="space-y-5">
          <ProfileSettingsPanel settings={settings} logoutAction={logoutAction} />
          {admin && <AdminAccessPanel admin={admin} />}
          <PrivacyNotice />
        </div>
      </div>
    </div>
  );
}

function FounderIdHero({ hero }: { hero: FounderProfileHeroPresentation }) {
  return (
    <section className={cn("relative overflow-hidden border p-5 hud-corner md:p-6", TONE_CLASS[hero.tone])}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-60" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="border border-current/25 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em]">{hero.betaStamp}</span>
            <span className="border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/55">{hero.planLabel}</span>
          </div>
          <h2 className="mt-4 break-words text-3xl font-black uppercase tracking-normal text-white sm:text-4xl md:text-6xl">{hero.displayName}</h2>
          <p className="mt-2 text-lg font-black uppercase tracking-wider text-current">{hero.founderTitle}</p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">{hero.identityLine}</p>
        </div>
        <div className="border border-white/10 bg-black/25 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-white/35">Founder Rank</p>
              <p className="mt-1 text-xl font-black uppercase tracking-wider text-white">{hero.founderRank}</p>
            </div>
            <Crown className="h-9 w-9 text-current" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniMetric label="Level" value={String(hero.level)} />
            <MiniMetric label="Account" value="Private" />
          </div>
          {hero.maskedEmail && <p className="mt-4 text-xs text-white/40">{hero.maskedEmail}</p>}
        </div>
      </div>
    </section>
  );
}

function AccountAccessPanel({
  account,
  hero,
}: {
  account: { email: string; createdAt: Date; providerCount: number };
  hero: FounderProfileHeroPresentation;
}) {
  return (
    <Panel tone="white" icon={<KeyRound className="h-4 w-4" />} title="Account Credentials" subtitle="Private operator identity">
      <div className="grid gap-3 md:grid-cols-3">
        <Intel label="Display Name" value={hero.displayName} />
        <Intel label="Email" value={account.email} />
        <Intel label="Auth Links" value={String(account.providerCount)} />
        <Intel label="Created" value={account.createdAt.toLocaleDateString()} />
        <Intel label="Session Zone" value="Authenticated" />
        <Intel label="Visibility" value="Private Profile" />
      </div>
    </Panel>
  );
}

function PlanAccessPanel({ plan }: { plan: PlanAccessPresentation }) {
  return (
    <Panel tone={plan.planId === "free" ? "cyan" : "violet"} icon={<CreditCard className="h-4 w-4" />} title="Plan / Access Pass" subtitle="Convenience only, never gameplay advantage">
      <div className="grid gap-3 md:grid-cols-4">
        <Intel label="Plan" value={plan.planName} />
        <Intel label="Price" value={plan.priceLabel} />
        <Intel label="Weekly Reviews" value={plan.remainingWeeklyReviews} />
        <Intel label="Credits" value={String(plan.creditsAvailable)} />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-white/55">{plan.reviewAccessLabel}. {plan.weeklyStatusLabel}.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {plan.ctas.map((cta) => (
          <ProfileLink key={cta.href} href={cta.href} label={cta.label} tone={cta.tone} />
        ))}
      </div>
    </Panel>
  );
}

function ProfileReferralPanel({ referral }: { referral: ProfileReferralPresentation }) {
  return (
    <Panel tone="emerald" icon={<Gift className="h-4 w-4" />} title="Referral Command" subtitle="Non-cash founder growth loop">
      <div className="grid gap-3 md:grid-cols-4">
        <Intel label="Code" value={referral.code} />
        <Intel label="Founder Points" value={String(referral.founderPoints)} />
        <Intel label="Review Credits" value={String(referral.submissionCredits)} />
        <Intel label="Signups" value={String(referral.signups)} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <CopyLinkButton url={referral.link} label="Copy Invite" />
        <ProfileLink href="/referrals" label="Open Referrals" tone="emerald" />
      </div>
      <p className="mt-4 border border-amber-500/20 bg-amber-500/[0.07] p-3 text-xs leading-relaxed text-amber-100/75">{referral.disclaimer}</p>
    </Panel>
  );
}

function ProfileLegacyPanel({ legacy }: { legacy: ProfileLegacyPresentation }) {
  return (
    <Panel tone="amber" icon={<Trophy className="h-4 w-4" />} title="Founder Legacy Link" subtitle="Career archive and public card">
      <div className="grid gap-3 md:grid-cols-4">
        <Intel label="Title" value={legacy.founderTitle} />
        <Intel label="Rank" value={legacy.founderRank} />
        <Intel label="Best Score" value={legacy.bestScore.toLocaleString()} />
        <Intel label="Best Value" value={`$${legacy.bestValuation.toLocaleString()}`} />
        <Intel label="Completed" value={String(legacy.completedRuns)} />
        <Intel label="Dead" value={String(legacy.deadRuns)} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {legacy.ctas.map((cta) => (
          <ProfileLink key={cta.href} href={cta.href} label={cta.label} tone={cta.tone} />
        ))}
      </div>
    </Panel>
  );
}

function ProfileSettingsPanel({
  settings,
  logoutAction,
}: {
  settings: ProfileSettingsLink[];
  logoutAction: () => Promise<void>;
}) {
  return (
    <Panel tone="white" icon={<Lock className="h-4 w-4" />} title="Settings / Privacy" subtitle="Account controls that keep the game safe">
      <div className="space-y-2">
        {settings.map((setting) => (
          <Link key={setting.href} href={setting.href} className={cn("block border p-3 transition-colors hover:bg-white/[0.06] hud-corner", TONE_CLASS[setting.tone])}>
            <p className="text-xs font-black uppercase tracking-wider text-white">{setting.label}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/45">{setting.description}</p>
          </Link>
        ))}
      </div>
      <form action={logoutAction} className="mt-4">
        <button type="submit" className="inline-flex w-full items-center justify-center gap-2 border border-rose-500/25 bg-rose-500/[0.07] px-3 py-2 text-xs font-black uppercase tracking-wider text-rose-300 hover:bg-rose-500/15">
          <LogOut className="h-4 w-4" />
          Logout / Exit Session
        </button>
      </form>
    </Panel>
  );
}

function AdminAccessPanel({ admin }: { admin: AdminAccessPresentation }) {
  return (
    <Panel tone={admin.tone} icon={<Shield className="h-4 w-4" />} title="Admin Access" subtitle="Founder-only private beta operations">
      <p className="text-sm leading-relaxed text-white/55">{admin.description}</p>
      <div className="mt-4">
        <ProfileLink href={admin.href} label={admin.label} tone={admin.tone} />
      </div>
    </Panel>
  );
}

function PrivacyNotice() {
  return (
    <section className="border border-white/10 bg-white/[0.03] p-4 text-white/45 hud-corner">
      <div className="flex items-start gap-3">
        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
        <p className="text-xs leading-relaxed">
          This private profile hides auth tokens, billing secrets, raw AI payloads, private pitch text, admin internals, and ad/referral audit ledgers.
        </p>
      </div>
    </section>
  );
}

function Panel({
  tone,
  icon,
  title,
  subtitle,
  children,
}: {
  tone: ProfileTone;
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("border p-5 hud-corner", TONE_CLASS[tone])}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-white">
            <span className="text-current">{icon}</span>
            {title}
          </h2>
          <p className="mt-1 text-xs text-white/38">{subtitle}</p>
        </div>
        <Sparkles className="h-4 w-4 opacity-45" />
      </div>
      {children}
    </section>
  );
}

function ProfileLink({ href, label, tone }: { href: string; label: string; tone: ProfileTone }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 border px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors hover:bg-white/10", TONE_CLASS[tone])}>
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function Intel({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[8px] font-black uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-0.5 truncate text-xs font-black uppercase tracking-wider text-white">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/20 px-2 py-1.5">
      <p className="text-[8px] font-black uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-0.5 truncate text-sm font-black uppercase tracking-wider text-white">{value}</p>
    </div>
  );
}
