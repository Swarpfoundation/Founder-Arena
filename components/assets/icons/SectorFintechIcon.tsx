import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function SectorFintechIcon({ className, size = 24, title = "Fintech" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10H7.01" strokeWidth={2} />
      <path d="M7 14H7.01" strokeWidth={2} />
      <path d="M12 10H12.01" strokeWidth={2} />
      <path d="M12 14H12.01" strokeWidth={2} />
      <path d="M17 10H17.01" strokeWidth={2} />
      <path d="M17 14H17.01" strokeWidth={2} />
    </AssetBase>
  );
}
