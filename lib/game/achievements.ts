import { db } from "@/lib/db";
import { Prisma, Startup, SimulationMonth, Employee } from "@prisma/client";

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first_pitch", title: "First Pitch", description: "Submit your first pitch deck for review.", icon: "📊", xpReward: 50 },
  { key: "funded_founder", title: "Funded Founder", description: "Accept your first term sheet and close a funding round.", icon: "💰", xpReward: 100 },
  { key: "first_hire", title: "First Hire", description: "Hire your first employee.", icon: "🤝", xpReward: 75 },
  { key: "survived_12_months", title: "Survived 12 Weeks", description: "Complete a full 12-week accelerator run.", icon: "📅", xpReward: 200 },
  { key: "breakout_startup", title: "Breakout Startup", description: "Reach BREAKOUT outcome.", icon: "🚀", xpReward: 500 },
  { key: "efficient_operator", title: "Efficient Operator", description: "Reach a high score with monthly burn under $30k.", icon: "⚡", xpReward: 300 },
  { key: "cockroach_founder", title: "Cockroach Founder", description: "Survive with less than 2 months runway and recover.", icon: "🪳", xpReward: 250 },
  { key: "revenue_machine", title: "Revenue Machine", description: "Reach $100k MRR.", icon: "📈", xpReward: 400 },
  { key: "unicorn_dream", title: "Unicorn Dream", description: "Reach a valuation of $10M+.", icon: "🦄", xpReward: 350 },
  { key: "team_builder", title: "Team Builder", description: "Hire 5+ active employees at once.", icon: "🏗️", xpReward: 150 },
  { key: "lean_startup", title: "Lean Startup", description: "Complete with a team of 3 or fewer and positive revenue.", icon: "🌱", xpReward: 300 },
  { key: "graveyard_entry", title: "Graveyard Entry", description: "Experience your first startup death.", icon: "💀", xpReward: 50 },
  { key: "compliance_minded", title: "Compliance Minded", description: "Reduce risk score below 20.", icon: "🛡️", xpReward: 150 },
  { key: "product_shipper", title: "Product Shipper", description: "Reach 100% product progress.", icon: "📦", xpReward: 200 },
  { key: "investor_favorite", title: "Investor Favorite", description: "Reach an investor score of 90+.", icon: "⭐", xpReward: 250 },
  { key: "crisis_manager", title: "Crisis Manager", description: "Survive a critical simulation event.", icon: "🛡️", xpReward: 150 },
  { key: "security_first", title: "Security First", description: "Choose the security-focused response to a security event.", icon: "🔒", xpReward: 100 },
  { key: "clutch_founder", title: "Clutch Founder", description: "Make a high-risk, high-reward choice during a critical event.", icon: "🔥", xpReward: 200 },
  { key: "partnership_win", title: "Partnership Win", description: "Accept a strategic partnership offer.", icon: "🤝", xpReward: 125 },
  { key: "viral_moment", title: "Viral Moment", description: "Successfully capitalize on a viral product moment.", icon: "🚀", xpReward: 150 },
  // Phase 18: Growth & Exit
  { key: "series_a_ready", title: "Series A Ready", description: "Reach readiness score of 75+ for a Series A round.", icon: "🎯", xpReward: 200 },
  { key: "raised_series_a", title: "Raised Series A", description: "Close a Series A growth round.", icon: "💵", xpReward: 400 },
  { key: "strategic_backing", title: "Strategic Backing", description: "Receive an offer from a strategic actor.", icon: "🏛️", xpReward: 250 },
  { key: "acquisition_offer", title: "Acquisition Offer", description: "Receive an acquisition offer.", icon: "📨", xpReward: 300 },
  { key: "successful_exit", title: "Successful Exit", description: "Accept an acquisition or complete a strategic exit.", icon: "🎉", xpReward: 600 },
  { key: "rejected_lowball", title: "Rejected Lowball", description: "Counter or reject an offer with valuation below 2x your current valuation.", icon: "🚫", xpReward: 150 },
  { key: "platform_partner", title: "Platform Partner", description: "Accept a strategic partnership with a major platform actor.", icon: "🌐", xpReward: 350 },
  { key: "capital_efficient_scale", title: "Capital Efficient Scale", description: "Raise a growth round with less than 20% dilution.", icon: "📊", xpReward: 300 },
  // Phase 24: Mission achievements
  { key: "first_mission", title: "First Mission Completed", description: "Complete your first startup mission.", icon: "🎯", xpReward: 100 },
  { key: "mission_streak", title: "Mission Streak", description: "Complete 3 missions in a row without failure.", icon: "🔥", xpReward: 200 },
  { key: "technical_team", title: "Technical Team Built", description: "Hire 3+ engineers and complete an engineering mission.", icon: "💻", xpReward: 150 },
  { key: "compliance_ready", title: "Compliance Ready", description: "Complete a compliance mission with score 80+.", icon: "✅", xpReward: 150 },
  { key: "lean_roadmap", title: "Lean Roadmap", description: "Complete 5 missions with total spend under $100K.", icon: "🗺️", xpReward: 200 },
  { key: "ai_cost_optimizer", title: "AI Cost Optimizer", description: "Complete the 'Reduce Inference Cost' mission.", icon: "⚡", xpReward: 150 },
  { key: "audit_ready", title: "Audit Ready", description: "Complete a security audit mission.", icon: "🔍", xpReward: 150 },
  { key: "customer_validation", title: "Customer Validation", description: "Complete customer development and beta launch missions.", icon: "👥", xpReward: 175 },
];

