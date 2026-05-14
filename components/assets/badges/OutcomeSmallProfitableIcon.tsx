import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function OutcomeSmallProfitableIcon({ className, size = 24, title = "Small Profitable" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 4V6M12 18V20M4 12H6M18 12H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
