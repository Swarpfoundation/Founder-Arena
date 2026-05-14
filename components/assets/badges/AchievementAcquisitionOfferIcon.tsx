import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementAcquisitionOfferIcon({ className, size = 24, title = "Acquisition Offer" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <rect x="5" y="7" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 10H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="14" r="1" />
      <path d="M12 14H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
