import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function OfficeCoworkingIcon({ className, size = 24, title = "Coworking" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M6 22V10L12 6L18 10V22" />
      <path d="M6 14H18" />
      <path d="M10 22V16H14V22" />
      <path d="M12 6V2" />
      <path d="M3 10H6" />
      <path d="M18 10H21" />
    </AssetBase>
  );
}
