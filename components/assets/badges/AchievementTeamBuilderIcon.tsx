import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementTeamBuilderIcon({ className, size = 24, title = "Team Builder" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <circle cx="12" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="15" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="15" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8V10M6 13V11M18 13V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 14L10.5 12M16 14L13.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
