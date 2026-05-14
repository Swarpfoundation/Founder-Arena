import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function ActorHealthcarePlatformIcon({ className, size = 24, title = "Lifeline Data" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 4V20" />
      <path d="M4 12H20" />
      <circle cx="12" cy="12" r="9" />
    </AssetBase>
  );
}
