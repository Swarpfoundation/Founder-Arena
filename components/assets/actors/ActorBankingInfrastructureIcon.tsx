import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function ActorBankingInfrastructureIcon({ className, size = 24, title = "Pillar Bank" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M3 21H21" />
      <path d="M4 21V10L12 4L20 10V21" />
      <path d="M9 21V14H15V21" />
      <path d="M10 10H14" />
    </AssetBase>
  );
}
