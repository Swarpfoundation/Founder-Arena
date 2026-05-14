import {
  OfficeRemoteIcon,
  OfficeCoworkingIcon,
  OfficeSmallIcon,
  OfficePremiumIcon,
} from "@/components/assets";
import type { AssetProps } from "@/components/assets/base";
import type { ComponentType } from "react";

export type OfficeIconComponent = ComponentType<AssetProps>;

const OFFICE_ICON_MAP: Record<string, OfficeIconComponent> = {
  "remote": OfficeRemoteIcon,
  "coworking": OfficeCoworkingIcon,
  "hybrid": OfficeCoworkingIcon,
  "small_office": OfficeSmallIcon,
  "office": OfficeSmallIcon,
  "small": OfficeSmallIcon,
  "premium_office": OfficePremiumIcon,
  "premium": OfficePremiumIcon,
};

export function getOfficeIcon(type: string | null | undefined): OfficeIconComponent {
  if (!type) return OfficeSmallIcon;
  const key = type.toLowerCase().trim();
  return OFFICE_ICON_MAP[key] ?? OfficeSmallIcon;
}
