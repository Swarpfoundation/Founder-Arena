import { Prisma, PrismaClient } from "@prisma/client";
import { recomputeStartupBaseBurn } from "../lib/economy/recompute-burn";
import {
  DEMO_FOUNDER_PUBLIC_SLUG,
  DEMO_SCENARIOS,
  DEMO_SEASON,
  DEMO_USER_EMAIL,
  DEMO_USER_NAME,
  getDemoScenario,
  getDemoScenarioIds,
} from "../lib/demo/showcase-data";

const prisma = new PrismaClient();

const args = new Set(process.argv.slice(2));
const resetOnly = args.has("--reset-only");
const confirmedReset = args.has("--confirm-demo-reset");

const demoAchievementKeys = [
  "demo_first_deployment",
  "demo_boardroom_survivor",
  "demo_rival_killer",
  "demo_breakout_founder",
];

const baseDate = new Date("2026-02-03T16:00:00.000Z");

function monthsAfter(offset: number): Date {
  return new Date(Date.UTC(2026, 1 + offset, 3, 16, 0, 0));
}

function json<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function assertSafeEnvironment() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    throw new Error("Refusing to seed Founder Arena demo data in a production environment.");
  }

  if (resetOnly && !confirmedReset) {
    throw new Error("Demo reset requires --confirm-demo-reset.");
  }
}

async function deleteDemoRecords(tx: Prisma.TransactionClient) {
  const startupIds = getDemoScenarioIds();

  await tx.leaderboardEntry.deleteMany({ where: { startupId: { in: startupIds } } });
  await tx.startup.deleteMany({ where: { id: { in: startupIds } } });

  const profile = await tx.founderProfile.findFirst({
    where: { user: { email: DEMO_USER_EMAIL } },
    select: { id: true },
  });

  if (profile) {
    await tx.founderAchievement.deleteMany({
      where: {
        founderProfileId: profile.id,
        key: { in: demoAchievementKeys },
      },
    });
  }
}

