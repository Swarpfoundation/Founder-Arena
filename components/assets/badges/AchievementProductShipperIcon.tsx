import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementProductShipperIcon({ className, size = 24, title = "Product Shipper" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <rect x="6" y="8" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 11L12 14L15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 14V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
