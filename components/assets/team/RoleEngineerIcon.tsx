import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function RoleEngineerIcon({ className, size = 24, title = "Engineer" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M2 6L6 2L10 6" />
      <path d="M6 2V12" />
      <path d="M14 6L18 2L22 6" />
      <path d="M18 2V12" />
      <path d="M4 14H20" />
      <path d="M8 18H16" />
      <path d="M10 22H14" />
    </AssetBase>
  );
}