async function seedUserAndProfile(tx: Prisma.TransactionClient) {
  const user = await tx.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    create: {
      email: DEMO_USER_EMAIL,
      name: DEMO_USER_NAME,
      image: null,
    },
    update: {
      name: DEMO_USER_NAME,
    },
  });

  const profile = await tx.founderProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      publicSlug: DEMO_FOUNDER_PUBLIC_SLUG,
      xp: 3550,
      level: 8,
      totalStartups: 4,
      completedStartups: 2,
      deadStartups: 1,
      bestValuation: 18_400_000,
      bestScore: 1290,
      reputationScore: 84,
      founderTitle: "Arena Proven Founder",
      founderRank: "veteran",
      totalMonthsPlayed: 31,
      totalRevenueGenerated: 1_870_000,
      bestMonthlyRevenue: 245_000,
      bestOutcome: "BREAKOUT",
      bestStartupId: getDemoScenario("finalized").id,
      lastCompletedStartupId: getDemoScenario("finalized").id,
      totalAcquisitions: 0,
      totalBreakouts: 1,
      totalSeriesAReady: 1,
      totalSurvived12: 2,
      sectorStats: json({
        SaaS: {
          runs: 2,
          bestScore: 1290,
          bestOutcome: "BREAKOUT",
          totalRevenue: 1_420_000,
        },
        Fintech: {
          runs: 1,
          bestScore: 180,
          bestOutcome: "DEAD",
          totalRevenue: 84_000,
        },
      }),
      playstyleStats: json({
        product_led: {
          playstyle: "product_led",
          timesDominant: 1,
          completedRuns: 1,
          failedRuns: 0,
          bestOutcome: "BREAKOUT",
          bestScore: 1290,
        },
        capital_blitzscaler: {
          playstyle: "capital_blitzscaler",
          timesDominant: 1,
          completedRuns: 0,
          failedRuns: 1,
          bestOutcome: "DEAD",
          bestScore: 180,
        },
      }),
      rivalStats: json({
        defeatedCount: 2,
        highestRivalryScore: 88,
        nemesisName: "NovaStack",
      }),
      legacyBadges: json([
        "demo_first_deployment",
        "demo_boardroom_survivor",
        "demo_rival_killer",
        "demo_breakout_founder",
      ]),
      completedStartupIds: json([getDemoScenario("finalized").id, getDemoScenario("dead").id]),
      recentRuns: json([
        {
          startupId: getDemoScenario("finalized").id,
          name: getDemoScenario("finalized").startupName,
          outcome: "BREAKOUT",
          score: 1290,
          months: 12,
        },
        {
          startupId: getDemoScenario("dead").id,
          name: getDemoScenario("dead").startupName,
          outcome: "DEAD",
          score: 180,
          months: 8,
        },
      ]),
    },
    update: {
      publicSlug: DEMO_FOUNDER_PUBLIC_SLUG,
      xp: 3550,
      level: 8,
      totalStartups: 4,
      completedStartups: 2,
      deadStartups: 1,
      bestValuation: 18_400_000,
      bestScore: 1290,
      reputationScore: 84,
      founderTitle: "Arena Proven Founder",
      founderRank: "veteran",
      totalMonthsPlayed: 31,
      totalRevenueGenerated: 1_870_000,
      bestMonthlyRevenue: 245_000,
      bestOutcome: "BREAKOUT",
      bestStartupId: getDemoScenario("finalized").id,
      lastCompletedStartupId: getDemoScenario("finalized").id,
      totalAcquisitions: 0,
      totalBreakouts: 1,
      totalSeriesAReady: 1,
      totalSurvived12: 2,
      sectorStats: json({
        SaaS: { runs: 2, bestScore: 1290, bestOutcome: "BREAKOUT", totalRevenue: 1_420_000 },
        Fintech: { runs: 1, bestScore: 180, bestOutcome: "DEAD", totalRevenue: 84_000 },
      }),
      playstyleStats: json({
        product_led: {
          playstyle: "product_led",
          timesDominant: 1,
          completedRuns: 1,
          failedRuns: 0,
          bestOutcome: "BREAKOUT",
          bestScore: 1290,
        },
        capital_blitzscaler: {
          playstyle: "capital_blitzscaler",
          timesDominant: 1,
          completedRuns: 0,
          failedRuns: 1,
          bestOutcome: "DEAD",
          bestScore: 180,
        },
      }),
      rivalStats: json({ defeatedCount: 2, highestRivalryScore: 88, nemesisName: "NovaStack" }),
      legacyBadges: json(demoAchievementKeys),
      completedStartupIds: json([getDemoScenario("finalized").id, getDemoScenario("dead").id]),
      recentRuns: json([
        {
          startupId: getDemoScenario("finalized").id,
          name: getDemoScenario("finalized").startupName,
          outcome: "BREAKOUT",
          score: 1290,
          months: 12,
        },
        {
          startupId: getDemoScenario("dead").id,
          name: getDemoScenario("dead").startupName,
          outcome: "DEAD",
          score: 180,
          months: 8,
        },
      ]),
    },
  });

  for (const achievement of [
    {
      key: "demo_first_deployment",
      title: "First Deployment",
      description: "Deployed a startup into the Founder Arena showcase path.",
      icon: "crosshair",
    },
    {
      key: "demo_boardroom_survivor",
      title: "Boardroom Survivor",
      description: "Survived an investor pressure crisis in the demo run.",
      icon: "shield",
    },
    {
      key: "demo_rival_killer",
      title: "Rival Killer",
      description: "Outperformed a hostile founder rival in the arena.",
      icon: "swords",
    },
    {
      key: "demo_breakout_founder",
      title: "Breakout Founder",
      description: "Reached a BREAKOUT outcome in the showcase season.",
      icon: "trophy",
    },
  ]) {
    await tx.founderAchievement.upsert({
      where: {
        founderProfileId_key: {
          founderProfileId: profile.id,
          key: achievement.key,
        },
      },
      create: {
        founderProfileId: profile.id,
        key: achievement.key,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        metadata: json({ demo: true }),
      },
      update: {
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        metadata: json({ demo: true }),
      },
    });
  }

  return user;
}

function socialFeed(startupName: string) {
  return [
    {
      id: `${startupName}-feed-viral`,
      month: 3,
      category: "viral",
      title: "Viral Spike",
      body: `${startupName} turned a founder memo into a customer waitlist surge.`,
      severity: "positive",
      source: "community",
      effects: { followersDelta: 4200, hypeDelta: 14, trustDelta: 5 },
    },
    {
      id: `${startupName}-feed-rival`,
      month: 4,
      category: "rival",
      title: "Rival Move Detected",
      body: "NovaStack copied the positioning and undercut the launch narrative.",
      severity: "warning",
      source: "rival",
      effects: { brandRiskDelta: 6, investorDelta: -3 },
    },
    {
      id: `${startupName}-feed-board`,
      month: 5,
      category: "crisis",
      title: "Board Summons",
      body: "Investors demanded a burn plan after runway dipped under nine months.",
      severity: "critical",
      source: "investor",
      effects: { riskDelta: 5, investorDelta: -6 },
    },
  ];
}

