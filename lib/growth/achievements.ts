import { db } from "@/lib/db";
import { Prisma, Startup, GrowthOffer } from "@prisma/client";

export const GROWTH_ACHIEVEMENTS = [
  { key: "series_a_ready", title: "Series A Ready", description: "Reach Series A readiness score of 55+.", icon: "📈", xpReward: 150 },
  { key: "raised_series_a", title: "Raised Series A", description: "Close a Series A funding round.", icon: "🚀", xpReward: 300 },
  { key: "strategic_backing", title: "Strategic Backing", description: "Accept a strategic investment from a corporate actor.", icon: "🤝", xpReward: 250 },
  { key: "acquisition_offer", title: "Acquisition Offer", description: "Receive an acquisition offer from a strategic actor.", icon: "💼", xpReward: 200 },
  { key: "successful_exit", title: "Successful Exit", description: "Accept an acquisition offer and exit the startup.", icon: "🎉", xpReward: 500 },
  { key: "rejected_lowball", title: "Rejected Lowball Offer", description: "Counter or reject an acquisition offer below valuation.", icon: "🚫", xpReward: 150 },
  { key: "platform_partner", title: "Platform Partner", description: "Accept a platform integration or distribution partnership.", icon: "🔗", xpReward: 175 },
  { key: "capital_efficient_scale", title: "Capital Efficient Scale", description: "Raise a growth round with capital efficiency above 2x.", icon: "⚡", xpReward: 225 },
];

export async function evaluateGrowthAchievements(
  founderProfileId: string,
  startup: Startup & { growthOffers: GrowthOffer[]; fundingRounds: Array<{ roundType: string; amountRaised: number | null; equitySold: Prisma.Decimal | null }> }
): Promise<string[]> {
  const unlocked: string[] = [];

  // series_a_ready
  // This is evaluated elsewhere via eligibility engine; we check if a Series A round exists
  if (startup.fundingRounds.some((r) => r.roundType === "series_a" || r.roundType === "strategic_round")) {
    const a = await unlockGrowthAchievement(founderProfileId, "raised_series_a");
    if (a) unlocked.push("raised_series_a");
  }

  // strategic_backing
  if (startup.growthOffers.some((o) => o.status === "accepted" && o.actorType !== "vc")) {
    const a = await unlockGrowthAchievement(founderProfileId, "strategic_backing");
    if (a) unlocked.push("strategic_backing");
  }

  // acquisition_offer
  if (startup.growthOffers.some((o) => o.offerType === "acquisition" || o.offerType === "acquihire")) {
    const a = await unlockGrowthAchievement(founderProfileId, "acquisition_offer");
    if (a) unlocked.push("acquisition_offer");
  }

  // successful_exit
  if (startup.stage === "acquired" || (startup.finalOutcome === "ACQUIRED")) {
    const a = await unlockGrowthAchievement(founderProfileId, "successful_exit");
    if (a) unlocked.push("successful_exit");
  }

  // rejected_lowball
  if (startup.growthOffers.some((o) => o.status === "rejected" && (o.offerType === "acquisition" || o.offerType === "acquihire"))) {
    const a = await unlockGrowthAchievement(founderProfileId, "rejected_lowball");
    if (a) unlocked.push("rejected_lowball");
  }

  // platform_partner
  if (startup.growthOffers.some((o) => o.status === "accepted" && ["platform_integration", "distribution_deal", "partnership"].includes(o.offerType))) {
    const a = await unlockGrowthAchievement(founderProfileId, "platform_partner");
    if (a) unlocked.push("platform_partner");
  }

  // capital_efficient_scale
  const hasEfficientRound = startup.fundingRounds.some((r) => {
    if (!r.amountRaised || !r.equitySold) return false;
    const equity = Number(r.equitySold);
    const efficiency = r.amountRaised / Math.max(equity, 1);
    return efficiency >= 2;
  });
  if (hasEfficientRound) {
    const a = await unlockGrowthAchievement(founderProfileId, "capital_efficient_scale");
    if (a) unlocked.push("capital_efficient_scale");
  }

  return unlocked;
}

async function unlockGrowthAchievement(founderProfileId: string, key: string): Promise<boolean> {
  const def = GROWTH_ACHIEVEMENTS.find((a) => a.key === key);
  if (!def) return false;

  const exists = await db.founderAchievement.count({
    where: { founderProfileId, key },
  });
  if (exists > 0) return false;

  await db.founderAchievement.create({
    data: {
      founderProfileId,
      key: def.key,
      title: def.title,
      description: def.description,
      icon: def.icon,
      metadata: { xpReward: def.xpReward } as unknown as Prisma.InputJsonValue,
    },
  });

  const { addXP } = await import("@/lib/game/founder-progression");
  const profile = await db.founderProfile.findUnique({ where: { id: founderProfileId } });
  if (profile) {
    await addXP(profile.userId, def.xpReward);
  }

  return true;
}
