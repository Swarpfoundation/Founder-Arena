import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function RoleMarketingIcon({ className, size = 24, title = "Marketing" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 2C7 2 3 6 3 11C3 16 7 20 12 20C17 20 21 16 21 11C21 6 17 2 12 2Z" />
      <path d="M12 6V11L15 14" />
      <circle cx="12" cy="11" r="1.5" fill="currentColor" />
    </AssetBase>
  );
}