function rivalProfiles() {
  return [
    {
      id: "demo-rival-novastack",
      name: "NovaStack",
      founder: {
        id: "demo-founder-mira-voss",
        name: "Mira Voss",
        personality: "aggressive category designer",
        archetype: "enterprise_killer",
        aggression: 86,
        ethics: 58,
        mediaSkill: 78,
        fundraisingSkill: 82,
        productSkill: 70,
        salesSkill: 88,
        catchphrase: "The market crowns the loudest proof.",
      },
      sector: "SaaS",
      stage: "seed",
      fundingStatus: "seed",
      cashEstimate: 1_800_000,
      valuationEstimate: 9_000_000,
      productProgress: 68,
      traction: 61,
      revenueEstimate: 85_000,
      hype: 74,
      trust: 57,
      risk: 48,
      investorHeat: 76,
      mediaPresence: 80,
      relationshipToPlayer: "hostile",
      rivalryScore: 88,
      activeNarrativeTags: ["positioning_war", "enterprise_push"],
      isDefeated: false,
      monthGenerated: 2,
      latestMoveMonth: 5,
      latestMoveType: "enterprise_push",
      latestMoveTitle: "NovaStack poaches two enterprise pilots",
    },
    {
      id: "demo-rival-lumenloop",
      name: "LumenLoop",
      founder: {
        id: "demo-founder-eli-tan",
        name: "Eli Tan",
        personality: "beloved community operator",
        archetype: "community_builder",
        aggression: 42,
        ethics: 82,
        mediaSkill: 84,
        fundraisingSkill: 58,
        productSkill: 63,
        salesSkill: 55,
      },
      sector: "SaaS",
      stage: "mvp",
      fundingStatus: "bootstrapped",
      cashEstimate: 340_000,
      valuationEstimate: 2_200_000,
      productProgress: 49,
      traction: 45,
      revenueEstimate: 24_000,
      hype: 62,
      trust: 79,
      risk: 30,
      investorHeat: 45,
      mediaPresence: 68,
      relationshipToPlayer: "respected",
      rivalryScore: 41,
      activeNarrativeTags: ["community_pressure"],
      isDefeated: true,
      monthGenerated: 2,
      latestMoveMonth: 4,
      latestMoveType: "viral_campaign",
      latestMoveTitle: "LumenLoop rallies the indie builder crowd",
    },
  ];
}

function rivalMoves() {
  return [
    {
      id: "demo-rival-move-001",
      rivalId: "demo-rival-novastack",
      rivalName: "NovaStack",
      month: 4,
      type: "copy_positioning",
      title: "NovaStack copies your compliance narrative",
      description: "Mira Voss reframed NovaStack around the same board-ready compliance promise.",
      playerEffects: { socialTrustDelta: -3, brandRiskDelta: 4, investorScoreDelta: -2 },
      rivalEffects: { rivalHypeDelta: 7, rivalTractionDelta: 5 },
      severity: "warning",
      feedCategory: "rival",
      tags: ["copycat", "positioning"],
    },
    {
      id: "demo-rival-move-002",
      rivalId: "demo-rival-novastack",
      rivalName: "NovaStack",
      month: 5,
      type: "enterprise_push",
      title: "NovaStack poaches two enterprise pilots",
      description: "A bundled services offer pulled attention away from your pilot pipeline.",
      playerEffects: { revenueDelta: -12_000, investorScoreDelta: -4, riskScoreDelta: 3 },
      rivalEffects: { rivalTractionDelta: 9, rivalHypeDelta: 5 },
      severity: "critical",
      feedCategory: "rival",
      tags: ["enterprise", "sales"],
    },
  ];
}

function strategySignals() {
  return [
    {
      id: "demo-signal-product-1",
      source: "monthly_decision",
      sourceId: "monthly_decision:ship-core-workflow:m2:product_led",
      month: 2,
      playstyle: "product_led",
      weight: 18,
      reason: "Shipped core workflow instead of buying attention.",
      tags: ["product", "retention"],
    },
    {
      id: "demo-signal-product-2",
      source: "social_action",
      sourceId: "social_action:customer-proof-thread:m3:product_led",
      month: 3,
      playstyle: "product_led",
      weight: 16,
      reason: "Turned customer proof into trust without overhyping.",
      tags: ["social", "proof"],
    },
    {
      id: "demo-signal-rival-1",
      source: "rival_counter_action",
      sourceId: "rival_counter_action:enterprise-proof-counter:m5:rival_killer",
      month: 5,
      playstyle: "rival_killer",
      weight: 20,
      reason: "Countered NovaStack with proof instead of a vanity launch.",
      tags: ["rival", "enterprise"],
    },
  ];
}

