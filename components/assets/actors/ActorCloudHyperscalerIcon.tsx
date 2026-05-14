import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function ActorCloudHyperscalerIcon({ className, size = 24, title = "Northstar Cloud" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M6 18C3.79 18 2 16.21 2 14C2 11.95 3.55 10.25 5.55 10.03C5.79 7.15 8.25 5 11.2 5C13.7 5 15.85 6.55 16.65 8.75C18.85 9.05 20.55 10.95 20.55 13.25C20.55 15.85 18.4 18 15.8 18H6Z" />
      <path d="M12 10V14M10 12H14" />
    </AssetBase>
  );
}
