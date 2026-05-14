"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireCurrentUser } from "@/lib/auth-helpers";
import {
  generateCandidates,
  generateCandidateAtIndex,
  getCanonicalCandidateValues,
  CANDIDATE_POOL_SIZE,
} from "@/lib/team/candidates";
import { Candidate } from "@/lib/team/types";
import {
  getOfficeSetup,
  calculateHiringCapacity,
  canAffordHire,
  checkResignationRisk,
  calculateTeamMonthlyCost,
  calculateTeamProductivity,
  calculateTeamMorale,
} from "@/lib/team/effects";
import { estimateHireImpact } from "@/lib/economy/cost-engine";
import { recomputeStartupBaseBurn } from "@/lib/economy/recompute-burn";
import { getActiveMission } from "@/lib/missions/mission-progress";
import { getOrCreateFounderProfile } from "@/lib/game/founder-progression";
import { evaluateAchievementsForHire } from "@/lib/game/achievements";
import { checkRateLimit } from "@/lib/rate-limit";

export async function getTeamState(startupId: string) {
  const user = await requireCurrentUser();

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: {
      employees: true,
      simulationMonths: { orderBy: { monthNumber: "desc" }, take: 1 },
      missions: { orderBy: { sequence: "asc" } },
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Startup not found");
  }

  const currentMonth = startup.simulationMonths[0]?.monthNumber ?? 0;
  const candidates = generateCandidates(startupId, currentMonth + 1, startup.sector);

  // Phase 24: Enrich candidates with cost-engine values + mission relevance.
  // Cost engine + salary-bands are the single source of truth.
  const activeMission = getActiveMission(
    startup.missions.map((m) => ({
      ...m,
      requiredRoles: (m.requiredRoles as unknown as import("@/lib/missions/types").RequiredRole[]) ?? [],
      optionalRoles: (m.optionalRoles as unknown as import("@/lib/missions/types").RequiredRole[]) ?? [],
      requiredCapabilities: (m.requiredCapabilities as unknown as string[]) ?? [],
      metadata: (m.metadata as Record<string, unknown> | null) ?? {},
    }))
  );
  const requiredMissionRoles = new Set(
    (activeMission?.requiredRoles as import("@/lib/missions/types").RequiredRole[] | undefined)?.map((r) => r.role) ?? []
  );

  const candidatesWithCosts = candidates.map((c) => {
    const canonical = getCanonicalCandidateValues(c, startup.region);
    const impact = estimateHireImpact(
      startup.cash,
      startup.monthlyBurn,
      startup.revenue,
      c.role,
      c.seniority,
      startup.region
    );
    const relevance: Candidate["missionRelevance"] = requiredMissionRoles.has(c.role)
      ? "critical"
      : (activeMission?.requiredCapabilities as string[] | undefined)?.includes(c.skill)
      ? "helpful"
      : "neutral";
    return {
      ...c,
      // Overlay all economy fields with canonical values so display matches
      // what the server will charge at hire time.
      salary: canonical.salary,
      skill: canonical.skill,
      moraleImpact: canonical.moraleImpact,
      burnImpact: canonical.burnImpact,
      productImpact: canonical.productImpact,
      revenueImpact: canonical.revenueImpact,
      riskImpact: canonical.riskImpact,
      investorImpact: canonical.investorImpact,
      allInAnnual: canonical.allInAnnual,
      monthlyBurn: canonical.monthlyBurn,
      runwayAfter: impact.runwayAfter,
      missionRelevance: relevance,
    };
  });

  const capacity = calculateHiringCapacity({
    cash: startup.cash,
    monthlyBurn: startup.monthlyBurn,
    employees: startup.employees,
  });

  const officeSetup = getOfficeSetup(startup.workSetup);
  const payroll = calculateTeamMonthlyCost(
    startup.employees.filter((e) => e.status === "active"),
    officeSetup.monthlyCost
  );
  const productivity = calculateTeamProductivity(startup.employees, officeSetup);
  const morale = calculateTeamMorale(startup.employees, officeSetup);

  const resignRisk = checkResignationRisk(
    startup.employees,
    Math.floor(startup.cash / Math.max(startup.monthlyBurn, 1))
  );

  return {
    startup,
    currentMonth,
    candidates: candidatesWithCosts,
    capacity,
    payroll,
    productivity,
    morale,
    resignRisk,
    officeSetup,
  };
}

/**
 * Hire an employee.
 *
 * SECURITY: this action accepts only the deterministic `candidateId` (the
 * server-issued ID from the candidate pool). All gameplay/economy values
 * (salary, impacts, skill) are recomputed server-side from the salary
 * bands, region multipliers, and overhead. Any extra fields supplied by
 * the client are IGNORED.
 *
 * Backwards-compat: if the client posts a full Candidate object, only
 * `id` is read.
 */