function boardroomState(openEvent = true) {
  const event = {
    id: "demo-boardroom-runway-crisis",
    startupId: getDemoScenario("midRun").id,
    month: 5,
    pressureType: "runway_crisis",
    severity: "high",
    title: "Runway Crisis Review",
    concern: "Burn expanded faster than the enterprise pilot pipeline.",
    boardQuestion: "What will you cut or prove before the next board meeting?",
    contextSummary: "Investor patience is thinning after a rival enterprise push.",
    responseOptions: [
      {
        id: "transparent-plan",
        title: "Present a transparent burn plan",
        stance: "transparent",
        description: "Show the board a 60-day plan tied to paid pilot conversion.",
        projectedEffects: { investorScoreDelta: 6, boardConfidenceDelta: 8, founderControlDelta: -2 },
        risk: "low",
        tags: ["trust", "runway"],
      },
    ],
    resolved: !openEvent,
    resolvedMonth: openEvent ? undefined : 6,
    appliedEffects: openEvent ? undefined : { investorScoreDelta: 6, boardConfidenceDelta: 8 },
    outcomeNarrative: openEvent ? undefined : "The board accepted a narrower plan and restored some confidence.",
    tags: ["runway", "investor_pressure"],
  };

  return {
    currentOpenEvent: openEvent ? event : null,
    eventHistory: [event],
    boardConfidence: openEvent ? 48 : 61,
    investorPatience: openEvent ? 42 : 54,
    founderControl: openEvent ? 74 : 72,
    pressureLevel: openEvent ? 78 : 46,
    lastTriggeredMonth: 5,
  };
}

async function createPitchFundingStack(
  tx: Prisma.TransactionClient,
  startupId: string,
  options: { amount: number; equity: string; score: number }
) {
  await tx.pitchDeck.create({
    data: {
      startupId,
      problem: "Enterprise teams lose deployment trust when launch, compliance, and support signals live in separate tools.",
      solution: "A tactical operating layer that turns customer proof, compliance work, and launch execution into one board-readable system.",
      marketSize: "The initial wedge is venture-backed software companies with compliance-heavy enterprise customers.",
      product: "A command console for customer proof, risk tracking, launch readiness, and investor-grade operating updates.",
      businessModel: "Subscription pricing with expansion seats for support, product, and founder teams.",
      goToMarket: "Founder-led pilots, customer proof loops, and enterprise operator communities.",
      competition: "Spreadsheets, project tools, and internal dashboards that do not model investor pressure.",
      team: "Technical founder, operator, and fractional GTM lead.",
      financialPlan: "Use seed capital to ship the pilot workflow, convert the first enterprise customers, and keep runway above 12 months.",
      ask: `$${options.amount.toLocaleString()} for ${options.equity}% equity`,
      useOfFunds: "Engineering velocity, customer pilots, founder-led sales, and operating runway.",
    },
  });

  const review = await tx.vcReview.create({
    data: {
      startupId,
      decision: "fund",
      memo: "Fundable demo scenario. The wedge is clear, the founder has a credible execution loop, and the next milestone is measurable.",
      scoreProblem: options.score,
      scoreSolution: options.score - 2,
      scoreMarket: options.score - 4,
      scoreTeam: options.score - 1,
      scoreBusiness: options.score - 3,
      overallScore: options.score,
      feedback: "Strong narrative and tactical founder-market fit. Watch burn discipline and pilot conversion.",
      proposedAmount: options.amount,
      proposedEquity: new Prisma.Decimal(options.equity),
      strengths: "Clear market wedge; strong founder proof; crisp first milestone.",
      weaknesses: "Enterprise cycle risk; category education required; runway discipline matters.",
      marketTiming: "Strong timing for AI-native operating software with compliance pressure.",
      milestones: "Convert 3 pilots, reach 70% product progress, keep runway above 9 months.",
      rawResponse: json({
        demo: true,
        committee: [
          { persona: "Operator VC", verdict: "fund", concern: "Pilot conversion speed" },
          { persona: "Skeptical CFO", verdict: "fund", concern: "Burn control" },
        ],
      }),
    },
  });

  const termSheet = await tx.termSheet.create({
    data: {
      startupId,
      vcReviewId: review.id,
      status: "accepted",
      proposedAmount: options.amount,
      proposedEquity: new Prisma.Decimal(options.equity),
      preMoneyValuation: Math.round(options.amount / (Number(options.equity) / 100)),
      postMoneyValuation: Math.round(options.amount / (Number(options.equity) / 100)) + options.amount,
      founderSalaryCap: 120_000,
      boardSeat: true,
      boardObserver: false,
      liquidationPreference: new Prisma.Decimal("1.0"),
      proRataRights: true,
      milestoneRequirements: "Maintain runway discipline and report pilot conversion monthly.",
      investorNotes: "Seeded demo term sheet. Fictional and deterministic.",
      negotiationHistory: json([{ action: "accepted", month: 0, demo: true }]),
    },
  });

  await tx.fundingRound.create({
    data: {
      startupId,
      vcReviewId: review.id,
      termSheetId: termSheet.id,
      roundType: "pre_seed",
      amountRaised: options.amount,
      equitySold: new Prisma.Decimal(options.equity),
      preMoneyValuation: termSheet.preMoneyValuation,
      postMoneyValuation: termSheet.postMoneyValuation,
      investorName: "Arena Capital",
      status: "closed",
      closedAt: baseDate,
    },
  });
}

