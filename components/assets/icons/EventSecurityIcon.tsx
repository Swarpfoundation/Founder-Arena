import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function EventSecurityIcon({ className, size = 24, title = "Security" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
      <path d="M9 12L11 14L15 10" />
    </AssetBase>
  );
}
