import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function GrowthSeriesBIcon({ className, size = 24, title = "Series B" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M8 19C8 19 8 21 10 21H14C16 21 16 19 16 19V17C16 17 16 15 14 15H10C8 15 8 13 8 13V11C8 11 8 9 10 9H14C16 9 16 11 16 11" />
      <path d="M12 3V9" />
      <circle cx="12" cy="3" r="1.5" fill="currentColor" />
    </AssetBase>
  );
}
