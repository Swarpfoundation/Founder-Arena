import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function SectorWeb3Icon({ className, size = 24, title = "Web3" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" />
      <path d="M12 6V18" />
      <path d="M8 8L16 16" />
      <path d="M16 8L8 16" />
    </AssetBase>
  );
}
