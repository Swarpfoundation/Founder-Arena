import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function EventOperationalIcon({ className, size = 24, title = "Operational" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 2L2 7L12 12L22 7L12 2Z" />
      <path d="M2 17L12 22L22 17" />
      <path d="M2 12L12 17L22 12" />
    </AssetBase>
  );
}
