import { signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-helpers";
import { isAdminEmail } from "@/lib/market-data/admin";
import { getOrCreateFounderProfile } from "@/lib/game/founder-progression";
import { getReferralDashboard } from "@/lib/growth/referrals";
import { getWeeklySubmissionStatus } from "@/lib/growth/submission-limits";
import { GameScene } from "@/components/game/GameScene";
import { FounderProfileScene } from "@/components/game/FounderProfileScene";
import {
  getAdminAccessPresentation,
  getFounderProfileHero,
  getPlanAccessPresentation,
  getProfileLegacyPresentation,
  getProfileReferralPresentation,
  getProfileSettingsLinks,
} from "@/lib/game/profile-scene";
import type { PlanId } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireCurrentUser();
  const profile = await getOrCreateFounderProfile(user.id);
  const planId = (user.plan as PlanId) ?? "free";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "https://founderarena.xyz";

  const [accountCount, referralDashboard, weeklyStatus] = await Promise.all([
    db.account.count({ where: { userId: user.id } }),
    getReferralDashboard(user.id, baseUrl),
    getWeeklySubmissionStatus(user.id),
  ]);

  const hero = getFounderProfileHero({
    displayName: user.name,
    email: user.email,
    founderTitle: profile.founderTitle,
    founderRank: profile.founderRank,
    level: profile.level,
    totalStartups: profile.totalStartups,
    planId,
    appEnv: process.env.APP_ENV,
  });
  const plan = getPlanAccessPresentation({ planId, weekly: weeklyStatus });
  const referral = getProfileReferralPresentation(referralDashboard);
  const legacy = getProfileLegacyPresentation({
    founderTitle: profile.founderTitle,
    founderRank: profile.founderRank,
    bestScore: profile.bestScore,
    bestValuation: profile.bestValuation,
    completedStartups: profile.completedStartups,
    deadStartups: profile.deadStartups,
    publicSlug: profile.publicSlug,
  });
  const admin = getAdminAccessPresentation(isAdminEmail(user.email));

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <GameScene
      eyebrow="Founder ID"
      title="Operator Profile"
      subtitle="Private founder credentials, access pass, referrals, legacy links, settings, and session controls."
      accent="violet"
    >
      <FounderProfileScene
        hero={hero}
        account={{
          email: user.email,
          createdAt: user.createdAt,
          providerCount: accountCount,
        }}
        plan={plan}
        referral={referral}
        legacy={legacy}
        settings={getProfileSettingsLinks()}
        admin={admin}
        logoutAction={logoutAction}
      />
    </GameScene>
  );
}
