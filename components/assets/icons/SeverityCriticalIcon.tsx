import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function SeverityCriticalIcon({ className, size = 24, title = "Critical" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 2L2 22H22L12 2Z" />
      <path d="M12 8V14" />
      <path d="M12 17H12.01" strokeWidth={2} />
    </AssetBase>
  );
}
