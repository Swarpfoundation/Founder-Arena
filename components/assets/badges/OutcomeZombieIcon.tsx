import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function OutcomeZombieIcon({ className, size = 24, title = "Zombie" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="10" r="1" />
      <circle cx="15" cy="10" r="1" />
      <path d="M7 8L9 9M17 8L15 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 4V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
