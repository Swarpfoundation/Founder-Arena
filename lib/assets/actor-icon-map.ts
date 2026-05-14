import {
  ActorFrontierAiLabIcon,
  ActorCloudHyperscalerIcon,
  ActorMobilePlatformIcon,
  ActorEnterpriseGiantIcon,
  ActorPaymentsNetworkIcon,
  ActorEcommercePlatformIcon,
  ActorChipInfrastructureIcon,
  ActorHealthcarePlatformIcon,
  ActorLogisticsOperatorIcon,
  ActorSocialPlatformIcon,
  ActorCryptoExchangeIcon,
  ActorCybersecurityPlatformIcon,
  ActorBankingInfrastructureIcon,
  ActorGamingPublisherIcon,
  ActorEnergyInfrastructureIcon,
} from "@/components/assets";
import type { AssetProps } from "@/components/assets/base";
import type { ComponentType } from "react";

export type ActorIconComponent = ComponentType<AssetProps>;

const ACTOR_ICON_MAP: Record<string, ActorIconComponent> = {
  "frontier_ai_lab": ActorFrontierAiLabIcon,
  "cloud_hyperscaler": ActorCloudHyperscalerIcon,
  "mobile_platform": ActorMobilePlatformIcon,
  "enterprise_giant": ActorEnterpriseGiantIcon,
  "payments_network": ActorPaymentsNetworkIcon,
  "ecommerce_platform": ActorEcommercePlatformIcon,
  "chip_infrastructure": ActorChipInfrastructureIcon,
  "healthcare_platform": ActorHealthcarePlatformIcon,
  "logistics_operator": ActorLogisticsOperatorIcon,
  "social_platform": ActorSocialPlatformIcon,
  "crypto_exchange": ActorCryptoExchangeIcon,
  "cybersecurity_platform": ActorCybersecurityPlatformIcon,
  "banking_infrastructure": ActorBankingInfrastructureIcon,
  "gaming_publisher": ActorGamingPublisherIcon,
  "energy_infrastructure": ActorEnergyInfrastructureIcon,
};

export function getActorIcon(actorId: string | null | undefined): ActorIconComponent {
  if (!actorId) return ActorEnterpriseGiantIcon;
  const key = actorId.toLowerCase().trim();
  return ACTOR_ICON_MAP[key] ?? ActorEnterpriseGiantIcon;
}
