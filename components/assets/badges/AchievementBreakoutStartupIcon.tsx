import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementBreakoutStartupIcon({ className, size = 24, title = "Breakout Startup" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M12 4L15 10L21 11L17 16L18 22L12 19L6 22L7 16L3 11L9 10L12 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </FilledAssetBase>
  );
}
