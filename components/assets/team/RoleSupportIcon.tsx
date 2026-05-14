import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function RoleSupportIcon({ className, size = 24, title = "Support" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22Z" />
      <path d="M9 14C9 14 10.5 15.5 12 15.5C13.5 15.5 15 14 15 14" />
      <path d="M9 10H9.01" strokeWidth={2} />
      <path d="M15 10H15.01" strokeWidth={2} />
    </AssetBase>
  );
}
