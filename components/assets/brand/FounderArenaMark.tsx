import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function FounderArenaMark({ className, size = 24, title = "Founder Arena" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" />
      <path d="M8 12L12 8L16 12" />
      <circle cx="12" cy="14" r="1.5" />
    </AssetBase>
  );
}
