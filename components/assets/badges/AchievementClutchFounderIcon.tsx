import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementClutchFounderIcon({ className, size = 24, title = "Clutch Founder" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M12 4C12 4 15 7 15 10C15 12 14 13 12 13C10 13 9 12 9 10C9 7 12 4 12 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 22L12 18L16 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </FilledAssetBase>
  );
}
