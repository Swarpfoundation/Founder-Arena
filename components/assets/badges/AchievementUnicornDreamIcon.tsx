import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementUnicornDreamIcon({ className, size = 24, title = "Unicorn Dream" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M8 18C8 14 10 10 14 8C14 10 15 12 17 12C16 14 15 16 16 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="17" r="1.5" />
      <path d="M14 8L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
