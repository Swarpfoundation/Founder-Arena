import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function SectorMarketplaceIcon({ className, size = 24, title = "Marketplace" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M3 3H7L10 14H19L21 8H9" />
      <circle cx="10" cy="18" r="1.5" />
      <circle cx="18" cy="18" r="1.5" />
    </AssetBase>
  );
}
