import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function GrowthAcquisitionOfferIcon({ className, size = 24, title = "Acquisition Offer" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 6V12L15 15" />
      <path d="M12 2C12 2 8 4 8 7C8 9 10 10 12 10C14 10 16 9 16 7C16 4 12 2 12 2Z" />
      <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" />
    </AssetBase>
  );
}