async function createStartupBase(
  tx: Prisma.TransactionClient,
  userId: string,
  data: {
    id: string;
    name: string;
    tagline: string;
    sector: string;
    region: string;
    stage: string;
    status: string;
    cash: number;
    revenue: number;
    valuation: number;
    productProgress: number;
    investorScore: number;
    marketScore: number;
    riskScore: number;
    publicSlug?: string;
    finalOutcome?: string;
    finalSummary?: string;
    finalScore?: number;
    completedAt?: Date;
    deathReason?: string;
  }
) {
  await tx.startup.create({
    data: {
      id: data.id,
      userId,
      name: data.name,
      tagline: data.tagline,
      description: data.tagline,
      sector: data.sector,
      region: data.region,
      stage: data.stage,
      targetMarket: "Founder-led software teams and venture-backed operators",
      monetizationModel: "Subscription SaaS with expansion seats",
      status: data.status,
      problem: "Teams need a deterministic operating loop that turns startup chaos into board-readable execution signals.",
      solution: "Founder Arena models the company as a pressure system: funding, hiring, product, social, rivals, boardroom, and legacy.",
      unfairAdvantage: "The demo founder has deep startup operating context and ships under investor pressure.",
      fundingAsk: 750_000,
      cash: data.cash,
      revenue: data.revenue,
      valuation: data.valuation,
      productProgress: data.productProgress,
      investorScore: data.investorScore,
      marketScore: data.marketScore,
      riskScore: data.riskScore,
      workSetup: "remote",
      teamMorale: 78,
      teamProductivity: new Prisma.Decimal("1.08"),
      publicSlug: data.publicSlug,
      finalOutcome: data.finalOutcome,
      finalSummary: data.finalSummary,
      finalScore: data.finalScore,
      completedAt: data.completedAt,
      deathReason: data.deathReason,
      aiAnalysis: json({
        demo: true,
        classification: { type: "ai_saas", complexity: "medium" },
        marketExposure: {
          tailwinds: ["AI operating software", "enterprise compliance pressure"],
          headwinds: ["long sales cycles", "category education"],
        },
      }),
    },
  });
}

async function createEmployees(tx: Prisma.TransactionClient, startupId: string, count: number) {
  const roster = [
    ["Ari Kim", "Founding Engineer", "senior", 168_000, "engineering"],
    ["Maya Chen", "Product Operator", "senior", 142_000, "product"],
    ["Noah Patel", "Growth Lead", "mid", 126_000, "growth"],
    ["Jules Rivera", "Customer Engineer", "mid", 118_000, "customer"],
  ] as const;

  for (const [index, employee] of roster.slice(0, count).entries()) {
    const [name, role, seniority, salary, skill] = employee;
    await tx.employee.create({
      data: {
        startupId,
        name,
        role,
        level: seniority === "senior" ? "L4" : "L3",
        seniority,
        salary,
        skill,
        morale: 72 + index * 4,
        hiredMonth: Math.max(1, index + 1),
        productivity: new Prisma.Decimal(index === 0 ? "1.18" : "1.06"),
        effectJson: json({ demo: true, capability: skill }),
        notes: "Seeded fictional demo employee.",
      },
    });
  }

  await recomputeStartupBaseBurn(tx, startupId);
}

