import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function MetricFundingIcon({ className, size = 24, title = "Funding" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 2V22" />
      <path d="M17 5H9.5C7.5 5 6 6.5 6 8.5C6 10.5 7.5 12 9.5 12H14.5C16.5 12 18 13.5 18 15.5C18 17.5 16.5 19 14.5 19H6" />
      <circle cx="12" cy="2" r="1.5" fill="currentColor" />
    </AssetBase>
  );
}
