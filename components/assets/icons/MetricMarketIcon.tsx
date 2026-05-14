import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function MetricMarketIcon({ className, size = 24, title = "Market Score" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M3 3V21H21" />
      <path d="M7 16L11 10L15 14L21 6" />
    </AssetBase>
  );
}
