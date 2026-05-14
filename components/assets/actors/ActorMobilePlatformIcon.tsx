import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function ActorMobilePlatformIcon({ className, size = 24, title = "Titan Mobile" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M10 6H14" />
      <circle cx="12" cy="16" r="1.5" />
    </AssetBase>
  );
}
