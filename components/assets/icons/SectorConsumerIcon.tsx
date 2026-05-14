import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function SectorConsumerIcon({ className, size = 24, title = "Consumer" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M20 12V22H4V12" />
      <path d="M22 7H2L4 12H20L22 7Z" />
      <path d="M12 2L8 7H16L12 2Z" />
    </AssetBase>
  );
}