const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((a) => [a.key, a]));

export function getAchievementDef(key: string): AchievementDef | undefined {
  return ACHIEVEMENT_MAP.get(key);
}

export async function hasAchievement(founderProfileId: string, key: string): Promise<boolean> {
  const count = await db.founderAchievement.count({
    where: { founderProfileId, key },
  });
  return count > 0;
}

export async function unlockAchievement(founderProfileId: string, key: string) {
  const def = getAchievementDef(key);
  if (!def) return null;

  const exists = await hasAchievement(founderProfileId, key);
  if (exists) return null;

  const achievement = await db.founderAchievement.create({
    data: {
      founderProfileId,
      key: def.key,
      title: def.title,
      description: def.description,
      icon: def.icon,
      metadata: { xpReward: def.xpReward } as unknown as Prisma.InputJsonValue,
    },
  });

  // Grant XP
  const { addXP } = await import("./founder-progression");
  const profile = await db.founderProfile.findUnique({ where: { id: founderProfileId } });
  if (profile) {
    await addXP(profile.userId, def.xpReward);
  }

  return achievement;
}

export async function evaluateAchievementsOnFinalization(
  founderProfileId: string,
  startup: Startup & { simulationMonths: SimulationMonth[]; employees: Employee[] }
): Promise<string[]> {
  const unlocked: string[] = [];
  const history = startup.simulationMonths;
  const activeEmployees = startup.employees.filter((e) => e.status === "active");

  // funded_founder
  if (startup.status === "funded" || startup.status === "completed" || startup.status === "dead") {
    // If they got funded at some point, they have funding rounds
    // We'll check this more precisely via the fundingRounds count in the caller
  }

  // survived_12_months
  if (history.length >= 12 && startup.status === "completed") {
    const a = await unlockAchievement(founderProfileId, "survived_12_months");
    if (a) unlocked.push("survived_12_months");
  }

  // breakout_startup
  if (startup.finalOutcome === "BREAKOUT") {
    const a = await unlockAchievement(founderProfileId, "breakout_startup");
    if (a) unlocked.push("breakout_startup");
  }

  // efficient_operator
  if ((startup.finalScore ?? 0) > 500 && startup.monthlyBurn < 30000) {
    const a = await unlockAchievement(founderProfileId, "efficient_operator");
    if (a) unlocked.push("efficient_operator");
  }

  // cockroach_founder: survived with runway <= 2 at some point then lived
  const hadLowRunway = history.some((m) => m.runwayMonths <= 2 && m.status === "active");
  if (hadLowRunway && (startup.status === "completed" || history.length >= 6)) {
    const a = await unlockAchievement(founderProfileId, "cockroach_founder");
    if (a) unlocked.push("cockroach_founder");
  }

  // revenue_machine
  if (startup.revenue >= 100000) {
    const a = await unlockAchievement(founderProfileId, "revenue_machine");
    if (a) unlocked.push("revenue_machine");
  }

  // unicorn_dream
  if (startup.valuation >= 10000000) {
    const a = await unlockAchievement(founderProfileId, "unicorn_dream");
    if (a) unlocked.push("unicorn_dream");
  }

  // team_builder
  if (activeEmployees.length >= 5) {
    const a = await unlockAchievement(founderProfileId, "team_builder");
    if (a) unlocked.push("team_builder");
  }

  // lean_startup
  if (activeEmployees.length <= 3 && startup.revenue > 0 && (startup.status === "completed" || startup.status === "dead")) {
    const a = await unlockAchievement(founderProfileId, "lean_startup");
    if (a) unlocked.push("lean_startup");
  }

  // graveyard_entry
  if (startup.status === "dead") {
    const a = await unlockAchievement(founderProfileId, "graveyard_entry");
    if (a) unlocked.push("graveyard_entry");
  }

  // compliance_minded
  const finalRisk = history[history.length - 1]?.riskScoreAfter ?? startup.riskScore ?? 100;
  if (finalRisk < 20) {
    const a = await unlockAchievement(founderProfileId, "compliance_minded");
    if (a) unlocked.push("compliance_minded");
  }

  // product_shipper
  if (startup.productProgress >= 100) {
    const a = await unlockAchievement(founderProfileId, "product_shipper");
    if (a) unlocked.push("product_shipper");
  }

  // investor_favorite
  const finalInvestor = history[history.length - 1]?.investorScoreAfter ?? startup.investorScore ?? 0;
  if (finalInvestor >= 90) {
    const a = await unlockAchievement(founderProfileId, "investor_favorite");
    if (a) unlocked.push("investor_favorite");
  }

  // Phase 18: Growth & Exit achievements
  const growthExit = (startup.aiAnalysis as Record<string, unknown> | null)?.growthExit as Record<string, unknown> | undefined;
  if (growthExit) {
    const exitType = String(growthExit.exitType ?? "");
    const dilution = Number(growthExit.dilution ?? 0);
    const offerType = String(growthExit.offerType ?? "");

    if (exitType === "acquisition" || exitType === "ipo") {
      const a = await unlockAchievement(founderProfileId, "successful_exit");
      if (a) unlocked.push("successful_exit");
    }
    if (offerType === "partnership") {
      const a = await unlockAchievement(founderProfileId, "platform_partner");
      if (a) unlocked.push("platform_partner");
    }
    if (dilution > 0 && dilution < 20) {
      const a = await unlockAchievement(founderProfileId, "capital_efficient_scale");
      if (a) unlocked.push("capital_efficient_scale");
    }
    if (growthExit.rejectedLowball === true) {
      const a = await unlockAchievement(founderProfileId, "rejected_lowball");
      if (a) unlocked.push("rejected_lowball");
    }
  }

  // Phase 16: Event-related achievements
  const { isClutchChoice } = await import("@/lib/events/event-selection");
  for (const month of history) {
    const meta = month.metadata as Record<string, unknown> | null;
    const resolvedEvent = meta?.resolvedEvent as Record<string, unknown> | undefined;
    if (!resolvedEvent) continue;

    const severity = String(resolvedEvent.severity ?? "");
    const eventId = String(resolvedEvent.eventId ?? "");
    const choiceId = String(resolvedEvent.selectedChoiceId ?? "");
    const effects = (resolvedEvent.effects ?? {}) as Record<string, number>;

    // crisis_manager: survived a critical event
    if (severity === "critical") {
      const a = await unlockAchievement(founderProfileId, "crisis_manager");
      if (a && !unlocked.includes("crisis_manager")) unlocked.push("crisis_manager");
    }

    // security_first: chose security_training or full_audit on a security event
    if (eventId === "data_breach_scare" && ["full_audit", "internal_fix"].includes(choiceId)) {
      const a = await unlockAchievement(founderProfileId, "security_first");
      if (a && !unlocked.includes("security_first")) unlocked.push("security_first");
    }
    if (eventId === "phishing_attempt" && choiceId === "security_training") {
      const a = await unlockAchievement(founderProfileId, "security_first");
      if (a && !unlocked.includes("security_first")) unlocked.push("security_first");
    }

    // clutch_founder: high-risk high-reward choice during critical event
    if (isClutchChoice(severity, effects)) {
      const a = await unlockAchievement(founderProfileId, "clutch_founder");
      if (a && !unlocked.includes("clutch_founder")) unlocked.push("clutch_founder");
    }

    // partnership_win: accepted strategic partnership
    if (eventId === "strategic_partnership_offer" && ["accept_deal", "negotiate_exclusive"].includes(choiceId)) {
      const a = await unlockAchievement(founderProfileId, "partnership_win");
      if (a && !unlocked.includes("partnership_win")) unlocked.push("partnership_win");
    }

    // viral_moment: capitalized on viral event
    if (eventId === "product_hunt_hit" && ["scale_infrastructure", "monetize_fast"].includes(choiceId)) {
      const a = await unlockAchievement(founderProfileId, "viral_moment");
      if (a && !unlocked.includes("viral_moment")) unlocked.push("viral_moment");
    }
  }

  return unlocked;
}

