import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function SectorSaaSIcon({ className, size = 24, title = "SaaS" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <rect x="2" y="3" width="20" height="8" rx="2" />
      <path d="M6 7H6.01" strokeWidth={2} />
      <path d="M10 7H14" />
      <rect x="2" y="13" width="20" height="8" rx="2" />
      <path d="M6 17H6.01" strokeWidth={2} />
      <path d="M10 17H14" />
    </AssetBase>
  );
}
