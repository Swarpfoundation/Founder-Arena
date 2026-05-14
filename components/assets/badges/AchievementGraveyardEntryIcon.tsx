import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementGraveyardEntryIcon({ className, size = 24, title = "Graveyard Entry" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M10 4V10H8V14H10V20H14V14H16V10H14V4H10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </FilledAssetBase>
  );
}
