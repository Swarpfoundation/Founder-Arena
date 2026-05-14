import {
  SectorAiIcon,
  SectorFintechIcon,
  SectorWeb3Icon,
  SectorSaaSIcon,
  SectorHealthtechIcon,
  SectorGamingIcon,
  SectorLogisticsIcon,
  SectorEnergyIcon,
  SectorMarketplaceIcon,
  SectorConsumerIcon,
  SectorEnterpriseIcon,
  SectorClimateIcon,
  SectorEdTechIcon,
  SectorHardwareIcon,
  SectorDefenseIcon,
} from "@/components/assets";
import type { AssetProps } from "@/components/assets/base";
import type { ComponentType } from "react";

export type SectorIconComponent = ComponentType<AssetProps>;

const SECTOR_ICON_MAP: Record<string, SectorIconComponent> = {
  "ai / ml": SectorAiIcon,
  "ai": SectorAiIcon,
  "fintech": SectorFintechIcon,
  "web3": SectorWeb3Icon,
  "saas": SectorSaaSIcon,
  "healthtech": SectorHealthtechIcon,
  "healthcare": SectorHealthtechIcon,
  "gaming": SectorGamingIcon,
  "logistics": SectorLogisticsIcon,
  "energy": SectorEnergyIcon,
  "climate": SectorClimateIcon,
  "marketplace": SectorMarketplaceIcon,
  "e-commerce": SectorMarketplaceIcon,
  "ecommerce": SectorMarketplaceIcon,
  "consumer": SectorConsumerIcon,
  "b2c": SectorConsumerIcon,
  "enterprise": SectorEnterpriseIcon,
  "edtech": SectorEdTechIcon,
  "hardware": SectorHardwareIcon,
  "defense": SectorDefenseIcon,
  "cybersecurity": SectorDefenseIcon,
  "other": SectorSaaSIcon,
};

export function getSectorIcon(sector: string): SectorIconComponent {
  const key = sector.toLowerCase().trim();
  return SECTOR_ICON_MAP[key] ?? SectorSaaSIcon;
}

export function getSectorIconKeys(): string[] {
  return Object.keys(SECTOR_ICON_MAP);
}