export async function hireEmployeeAction(
  startupId: string,
  candidateOrId: string | { id: string }
) {
  const user = await requireCurrentUser();

  const rateLimitError = await checkRateLimit(user.id, "teamAction");
  if (rateLimitError) {
    throw new Error(rateLimitError);
  }

  const candidateId =
    typeof candidateOrId === "string" ? candidateOrId : candidateOrId?.id;
  if (typeof candidateId !== "string" || !candidateId.startsWith("cand-")) {
    throw new Error("Invalid candidate.");
  }

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: {
      employees: true,
      simulationMonths: { orderBy: { monthNumber: "desc" }, take: 1 },
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  if (startup.status !== "funded" && startup.status !== "active") {
    throw new Error("Startup is not in operating phase");
  }

  // Parse candidateId of form "cand-<month>-<index>"
  const match = candidateId.match(/^cand-(\d+)-(\d+)$/);
  if (!match) {
    throw new Error("Invalid candidate id format.");
  }
  const expectedMonth = (startup.simulationMonths[0]?.monthNumber ?? 0) + 1;
  const candidateMonth = Number(match[1]);
  const candidateIndex = Number(match[2]);

  // Reject candidates from other months — the candidate pool rotates.
  if (candidateMonth !== expectedMonth) {
    throw new Error("Candidate is no longer available.");
  }
  if (
    !Number.isInteger(candidateIndex) ||
    candidateIndex < 0 ||
    candidateIndex >= CANDIDATE_POOL_SIZE
  ) {
    throw new Error("Candidate not in pool.");
  }

  // Server-regenerated identity (deterministic from startupId/month/index).
  const generated = generateCandidateAtIndex(
    startupId,
    expectedMonth,
    startup.sector,
    candidateIndex
  );
  if (!generated || generated.id !== candidateId) {
    throw new Error("Candidate not found in pool.");
  }

  // Server-canonical economy values (cost engine + salary bands).
  const canonical = getCanonicalCandidateValues(generated, startup.region);

  const affordCheck = canAffordHire(startup, canonical.salary);
  if (!affordCheck.canAfford) {
    throw new Error(affordCheck.warning ?? "Cannot afford this hire");
  }

  await db.$transaction(async (tx) => {
    await tx.employee.create({
      data: {
        startupId,
        name: generated.name,
        role: generated.role,
        level: generated.seniority,
        seniority: generated.seniority,
        salary: canonical.salary,
        skill: canonical.skill,
        morale: 70 + canonical.moraleImpact,
        status: "active",
        hiredMonth: expectedMonth,
        hiredAt: new Date(),
        effectJson: {
          productImpact: canonical.productImpact,
          revenueImpact: canonical.revenueImpact,
          riskImpact: canonical.riskImpact,
          investorImpact: canonical.investorImpact,
        } as unknown as Prisma.InputJsonValue,
        notes: generated.bio,
      },
    });

    // Single source of truth for burn invariant.
    await recomputeStartupBaseBurn(tx, startupId);
  });

  // Grant hire achievements (best-effort, non-transactional).
  try {
    const profile = await getOrCreateFounderProfile(startup.userId);
    const activeCount =
      startup.employees.filter((e) => e.status === "active").length + 1;
    await evaluateAchievementsForHire(profile.id, activeCount);
  } catch {
    // achievements are best-effort
  }

  revalidatePath(`/startup/${startupId}/team`);
  revalidatePath(`/startup/${startupId}/operate`);
  return { success: true };
}

export async function fireEmployeeAction(startupId: string, employeeId: string) {
  const user = await requireCurrentUser();

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: {
      employees: true,
      simulationMonths: { orderBy: { monthNumber: "desc" }, take: 1 },
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  if (startup.status !== "funded" && startup.status !== "active") {
    throw new Error("Startup is not in operating phase");
  }

  const employee = startup.employees.find((e) => e.id === employeeId);
  if (!employee) {
    throw new Error("Employee not found");
  }
  if (employee.status !== "active") {
    throw new Error("Employee is not active");
  }

  await db.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id: employeeId },
      data: {
        status: "fired",
        firedAt: new Date(),
        firedMonth: (startup.simulationMonths[0]?.monthNumber ?? 0) + 1,
        notes: `${employee.notes ?? ""}\nFired on ${new Date().toLocaleDateString()}.`,
      },
    });
    await recomputeStartupBaseBurn(tx, startupId);
  });

  revalidatePath(`/startup/${startupId}/team`);
  revalidatePath(`/startup/${startupId}/operate`);
  return { success: true };
}

export async function changeOfficeSetupAction(startupId: string, setupType: string) {
  const user = await requireCurrentUser();

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    select: { id: true, userId: true, status: true },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Only allow office changes for actively operating startups.
  // Dead, completed, acquired, and draft startups must not mutate game economics.
  if (startup.status !== "funded" && startup.status !== "active") {
    throw new Error("Cannot change office setup: startup is not in operating phase");
  }

  // Validate setupType is a known office type by asking the helper.
  const setup = getOfficeSetup(setupType);
  if (setup.type !== setupType) {
    throw new Error("Unknown office setup");
  }

  await db.$transaction(async (tx) => {
    await tx.startup.update({
      where: { id: startupId },
      data: { workSetup: setupType },
    });
    await recomputeStartupBaseBurn(tx, startupId);
  });

  revalidatePath(`/startup/${startupId}/team`);
  revalidatePath(`/startup/${startupId}/operate`);
  return { success: true };
}
