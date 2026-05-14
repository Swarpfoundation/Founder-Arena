import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function MetricTrophyIcon({ className, size = 24, title = "Score" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M6 9H4.5C3.67 9 3 8.33 3 7.5V5C3 4.17 3.67 3.5 4.5 3.5H6" />
      <path d="M18 9H19.5C20.33 9 21 8.33 21 7.5V5C21 4.17 20.33 3.5 19.5 3.5H18" />
      <path d="M6 3.5H18V9C18 12.31 15.31 15 12 15C8.69 15 6 12.31 6 9V3.5Z" />
      <path d="M12 15V19" />
      <path d="M8 22H16L15 19H9L8 22Z" />
    </AssetBase>
  );
}
