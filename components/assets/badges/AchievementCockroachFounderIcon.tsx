import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementCockroachFounderIcon({ className, size = 24, title = "Cockroach Founder" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <ellipse cx="12" cy="14" rx="5" ry="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 11C9 11 8 8 10 7C12 6 14 8 14 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 14L4 13M17 14L20 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 17L6 19M16 17L18 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
