import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function MetricBurnIcon({ className, size = 24, title = "Burn" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 2C10 6 8 8 8 11C8 14 10 16 12 16C14 16 16 14 16 11C16 8 14 6 12 2Z" />
      <path d="M6 16C6 19.3 8.7 22 12 22C15.3 22 18 19.3 18 16" />
      <path d="M10 11C10 11 10.5 10 11 9" />
    </AssetBase>
  );
}
