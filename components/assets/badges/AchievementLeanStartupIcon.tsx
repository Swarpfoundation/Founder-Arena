import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementLeanStartupIcon({ className, size = 24, title = "Lean Startup" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M12 18C12 18 8 14 8 11C8 8 10 6 12 6C14 6 16 8 16 11C16 14 12 18 12 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