export async function evaluateAchievementsForFunding(founderProfileId: string): Promise<string[]> {
  const unlocked: string[] = [];
  const a = await unlockAchievement(founderProfileId, "funded_founder");
  if (a) unlocked.push("funded_founder");
  return unlocked;
}

export async function evaluateAchievementsForHire(
  founderProfileId: string,
  employeeCount: number
): Promise<string[]> {
  const unlocked: string[] = [];
  if (employeeCount === 1) {
    const a = await unlockAchievement(founderProfileId, "first_hire");
    if (a) unlocked.push("first_hire");
  }
  if (employeeCount >= 5) {
    const a = await unlockAchievement(founderProfileId, "team_builder");
    if (a) unlocked.push("team_builder");
  }
  return unlocked;
}

export async function evaluateAchievementsForPitch(founderProfileId: string): Promise<string[]> {
  const unlocked: string[] = [];
  const a = await unlockAchievement(founderProfileId, "first_pitch");
  if (a) unlocked.push("first_pitch");
  return unlocked;
}

export async function evaluateAchievementsForGrowth(
  founderProfileId: string,
  context: {
    roundType?: string;
    receivedAcquisitionOffer?: boolean;
    receivedStrategicOffer?: boolean;
    seriesAReadyScore?: number;
  }
): Promise<string[]> {
  const unlocked: string[] = [];

  if (context.seriesAReadyScore && context.seriesAReadyScore >= 75) {
    const a = await unlockAchievement(founderProfileId, "series_a_ready");
    if (a) unlocked.push("series_a_ready");
  }

  if (context.roundType === "series_a" || context.roundType === "series_b") {
    const a = await unlockAchievement(founderProfileId, "raised_series_a");
    if (a) unlocked.push("raised_series_a");
  }

  if (context.receivedAcquisitionOffer) {
    const a = await unlockAchievement(founderProfileId, "acquisition_offer");
    if (a) unlocked.push("acquisition_offer");
  }

  if (context.receivedStrategicOffer) {
    const a = await unlockAchievement(founderProfileId, "strategic_backing");
    if (a) unlocked.push("strategic_backing");
  }

  return unlocked;
}

