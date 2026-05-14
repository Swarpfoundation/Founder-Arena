import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function RoleSalesIcon({ className, size = 24, title = "Sales" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M3 3V21H21" />
      <path d="M7 16L11 10L15 14L21 6" />
      <path d="M17 6H21V10" />
    </AssetBase>
  );
}
