import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function RoleSecurityIcon({ className, size = 24, title = "Security" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <rect x="8" y="11" width="8" height="7" rx="1" />
      <path d="M10 11V9C10 7.34 11.34 6 13 6C14.66 6 16 7.34 16 9V11" />
      <circle cx="12" cy="14.5" r="1" />
    </AssetBase>
  );
}
