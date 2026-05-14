import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function EventTeamIcon({ className, size = 24, title = "Team" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="7" r="2" />
      <path d="M3 18V16C3 14.34 4.34 13 6 13H12C13.66 13 15 14.34 15 16V18" />
      <path d="M15 16V15C15 13.9 15.9 13 17 13H19C20.1 13 21 13.9 21 15V18" />
    </AssetBase>
  );
}
