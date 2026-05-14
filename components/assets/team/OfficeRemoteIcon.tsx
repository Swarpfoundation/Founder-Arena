import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function OfficeRemoteIcon({ className, size = 24, title = "Remote" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M3 9L12 2L21 9V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V9Z" />
      <path d="M9 21V12H15V21" />
      <path d="M12 2V6" />
    </AssetBase>
  );
}
