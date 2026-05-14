import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function MetricMoraleIcon({ className, size = 24, title = "Team Morale" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 14C9 14 10 15.5 12 15.5C14 15.5 15 14 15 14" />
      <path d="M9 10H9.01" strokeWidth={2} />
      <path d="M15 10H15.01" strokeWidth={2} />
    </AssetBase>
  );
}
