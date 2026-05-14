import { FilledAssetBase } from "../base";
import type { AssetProps } from "../base";

export function OutcomeDeadIcon({ className, size = 24, title = "Dead" }: AssetProps) {
  return (
    <FilledAssetBase className={className} size={size} title={title}>
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" opacity="0.3" />
      <path d="M8 8L16 16M16 8L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </FilledAssetBase>
  );
}
