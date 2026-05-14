import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function MetricDilutionIcon({ className, size = 24, title = "Equity Dilution" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12L16 8" />
      <path d="M12 12V7" />
      <path d="M12 12L8 16" />
      <path d="M7 12H12" />
    </AssetBase>
  );
}
