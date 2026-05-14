import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function GrowthSeedExtensionIcon({ className, size = 24, title = "Seed Extension" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 6C12 6 8 8 8 11C8 13.5 10 15 12 15C14 15 16 13.5 16 11C16 8 12 6 12 6Z" />
      <path d="M12 15V19" />
      <path d="M10 17H14" />
      <path d="M12 2V4" />
    </AssetBase>
  );
}
