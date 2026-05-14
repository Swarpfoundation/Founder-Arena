import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function GrowthPlatformPartnerIcon({ className, size = 24, title = "Platform Partner" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2V4M12 20V22M2 12H4M20 12H22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" />
    </AssetBase>
  );
}
