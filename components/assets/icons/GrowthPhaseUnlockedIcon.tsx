import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function GrowthPhaseUnlockedIcon({ className, size = 24, title = "Growth Phase Unlocked" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      <path d="M8 12L11 15L16 9" />
    </AssetBase>
  );
}
