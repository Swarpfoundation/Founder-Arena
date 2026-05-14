import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementSecurityFirstIcon({ className, size = 24, title = "Security First" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <rect x="8" y="11" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 11V9C10 7.34 11.34 6 13 6C14.66 6 16 7.34 16 9V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="14.5" r="1" />
    </FilledAssetBase>
  );
}
