import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function SectorEnergyIcon({ className, size = 24, title = "Energy" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M13 2L4.09 12.11C3.89 12.35 3.89 12.7 4.09 12.94L5.5 14.5" />
      <path d="M13 2L10.5 10" />
      <path d="M13 2L15.5 10" />
      <path d="M11 22L19.91 11.89C20.11 11.65 20.11 11.3 19.91 11.06L18.5 9.5" />
      <path d="M11 22L13.5 14" />
      <path d="M11 22L8.5 14" />
    </AssetBase>
  );
}
