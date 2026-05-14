import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementFirstPitchIcon({ className, size = 24, title = "First Pitch" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M4 6H20V18H4V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 14H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
