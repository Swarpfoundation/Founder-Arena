import {
  AchievementFirstPitchIcon,
  AchievementFundedFounderIcon,
  AchievementFirstHireIcon,
  AchievementTeamBuilderIcon,
  AchievementSurvived12MonthsIcon,
  AchievementBreakoutStartupIcon,
  AchievementEfficientOperatorIcon,
  AchievementCockroachFounderIcon,
  AchievementRevenueMachineIcon,
  AchievementUnicornDreamIcon,
  AchievementLeanStartupIcon,
  AchievementGraveyardEntryIcon,
  AchievementComplianceMindedIcon,
  AchievementProductShipperIcon,
  AchievementInvestorFavoriteIcon,
  AchievementCrisisManagerIcon,
  AchievementSecurityFirstIcon,
  AchievementClutchFounderIcon,
  AchievementPartnershipWinIcon,
  AchievementViralMomentIcon,
  AchievementSeriesAReadyIcon,
  AchievementRaisedSeriesAIcon,
  AchievementStrategicBackingIcon,
  AchievementAcquisitionOfferIcon,
  AchievementSuccessfulExitIcon,
  AchievementRejectedLowballIcon,
  AchievementPlatformPartnerIcon,
  AchievementCapitalEfficientScaleIcon,
} from "@/components/assets";
import type { AssetProps } from "@/components/assets/base";
import type { ComponentType } from "react";

export type AchievementIconComponent = ComponentType<AssetProps>;

const ACHIEVEMENT_ICON_MAP: Record<string, AchievementIconComponent> = {
  "first_pitch": AchievementFirstPitchIcon,
  "funded_founder": AchievementFundedFounderIcon,
  "first_hire": AchievementFirstHireIcon,
  "team_builder": AchievementTeamBuilderIcon,
  "survived_12_months": AchievementSurvived12MonthsIcon,
  "breakout_startup": AchievementBreakoutStartupIcon,
  "efficient_operator": AchievementEfficientOperatorIcon,
  "cockroach_founder": AchievementCockroachFounderIcon,
  "revenue_machine": AchievementRevenueMachineIcon,
  "unicorn_dream": AchievementUnicornDreamIcon,
  "lean_startup": AchievementLeanStartupIcon,
  "graveyard_entry": AchievementGraveyardEntryIcon,
  "compliance_minded": AchievementComplianceMindedIcon,
  "product_shipper": AchievementProductShipperIcon,
  "investor_favorite": AchievementInvestorFavoriteIcon,
  "crisis_manager": AchievementCrisisManagerIcon,
  "security_first": AchievementSecurityFirstIcon,
  "clutch_founder": AchievementClutchFounderIcon,
  "partnership_win": AchievementPartnershipWinIcon,
  "viral_moment": AchievementViralMomentIcon,
  "series_a_ready": AchievementSeriesAReadyIcon,
  "raised_series_a": AchievementRaisedSeriesAIcon,
  "strategic_backing": AchievementStrategicBackingIcon,
  "acquisition_offer": AchievementAcquisitionOfferIcon,
  "successful_exit": AchievementSuccessfulExitIcon,
  "rejected_lowball": AchievementRejectedLowballIcon,
  "platform_partner": AchievementPlatformPartnerIcon,
  "capital_efficient_scale": AchievementCapitalEfficientScaleIcon,
};

export function getAchievementIcon(key: string | null | undefined): AchievementIconComponent {
  if (!key) return AchievementFirstPitchIcon;
  return ACHIEVEMENT_ICON_MAP[key] ?? AchievementFirstPitchIcon;
}

export function getAchievementIconKeys(): string[] {
  return Object.keys(ACHIEVEMENT_ICON_MAP);
}
