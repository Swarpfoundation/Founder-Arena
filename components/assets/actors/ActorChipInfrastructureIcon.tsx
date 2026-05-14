import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function ActorChipInfrastructureIcon({ className, size = 24, title = "Cortex Foundry" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9H9.01" strokeWidth={2} />
      <path d="M15 9H15.01" strokeWidth={2} />
      <path d="M9 15H9.01" strokeWidth={2} />
      <path d="M15 15H15.01" strokeWidth={2} />
      <path d="M12 4V2M12 22V20M4 12H2M22 12H20" />
    </AssetBase>
  );
}
