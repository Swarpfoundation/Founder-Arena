import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function MetricProductivityIcon({ className, size = 24, title = "Productivity" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7V12L15 15" />
    </AssetBase>
  );
}
