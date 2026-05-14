import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function RoleFinanceIcon({ className, size = 24, title = "Finance / Ops" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10H6.01" strokeWidth={2} />
      <path d="M6 14H14" />
      <circle cx="18" cy="12" r="1.5" />
    </AssetBase>
  );
}