async function createSimulationHistory(
  tx: Prisma.TransactionClient,
  startupId: string,
  months: number,
  options: { deadAt?: number; breakout?: boolean }
) {
  let cash = options.breakout ? 760_000 : 610_000;
  let revenue = options.breakout ? 18_000 : 9_000;
  let valuation = options.breakout ? 3_200_000 : 2_100_000;

  for (let month = 1; month <= months; month += 1) {
    const burnRate = options.deadAt ? 112_000 + month * 9_000 : 86_000 + month * 5_000;
    const revenueDelta = options.breakout ? 16_000 + month * 3_500 : 8_000 + month * 2_500;
    const cashStart = cash;
    revenue += revenueDelta;
    cash = cash + revenueDelta - burnRate;
    valuation += revenueDelta * (options.breakout ? 18 : 12);
    const isDead = options.deadAt === month;

    await tx.simulationMonth.create({
      data: {
        startupId,
        monthNumber: month,
        cashStart,
        cashEnd: cash,
        burnRate,
        revenue,
        runwayMonths: Math.max(0, Math.floor(cash / Math.max(1, burnRate))),
        productProgress: Math.min(100, 18 + month * (options.breakout ? 7 : 5)),
        productProgressBefore: Math.max(0, 18 + (month - 1) * (options.breakout ? 7 : 5)),
        userGrowth: 120 + month * 85,
        employeeCount: month < 3 ? 2 : 4,
        marketingSpend: 8_000 + month * 1_500,
        productSpend: 18_000 + month * 2_000,
        hiringSpend: month === 2 || month === 4 ? 12_000 : 0,
        valuation,
        investorScoreBefore: 58 + month,
        investorScoreAfter: Math.min(95, 61 + month * 2),
        marketScoreBefore: 62,
        marketScoreAfter: 64,
        riskScoreBefore: 38 + month,
        riskScoreAfter: isDead ? 96 : Math.min(70, 40 + month * 2),
        status: isDead ? "dead" : month === 12 ? "completed" : "active",
        marketCondition: month % 3 === 0 ? "volatile" : "neutral",
        eventsTriggered: month === 5 ? ["boardroom_runway_crisis", "rival_enterprise_push"] : [],
        eventTitle: month === 5 ? "Board and rival pressure converged" : null,
        eventSummary: month === 5 ? "Investor patience tightened after a rival enterprise push." : null,
        decisions: json({
          primary: month % 2 === 0 ? "ship_product" : "enterprise_sales",
          demo: true,
        }),
        decisionsLocked: true,
        metadata: json({
          demo: true,
          boardUpdate: month === 5 ? "Board confidence fell, but the response path stayed open." : undefined,
          socialHighlight: month === 3 ? "Customer proof thread went viral." : undefined,
          rivalHighlight: month === 5 ? "NovaStack escalated enterprise pressure." : undefined,
        }),
        createdAt: monthsAfter(month),
      },
    });
  }
}

