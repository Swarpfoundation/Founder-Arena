import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function SectorLogisticsIcon({ className, size = 24, title = "Logistics" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <rect x="2" y="8" width="15" height="10" rx="2" />
      <circle cx="6.5" cy="18" r="2" />
      <circle cx="15.5" cy="18" r="2" />
      <path d="M17 12H20C21.1 12 22 12.9 22 14V16C22 17.1 21.1 18 20 18H19" />
    </AssetBase>
  );
}
