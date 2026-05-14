import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementStrategicBackingIcon({ className, size = 24, title = "Strategic Backing" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M6 22V10L12 6L18 10V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 22V16H14V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 14H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
