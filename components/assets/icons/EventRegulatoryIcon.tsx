import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function EventRegulatoryIcon({ className, size = 24, title = "Regulatory" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 2L14.5 8.5L21 9.5L16 14.5L17.5 21L12 17.5L6.5 21L8 14.5L3 9.5L9.5 8.5L12 2Z" />
      <path d="M12 7V13" />
      <path d="M12 15H12.01" strokeWidth={2} />
    </AssetBase>
  );
}
