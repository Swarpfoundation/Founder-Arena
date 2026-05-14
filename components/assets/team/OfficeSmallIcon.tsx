import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function OfficeSmallIcon({ className, size = 24, title = "Small Office" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M4 22V10L12 4L20 10V22" />
      <path d="M9 22V14H15V22" />
      <path d="M12 4V2" />
    </AssetBase>
  );
}