async function seedScenarioData(tx: Prisma.TransactionClient, userId: string) {
  await createStartupBase(tx, userId, {
    id: getDemoScenario("active").id,
    name: getDemoScenario("active").startupName,
    tagline: "Board-ready launch operations for AI-native teams.",
    sector: "AI / ML",
    region: "Remote / Global",
    stage: "seed",
    status: "funded",
    cash: 750_000,
    revenue: 0,
    valuation: 5_800_000,
    productProgress: 22,
    investorScore: 68,
    marketScore: 72,
    riskScore: 34,
  });
  await createPitchFundingStack(tx, getDemoScenario("active").id, {
    amount: 750_000,
    equity: "12.50",
    score: 76,
  });
  await createEmployees(tx, getDemoScenario("active").id, 2);
  await tx.socialState.create({
    data: {
      startupId: getDemoScenario("active").id,
      followers: 120,
      hype: 24,
      trust: 54,
      sentiment: 55,
      founderReputation: 38,
      feedItems: json([]),
      actionsTaken: json([]),
      rivalProfiles: json([]),
      rivalMoveHistory: json([]),
      strategySignals: json([]),
      boardroomState: json({ currentOpenEvent: null, eventHistory: [], boardConfidence: 61, investorPatience: 70, founderControl: 82, pressureLevel: 12, lastTriggeredMonth: null }),
    },
  });

  await createStartupBase(tx, userId, {
    id: getDemoScenario("midRun").id,
    name: getDemoScenario("midRun").startupName,
    tagline: "Infrastructure command center for high-pressure product teams.",
    sector: "SaaS",
    region: "North America",
    stage: "seed",
    status: "active",
    cash: 420_000,
    revenue: 126_000,
    valuation: 7_600_000,
    productProgress: 63,
    investorScore: 61,
    marketScore: 66,
    riskScore: 57,
  });
  await createPitchFundingStack(tx, getDemoScenario("midRun").id, {
    amount: 900_000,
    equity: "14.00",
    score: 74,
  });
  await createEmployees(tx, getDemoScenario("midRun").id, 4);
  await createSimulationHistory(tx, getDemoScenario("midRun").id, 6, {});
  await tx.socialState.create({
    data: {
      startupId: getDemoScenario("midRun").id,
      followers: 8_740,
      hype: 71,
      trust: 58,
      sentiment: 61,
      brandRisk: 34,
      viralMomentum: 48,
      founderReputation: 63,
      communityStrength: 46,
      feedItems: json(socialFeed(getDemoScenario("midRun").startupName)),
      actionsTaken: json([
        {
          month: 3,
          actionId: "customer-proof-thread",
          postId: "demo-post-001",
          effects: { followersDelta: 4200, hypeDelta: 14, trustDelta: 5 },
          didBackfire: false,
        },
      ]),
      lastActionMonth: 5,
      rivalProfiles: json(rivalProfiles()),
      rivalMoveHistory: json(rivalMoves()),
      strategySignals: json(strategySignals()),
      boardroomState: json(boardroomState(true)),
    },
  });

  await createStartupBase(tx, userId, {
    id: getDemoScenario("finalized").id,
    name: getDemoScenario("finalized").startupName,
    tagline: "Civic infrastructure graph for compliance-heavy AI deployments.",
    sector: "SaaS",
    region: "Remote / Global",
    stage: "growth",
    status: "completed",
    cash: 1_480_000,
    revenue: 1_420_000,
    valuation: 18_400_000,
    productProgress: 96,
    investorScore: 88,
    marketScore: 80,
    riskScore: 26,
    publicSlug: getDemoScenario("finalized").publicSlug,
    finalOutcome: "BREAKOUT",
    finalSummary: "CivicGraph survived rival pressure, restored board confidence, and turned customer proof into a breakout arena run.",
    finalScore: 1290,
    completedAt: monthsAfter(12),
  });
  await createPitchFundingStack(tx, getDemoScenario("finalized").id, {
    amount: 1_100_000,
    equity: "13.00",
    score: 82,
  });
  await createEmployees(tx, getDemoScenario("finalized").id, 4);
  await createSimulationHistory(tx, getDemoScenario("finalized").id, 12, { breakout: true });
  await tx.socialState.create({
    data: {
      startupId: getDemoScenario("finalized").id,
      followers: 28_600,
      hype: 84,
      trust: 76,
      sentiment: 78,
      brandRisk: 18,
      viralMomentum: 66,
      founderReputation: 82,
      communityStrength: 71,
      feedItems: json(socialFeed(getDemoScenario("finalized").startupName)),
      actionsTaken: json([{ month: 8, actionId: "transparent-scale-memo", postId: "demo-post-002", effects: { trustDelta: 8, hypeDelta: 7 }, didBackfire: false }]),
      lastActionMonth: 11,
      rivalProfiles: json(rivalProfiles().map((rival) => ({ ...rival, isDefeated: true, relationshipToPlayer: "defeated" }))),
      rivalMoveHistory: json(rivalMoves()),
      strategySignals: json(strategySignals()),
      boardroomState: json(boardroomState(false)),
    },
  });

  await createStartupBase(tx, userId, {
    id: getDemoScenario("dead").id,
    name: getDemoScenario("dead").startupName,
    tagline: "Consumer remittance wallet that outran trust and compliance.",
    sector: "Fintech",
    region: "Latin America",
    stage: "seed",
    status: "dead",
    cash: -24_000,
    revenue: 84_000,
    valuation: 720_000,
    productProgress: 42,
    investorScore: 28,
    marketScore: 51,
    riskScore: 96,
    publicSlug: getDemoScenario("dead").publicSlug,
    finalOutcome: "DEAD",
    finalSummary: "FablePay chased attention faster than trust and ran out of room after a brand crisis.",
    finalScore: 180,
    completedAt: monthsAfter(8),
    deathReason: "Runway collapsed after brand risk and compliance pressure spiked.",
  });
  await createPitchFundingStack(tx, getDemoScenario("dead").id, {
    amount: 500_000,
    equity: "15.00",
    score: 61,
  });
  await createEmployees(tx, getDemoScenario("dead").id, 3);
  await createSimulationHistory(tx, getDemoScenario("dead").id, 8, { deadAt: 8 });
  await tx.socialState.create({
    data: {
      startupId: getDemoScenario("dead").id,
      followers: 12_400,
      hype: 65,
      trust: 22,
      sentiment: 28,
      brandRisk: 87,
      viralMomentum: 12,
      founderReputation: 31,
      communityStrength: 24,
      feedItems: json([
        {
          id: "demo-dead-feed-crisis",
          month: 7,
          category: "crisis",
          title: "Brand Crisis",
          body: "A rushed launch triggered trust collapse before compliance proof was ready.",
          severity: "critical",
          source: "journalist",
          effects: { trustDelta: -22, brandRiskDelta: 31, investorDelta: -14 },
        },
      ]),
      actionsTaken: json([{ month: 7, actionId: "hype-launch", postId: "demo-post-003", effects: { hypeDelta: 18, brandRiskDelta: 31 }, didBackfire: true }]),
      lastActionMonth: 7,
      rivalProfiles: json([]),
      rivalMoveHistory: json([]),
      strategySignals: json([
        {
          id: "demo-dead-signal-blitz",
          source: "social_action",
          sourceId: "social_action:hype-launch:m7:capital_blitzscaler",
          month: 7,
          playstyle: "capital_blitzscaler",
          weight: 20,
          reason: "Bought attention before trust existed.",
          tags: ["hype", "risk"],
        },
      ]),
      boardroomState: json({ currentOpenEvent: null, eventHistory: [], boardConfidence: 18, investorPatience: 10, founderControl: 48, pressureLevel: 96, lastTriggeredMonth: 7 }),
    },
  });
}

