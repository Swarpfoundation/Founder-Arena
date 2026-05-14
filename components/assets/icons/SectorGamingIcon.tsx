import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function SectorGamingIcon({ className, size = 24, title = "Gaming" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <rect x="2" y="6" width="20" height="12" rx="4" />
      <path d="M6 12H10" />
      <path d="M8 10V14" />
      <circle cx="16" cy="12" r="1.5" fill="currentColor" />
      <circle cx="18" cy="10" r="1.5" fill="currentColor" />
    </AssetBase>
  );
}
