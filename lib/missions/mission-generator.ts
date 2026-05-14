/**
 * Founder Arena — Mission Roadmap Generator
 *
 * Generates a custom 12-month mission roadmap for each startup.
 */

import { MissionTemplate, MissionInstance, MissionRoadmap, StartupClassification } from "./types";
import { MISSION_LIBRARY } from "./mission-library";
import { getRolesForMission } from "./role-requirements";
import { db } from "@/lib/db";

const STAGE_COMPATIBILITY: Record<string, string[]> = {
  idea: ["idea", "pre_seed"],
  pre_seed: ["idea", "pre_seed", "seed"],
  seed: ["pre_seed", "seed", "series_a"],
  series_a: ["seed", "series_a", "series_b"],
  series_b: ["series_a", "series_b", "growth"],
  growth: ["series_b", "growth"],
};

export function generateMissionRoadmap(
  startupId: string,
  classification: StartupClassification,
  sector: string,
  stage: string
): MissionRoadmap {
  const compatibleStages = STAGE_COMPATIBILITY[stage] ?? [stage];
  const allTemplates = MISSION_LIBRARY.filter((m) => {
    const typeMatch = m.startupTypes.some((t) => classification.primaryStartupType.includes(t) || t.includes(classification.primaryStartupType));
    const sectorMatch = m.sectors.some((s) => sector.toLowerCase().includes(s.toLowerCase()));
    const stageMatch = m.stages.some((s) => compatibleStages.includes(s));
    return (typeMatch || sectorMatch) && stageMatch;
  });

  // Deduplicate by ID
  const seen = new Set<string>();
  const uniqueTemplates: MissionTemplate[] = [];
  for (const t of allTemplates) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      uniqueTemplates.push(t);
    }
  }

  // Select 6–10 missions, ensuring variety of categories
  const selected = selectBalancedMissions(uniqueTemplates, classification, 10);

  // Build instances
  const instances: MissionInstance[] = selected.map((t, i) => {
    const roleSet = getRolesForMission(t.category, classification.primaryStartupType);
    const monthStart = t.minMonth ?? i * 1 + 1;
    const monthEnd = t.maxMonth ?? monthStart + t.durationMonths;

    return {
      id: `mission-${startupId}-${t.id}`,
      startupId,
      templateId: t.id,
      title: t.title,
      category: t.category,
      status: i === 0 ? "active" : "pending",
      sequence: i + 1,
      monthStart,
      monthEnd,
      requiredRoles: roleSet.required,
      optionalRoles: roleSet.optional,
      requiredCapabilities: roleSet.capabilities,
      estimatedCost: t.estimatedCost,
      monthlyCostDelta: t.monthlyCostDelta,
      progress: i === 0 ? 10 : 0,
      successScore: null,
      effects: null,
      aiSummary: null,
      metadata: {
        complexity: t.complexity,
        risk: t.risk,
        successMetrics: t.successMetrics,
        failureRisks: t.failureRisks,
        effectsOnComplete: t.effectsOnComplete,
        effectsOnFail: t.effectsOnFail,
      },
    };
  });

  return {
    startupId,
    classification,
    missions: instances,
    generatedAt: new Date().toISOString(),
  };
}

function selectBalancedMissions(
  templates: MissionTemplate[],
  classification: StartupClassification,
  maxCount: number
): MissionTemplate[] {
  // Group by category
  const byCategory = new Map<string, MissionTemplate[]>();
  for (const t of templates) {
    const list = byCategory.get(t.category) ?? [];
    list.push(t);
    byCategory.set(t.category, list);
  }

  // Prioritize categories based on startup type intensity
  const categoryPriority: string[] = [];
  if (classification.technicalIntensity >= 7) categoryPriority.push("ai_model", "engineering", "infrastructure");
  if (classification.regulatoryIntensity >= 7) categoryPriority.push("compliance", "security");
  if (classification.salesIntensity >= 7) categoryPriority.push("sales", "growth", "partnership");
  if (classification.capitalIntensity >= 7) categoryPriority.push("fundraising");
  categoryPriority.push("product", "launch", "research", "operations", "marketing");

  const selected: MissionTemplate[] = [];
  const usedIds = new Set<string>();

  // Round-robin pick from priority categories
  for (const cat of categoryPriority) {
    if (selected.length >= maxCount) break;
    const list = byCategory.get(cat) ?? [];
    for (const t of list) {
      if (selected.length >= maxCount) break;
      if (!usedIds.has(t.id)) {
        selected.push(t);
        usedIds.add(t.id);
      }
    }
  }

  // Fill remaining with any available
  for (const t of templates) {
    if (selected.length >= maxCount) break;
    if (!usedIds.has(t.id)) {
      selected.push(t);
      usedIds.add(t.id);
    }
  }

  // Sort by recommended month
  return selected.sort((a, b) => (a.minMonth ?? 0) - (b.minMonth ?? 0));
}

export function persistRoadmapToDb(
  startupId: string,
  roadmap: MissionRoadmap
): import("@prisma/client").Prisma.PrismaPromise<import("@prisma/client").Mission>[] {
  return roadmap.missions.map((m) =>
    db.mission.create({
      data: {
        startupId,
        title: m.title,
        category: m.category,
        status: m.status,
        sequence: m.sequence,
        monthStart: m.monthStart,
        monthEnd: m.monthEnd,
        requiredRoles: m.requiredRoles as unknown as import("@prisma/client").Prisma.InputJsonValue,
        optionalRoles: m.optionalRoles as unknown as import("@prisma/client").Prisma.InputJsonValue,
        requiredCapabilities: m.requiredCapabilities as unknown as import("@prisma/client").Prisma.InputJsonValue,
        estimatedCost: m.estimatedCost,
        monthlyCostDelta: m.monthlyCostDelta,
        progress: m.progress,
        metadata: m.metadata as unknown as import("@prisma/client").Prisma.InputJsonValue,
      },
    })
  );
}
