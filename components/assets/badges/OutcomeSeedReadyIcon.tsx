import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function OutcomeSeedReadyIcon({ className, size = 24, title = "Seed Ready" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M12 6C12 6 8 8 8 11C8 13.5 10 15 12 15C14 15 16 13.5 16 11C16 8 12 6 12 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 15V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 17H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
