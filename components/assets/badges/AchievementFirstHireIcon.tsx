import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementFirstHireIcon({ className, size = 24, title = "First Hire" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <circle cx="9" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 16C5 13.5 7 12 9 12H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 16V14C14 13 15 12 16.5 12H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 14L18 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
