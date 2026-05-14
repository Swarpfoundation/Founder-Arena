import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function OutcomeExitedIcon({ className, size = 24, title = "Exited" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M12 4V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 11L12 16L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 20H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
