import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function RoleAiEngineerIcon({ className, size = 24, title = "AI Engineer" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 2V6" />
      <path d="M12 18V22" />
      <path d="M4.93 4.93L7.76 7.76" />
      <path d="M16.24 16.24L19.07 19.07" />
      <path d="M2 12H6" />
      <path d="M18 12H22" />
      <path d="M4.93 19.07L7.76 16.24" />
      <path d="M16.24 7.76L19.07 4.93" />
      <path d="M12 8C12 8 14 10 14 12C14 14 12 16 12 16C12 16 10 14 10 12C10 10 12 8 12 8Z" />
    </AssetBase>
  );
}
