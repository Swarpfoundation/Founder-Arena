import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementPartnershipWinIcon({ className, size = 24, title = "Partnership Win" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M9 12C9 12 10.5 13.5 12 13.5C13.5 13.5 15 12 15 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 10C7 10 8.5 8.5 10 8.5C11.5 8.5 13 10 13 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 10C11 10 12.5 8.5 14 8.5C15.5 8.5 17 10 17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 15L12 19L16 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </FilledAssetBase>
  );
}
