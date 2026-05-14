import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementPlatformPartnerIcon({ className, size = 24, title = "Platform Partner" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2V4M12 20V22M2 12H4M20 12H22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
