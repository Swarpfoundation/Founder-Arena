import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function RoleProductIcon({ className, size = 24, title = "Product" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9H21" />
      <path d="M9 9V21" />
      <path d="M9 15H15" />
    </AssetBase>
  );
}
