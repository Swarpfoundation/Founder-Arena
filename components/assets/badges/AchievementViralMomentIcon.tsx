import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementViralMomentIcon({ className, size = 24, title = "Viral Moment" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M13 2L4.09 12.11C3.89 12.35 3.89 12.7 4.09 12.94L5.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 22L19.91 11.89C20.11 11.65 20.11 11.3 19.91 11.06L18.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </FilledAssetBase>
  );
}
