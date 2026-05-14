import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function GrowthBridgeRoundIcon({ className, size = 24, title = "Bridge Round" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M4 12H8L10 8L14 16L16 12H20" />
      <path d="M2 16H22" />
      <path d="M2 8H22" />
    </AssetBase>
  );
}
