import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementRejectedLowballIcon({ className, size = 24, title = "Rejected Lowball" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M8 8L16 16M16 8L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" />
    </FilledAssetBase>
  );
}
