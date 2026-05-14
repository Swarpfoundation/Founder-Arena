import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function EventCustomerIcon({ className, size = 24, title = "Customer" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M17 21V19C17 17.34 15.66 16 14 16H10C8.34 16 7 17.34 7 19V21" />
      <circle cx="12" cy="7" r="4" />
      <path d="M20 8V12" />
      <path d="M22 10H18" />
    </AssetBase>
  );
}
