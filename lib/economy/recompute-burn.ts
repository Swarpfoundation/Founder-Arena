/**
 * Founder Arena — Burn invariant helper
 *
 * Single source of truth for `startup.monthlyBurn` and `startup.officeMonthlyCost`.
 *
 * Definition (matches lib/simulation/engine.ts and lib/economy/cost-engine.ts):
 *   baseBurn  = sum(active employee salaries) + office.monthlyCost
 *   trueBurn  = baseBurn + sector operating costs + active mission cost (computed at sim time)
 *
 * `startup.monthlyBurn` stores baseBurn ONLY. Operating + mission costs are
 * recomputed every simulation month from current state. This is intentional —
 * see lib/actions/simulation.ts (recurringBurn writeback) and the cost engine.
 *
 * Call this helper after every team or office mutation, and on funding accept.
 */

import type { Prisma, PrismaClient } from "@prisma/client";
import { getOfficeCost } from "./office-costs";

type Db = PrismaClient | Prisma.TransactionClient;

export interface RecomputeResult {
  payrollMonthly: number;
  officeMonthly: number;
  baseBurn: number;
  workSetup: string;
}

export async function recomputeStartupBaseBurn(
  db: Db,
  startupId: string
): Promise<RecomputeResult> {
  const startup = await db.startup.findUnique({
    where: { id: startupId },
    select: { workSetup: true },
  });

  if (!startup) {
    throw new Error(`Startup ${startupId} not found while recomputing burn`);
  }

  // Persisted salaries are the authoritative number; they were already
  // server-computed at hire time via the cost engine.
  const activeEmployees = await db.employee.findMany({
    where: { startupId, status: "active" },
    select: { salary: true },
  });

  const payrollMonthly = activeEmployees.reduce((sum, e) => sum + e.salary, 0);
  const office = getOfficeCost(startup.workSetup);
  const officeMonthly = office.monthlyCost;
  const baseBurn = payrollMonthly + officeMonthly;

  await db.startup.update({
    where: { id: startupId },
    data: {
      monthlyBurn: baseBurn,
      officeMonthlyCost: officeMonthly,
    },
  });

  return {
    payrollMonthly,
    officeMonthly,
    baseBurn,
    workSetup: startup.workSetup,
  };
}