async function seedLeaderboard(tx: Prisma.TransactionClient, userId: string) {
  const entries = [
    {
      startupId: getDemoScenario("finalized").id,
      score: 1290,
      valuation: 18_400_000,
      revenue: 1_420_000,
      survivalMonths: 12,
      outcome: "BREAKOUT",
      rank: 3,
      category: "overall",
    },
    {
      startupId: getDemoScenario("finalized").id,
      score: 1180,
      valuation: 18_400_000,
      revenue: 1_420_000,
      survivalMonths: 12,
      outcome: "BREAKOUT",
      rank: 2,
      category: "saas",
    },
    {
      startupId: getDemoScenario("finalized").id,
      score: 980,
      valuation: 18_400_000,
      revenue: 1_420_000,
      survivalMonths: 12,
      outcome: "BREAKOUT",
      rank: 4,
      category: "valuation",
    },
    {
      startupId: getDemoScenario("dead").id,
      score: 180,
      valuation: 720_000,
      revenue: 84_000,
      survivalMonths: 8,
      outcome: "DEAD",
      rank: 21,
      category: "overall",
    },
  ];

  for (const entry of entries) {
    await tx.leaderboardEntry.upsert({
      where: {
        startupId_category_season: {
          startupId: entry.startupId,
          category: entry.category,
          season: DEMO_SEASON,
        },
      },
      create: {
        ...entry,
        userId,
        season: DEMO_SEASON,
        completedAt: monthsAfter(entry.startupId === getDemoScenario("dead").id ? 8 : 12),
        metadata: json({ demo: true, presenterSafe: true }),
      },
      update: {
        ...entry,
        userId,
        completedAt: monthsAfter(entry.startupId === getDemoScenario("dead").id ? 8 : 12),
        metadata: json({ demo: true, presenterSafe: true }),
      },
    });
  }
}

async function main() {
  assertSafeEnvironment();

  await prisma.$transaction(
    async (tx) => {
      await deleteDemoRecords(tx);

      if (resetOnly) {
        return;
      }

      const user = await seedUserAndProfile(tx);
      await seedScenarioData(tx, user.id);
      await seedLeaderboard(tx, user.id);
    },
    { maxWait: 5_000, timeout: 30_000 }
  );

  if (resetOnly) {
    console.log("Founder Arena demo records reset. Only fixed demo records were removed.");
  } else {
    console.log(`Founder Arena demo data seeded for ${DEMO_USER_EMAIL}.`);
    console.log(`Scenarios: ${DEMO_SCENARIOS.map((scenario) => scenario.id).join(", ")}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
