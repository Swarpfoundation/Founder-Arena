import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function RoleDesignerIcon({ className, size = 24, title = "Designer" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 19C12 19 8 15 8 11C8 7 10 5 12 5C14 5 16 7 16 11C16 15 12 19 12 19Z" />
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" />
      <path d="M12 2V5" />
      <path d="M5 12H2" />
      <path d="M22 12H19" />
    </AssetBase>
  );
}
