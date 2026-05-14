import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function MetricRunwayIcon({ className, size = 24, title = "Runway" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M2 12H6L10 6L14 18L18 12H22" />
      <path d="M2 17H22" />
      <path d="M2 7H22" />
    </AssetBase>
  );
}
