import {
  RoleEngineerIcon,
  RoleDesignerIcon,
  RoleProductIcon,
  RoleSalesIcon,
  RoleMarketingIcon,
  RoleComplianceIcon,
  RoleSecurityIcon,
  RoleAiEngineerIcon,
  RoleSupportIcon,
  RoleFinanceIcon,
} from "@/components/assets";
import type { AssetProps } from "@/components/assets/base";
import type { ComponentType } from "react";

export type TeamIconComponent = ComponentType<AssetProps>;

const TEAM_ICON_MAP: Record<string, TeamIconComponent> = {
  // Engineering roles
  "cto": RoleEngineerIcon,
  "full-stack engineer": RoleEngineerIcon,
  "backend engineer": RoleEngineerIcon,
  "frontend engineer": RoleEngineerIcon,
  "engineer": RoleEngineerIcon,
  // Design
  "product designer": RoleDesignerIcon,
  "designer": RoleDesignerIcon,
  // Product
  "product manager": RoleProductIcon,
  "product": RoleProductIcon,
  // Sales
  "sales lead": RoleSalesIcon,
  "sales": RoleSalesIcon,
  // Marketing
  "marketing manager": RoleMarketingIcon,
  "marketing": RoleMarketingIcon,
  // Compliance
  "compliance advisor": RoleComplianceIcon,
  "compliance": RoleComplianceIcon,
  // Security
  "security engineer": RoleSecurityIcon,
  "security": RoleSecurityIcon,
  // AI
  "ai engineer": RoleAiEngineerIcon,
  "ai": RoleAiEngineerIcon,
  // Support
  "customer support": RoleSupportIcon,
  "support": RoleSupportIcon,
  // Finance
  "finance/ops manager": RoleFinanceIcon,
  "finance": RoleFinanceIcon,
  "ops": RoleFinanceIcon,
};

export function getTeamRoleIcon(role: string | null | undefined): TeamIconComponent {
  if (!role) return RoleEngineerIcon;
  const key = role.toLowerCase().trim();
  return TEAM_ICON_MAP[key] ?? RoleEngineerIcon;
}
