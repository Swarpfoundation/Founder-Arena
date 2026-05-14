/**
 * Founder Arena — Role Requirements by Mission & Startup Type
 */

import { RequiredRole } from "./types";

export interface RoleRequirementSet {
  required: RequiredRole[];
  optional: RequiredRole[];
  capabilities: string[];
}

export function getRolesForMission(
  missionCategory: string,
  startupType: string
): RoleRequirementSet {
  const base: RoleRequirementSet = { required: [], optional: [], capabilities: [] };

  switch (missionCategory) {
    case "product":
      base.required = [{ role: "Product Manager", seniority: "mid", count: 1 }];
      base.optional = [
        { role: "Product Designer", seniority: "mid", count: 1 },
        { role: "Full-stack Engineer", seniority: "mid", count: 1 },
      ];
      base.capabilities = ["product_vision", "user_research", " prototyping"];
      break;
    case "engineering":
      base.required = [{ role: "Full-stack Engineer", seniority: "mid", count: 1 }];
      base.optional = [
        { role: "Backend Engineer", seniority: "mid", count: 1 },
        { role: "Frontend Engineer", seniority: "mid", count: 1 },
      ];
      base.capabilities = ["system_design", "scalability", "code_quality"];
      break;
    case "ai_model":
      base.required = [{ role: "AI Engineer", seniority: "senior", count: 1 }];
      base.optional = [
        { role: "Data Engineer", seniority: "mid", count: 1 },
        { role: "Domain Advisor", seniority: "senior", count: 1 },
      ];
      base.capabilities = ["model_training", "eval_harness", "data_pipeline"];
      break;
    case "compliance":
      base.required = [{ role: "Compliance Advisor", seniority: "senior", count: 1 }];
      base.optional = [
        { role: "Security Engineer", seniority: "mid", count: 1 },
        { role: "Finance/Ops Manager", seniority: "mid", count: 1 },
      ];
      base.capabilities = ["regulatory_knowledge", "audit_readiness", "documentation"];
      break;
    case "security":
      base.required = [{ role: "Security Engineer", seniority: "senior", count: 1 }];
      base.optional = [
        { role: "Backend Engineer", seniority: "mid", count: 1 },
        { role: "Compliance Advisor", seniority: "mid", count: 1 },
      ];
      base.capabilities = ["threat_modeling", "penetration_testing", "incident_response"];
      break;
    case "sales":
      base.required = [{ role: "Sales Lead", seniority: "senior", count: 1 }];
      base.optional = [
        { role: "Marketing Manager", seniority: "mid", count: 1 },
        { role: "Customer Support", seniority: "mid", count: 1 },
      ];
      base.capabilities = ["pipeline_management", "enterprise_sales", "negotiation"];
      break;
    case "marketing":
      base.required = [{ role: "Marketing Manager", seniority: "mid", count: 1 }];
      base.optional = [
        { role: "Product Designer", seniority: "mid", count: 1 },
        { role: "Sales Lead", seniority: "mid", count: 1 },
      ];
      base.capabilities = ["brand_building", "performance_marketing", "content_strategy"];
      break;
    case "operations":
      base.required = [{ role: "Finance/Ops Manager", seniority: "mid", count: 1 }];
      base.optional = [
        { role: "Customer Support", seniority: "mid", count: 1 },
        { role: "Compliance Advisor", seniority: "mid", count: 1 },
      ];
      base.capabilities = ["process_optimization", "financial_planning", "logistics"];
      break;
    case "fundraising":
      base.required = [{ role: "Finance/Ops Manager", seniority: "mid", count: 1 }];
      base.optional = [
        { role: "CTO", seniority: "senior", count: 1 },
        { role: "Sales Lead", seniority: "mid", count: 1 },
      ];
      base.capabilities = ["investor_relations", "financial_modeling", "storytelling"];
      break;
    case "growth":
      base.required = [{ role: "Sales Lead", seniority: "mid", count: 1 }];
      base.optional = [
        { role: "Marketing Manager", seniority: "mid", count: 1 },
        { role: "Product Manager", seniority: "mid", count: 1 },
      ];
      base.capabilities = ["growth_experimentation", "retention_optimization", "viral_loops"];
      break;
    case "partnership":
      base.required = [{ role: "Sales Lead", seniority: "senior", count: 1 }];
      base.optional = [
        { role: "Domain Advisor", seniority: "senior", count: 1 },
        { role: "Finance/Ops Manager", seniority: "mid", count: 1 },
      ];
      base.capabilities = ["bizdev", "contract_negotiation", "ecosystem_mapping"];
      break;
    case "infrastructure":
      base.required = [{ role: "Backend Engineer", seniority: "senior", count: 1 }];
      base.optional = [
        { role: "Security Engineer", seniority: "mid", count: 1 },
        { role: "Data Engineer", seniority: "mid", count: 1 },
      ];
      base.capabilities = ["cloud_architecture", "devops", "scalability"];
      break;
    case "research":
      base.required = [{ role: "AI Engineer", seniority: "senior", count: 1 }];
      base.optional = [
        { role: "Domain Advisor", seniority: "senior", count: 1 },
        { role: "Data Engineer", seniority: "mid", count: 1 },
      ];
      base.capabilities = ["research_design", "experimentation", "paper_writing"];
      break;
    case "launch":
      base.required = [{ role: "Product Manager", seniority: "mid", count: 1 }];
      base.optional = [
        { role: "Marketing Manager", seniority: "mid", count: 1 },
        { role: "Full-stack Engineer", seniority: "mid", count: 1 },
        { role: "Customer Support", seniority: "junior", count: 1 },
      ];
      base.capabilities = ["launch_coordination", "user_onboarding", "crisis_management"];
      break;
  }

  // Startup-type-specific overrides
  if (startupType.includes("web3")) {
    if (missionCategory === "security") {
      base.required = [{ role: "Blockchain Engineer", seniority: "senior", count: 1 }];
      base.optional.push({ role: "Security Engineer", seniority: "senior", count: 1 });
    }
    if (missionCategory === "compliance") {
      base.optional.push({ role: "Blockchain Engineer", seniority: "mid", count: 1 });
    }
  }

  if (startupType.includes("healthcare")) {
    if (missionCategory === "compliance" || missionCategory === "security") {
      base.required.push({ role: "Domain Advisor", seniority: "senior", count: 1 });
    }
  }

  if (startupType.includes("fintech") || startupType.includes("remittance")) {
    if (missionCategory === "product") {
      base.optional.push({ role: "Compliance Advisor", seniority: "mid", count: 1 });
    }
  }

  return base;
}

export function calculateRoleCoverage(
  requiredRoles: RequiredRole[],
  employees: { role: string; seniority: string }[]
): { role: string; required: number; filled: number; coverage: number }[] {
  return requiredRoles.map((req) => {
    const filled = employees.filter(
      (e) => e.role === req.role && seniorityRank(e.seniority) >= seniorityRank(req.seniority)
    ).length;
    return {
      role: req.role,
      required: req.count,
      filled,
      coverage: Math.min(1, filled / req.count),
    };
  });
}

function seniorityRank(s: string): number {
  const ranks: Record<string, number> = { junior: 1, mid: 2, senior: 3, lead: 4 };
  return ranks[s] ?? 1;
}
