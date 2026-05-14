import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function SectorEnterpriseIcon({ className, size = 24, title = "Enterprise" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M6 22V10L12 6L18 10V22" />
      <path d="M6 14H18" />
      <path d="M10 22V16H14V22" />
      <path d="M12 6V2" />
    </AssetBase>
  );
}
