import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function OutcomeSeriesAReadyIcon({ className, size = 24, title = "Series A Ready" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 4V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="4" r="1.5" />
    </FilledAssetBase>
  );
}
