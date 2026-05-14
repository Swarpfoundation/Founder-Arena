import {
  EventMarketIcon,
  EventTeamIcon,
  EventProductIcon,
  EventSecurityIcon,
  EventRegulatoryIcon,
  EventInvestorIcon,
  EventCustomerIcon,
  EventCompetitorIcon,
  EventFinanceIcon,
  EventViralIcon,
  EventOperationalIcon,
  SeverityMinorIcon,
  SeverityModerateIcon,
  SeverityCriticalIcon,
} from "@/components/assets";
import type { AssetProps } from "@/components/assets/base";
import type { ComponentType } from "react";

export type EventIconComponent = ComponentType<AssetProps>;

const EVENT_CATEGORY_MAP: Record<string, EventIconComponent> = {
  "market": EventMarketIcon,
  "team": EventTeamIcon,
  "product": EventProductIcon,
  "security": EventSecurityIcon,
  "regulatory": EventRegulatoryIcon,
  "investor": EventInvestorIcon,
  "customer": EventCustomerIcon,
  "competitor": EventCompetitorIcon,
  "finance": EventFinanceIcon,
  "viral": EventViralIcon,
  "operational": EventOperationalIcon,
};

const SEVERITY_MAP: Record<string, EventIconComponent> = {
  "minor": SeverityMinorIcon,
  "moderate": SeverityModerateIcon,
  "critical": SeverityCriticalIcon,
};

export function getEventCategoryIcon(category: string | null | undefined): EventIconComponent {
  if (!category) return EventOperationalIcon;
  const key = category.toLowerCase().trim();
  return EVENT_CATEGORY_MAP[key] ?? EventOperationalIcon;
}

export function getSeverityIcon(severity: string | null | undefined): EventIconComponent {
  if (!severity) return SeverityMinorIcon;
  const key = severity.toLowerCase().trim();
  return SEVERITY_MAP[key] ?? SeverityMinorIcon;
}
