import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function MetricCashIcon({ className, size = 24, title = "Cash" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6V18" />
      <path d="M15 9.5C15 8.1 13.7 7 12 7C10.3 7 9 8.1 9 9.5C9 10.9 10.3 12 12 12C13.7 12 15 13.1 15 14.5C15 15.9 13.7 17 12 17C10.3 17 9 15.9 9 14.5" />
    </AssetBase>
  );
}
