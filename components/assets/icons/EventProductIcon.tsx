import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function EventProductIcon({ className, size = 24, title = "Product" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9H9.01" strokeWidth={2} />
      <path d="M15 9H15.01" strokeWidth={2} />
      <path d="M10 15H14" />
    </AssetBase>
  );
}
