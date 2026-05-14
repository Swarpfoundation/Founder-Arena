import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function ActorSocialPlatformIcon({ className, size = 24, title = "Orbit Social" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20C4 16.5 7 14 12 14C17 14 20 16.5 20 20" />
      <circle cx="18" cy="6" r="2" />
      <path d="M18 4V8M16 6H20" />
    </AssetBase>
  );
}
