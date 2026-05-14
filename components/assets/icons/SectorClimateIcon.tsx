import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function SectorClimateIcon({ className, size = 24, title = "Climate" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 2C8 2 5 5 5 9C5 13 8 16 12 22C16 16 19 13 19 9C19 5 16 2 12 2Z" />
      <path d="M12 6V12" />
      <path d="M12 14H12.01" strokeWidth={2} />
    </AssetBase>
  );
}
