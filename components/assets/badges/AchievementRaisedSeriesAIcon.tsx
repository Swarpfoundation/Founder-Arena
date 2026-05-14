import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementRaisedSeriesAIcon({ className, size = 24, title = "Raised Series A" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 6V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 9.5C15 8.1 13.7 7 12 7C10.3 7 9 8.1 9 9.5C9 10.9 10.3 12 12 12C13.7 12 15 13.1 15 14.5C15 15.9 13.7 17 12 17C10.3 17 9 15.9 9 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="4" r="1.5" />
    </FilledAssetBase>
  );
}
