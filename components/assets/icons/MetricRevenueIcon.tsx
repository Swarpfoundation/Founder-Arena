import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function MetricRevenueIcon({ className, size = 24, title = "Revenue" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M3 17L9 11L13 15L21 7" />
      <path d="M17 7H21V11" />
    </AssetBase>
  );
}
