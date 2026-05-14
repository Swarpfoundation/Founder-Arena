import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function AchievementRevenueMachineIcon({ className, size = 24, title = "Revenue Machine" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 7H21V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </FilledAssetBase>
  );
}
