import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementSurvived12MonthsIcon({ className, size = 24, title = "Survived 12 Months" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12C3 12 5 5 12 5C19 5 21 12 21 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