export async function evaluateMissionAchievements(
  founderProfileId: string,
  context: {
    completedMissions: number;
    failedMissions: number;
    consecutiveCompleted: number;
    engineerCount: number;
    completedEngineeringMission: boolean;
    completedComplianceMission: boolean;
    complianceScore: number;
    totalMissionSpend: number;
    completedInferenceCostMission: boolean;
    completedAuditMission: boolean;
    completedCustomerDevMission: boolean;
    completedBetaLaunchMission: boolean;
  }
): Promise<string[]> {
  const unlocked: string[] = [];

  if (context.completedMissions >= 1) {
    const a = await unlockAchievement(founderProfileId, "first_mission");
    if (a) unlocked.push("first_mission");
  }

  if (context.consecutiveCompleted >= 3) {
    const a = await unlockAchievement(founderProfileId, "mission_streak");
    if (a) unlocked.push("mission_streak");
  }

  if (context.engineerCount >= 3 && context.completedEngineeringMission) {
    const a = await unlockAchievement(founderProfileId, "technical_team");
    if (a) unlocked.push("technical_team");
  }

  if (context.completedComplianceMission && context.complianceScore >= 80) {
    const a = await unlockAchievement(founderProfileId, "compliance_ready");
    if (a) unlocked.push("compliance_ready");
  }

  if (context.completedMissions >= 5 && context.totalMissionSpend < 100000) {
    const a = await unlockAchievement(founderProfileId, "lean_roadmap");
    if (a) unlocked.push("lean_roadmap");
  }

  if (context.completedInferenceCostMission) {
    const a = await unlockAchievement(founderProfileId, "ai_cost_optimizer");
    if (a) unlocked.push("ai_cost_optimizer");
  }

  if (context.completedAuditMission) {
    const a = await unlockAchievement(founderProfileId, "audit_ready");
    if (a) unlocked.push("audit_ready");
  }

  if (context.completedCustomerDevMission && context.completedBetaLaunchMission) {
    const a = await unlockAchievement(founderProfileId, "customer_validation");
    if (a) unlocked.push("customer_validation");
  }

  return unlocked;
}
