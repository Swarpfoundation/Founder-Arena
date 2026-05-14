import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function GrowthSeriesAIcon({ className, size = 24, title = "Series A" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 4V20" />
      <path d="M17 7H9.5C7.5 7 6 8.5 6 10.5C6 12.5 7.5 14 9.5 14H14.5C16.5 14 18 15.5 18 17.5C18 19.5 16.5 21 14.5 21H6" />
      <circle cx="12" cy="4" r="1.5" fill="currentColor" />
    </AssetBase>
  );
}
