import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function SectorEdTechIcon({ className, size = 24, title = "EdTech" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M4 19.5V6C4 4.9 4.9 4 6 4H18C19.1 4 20 4.9 20 6V19.5" />
      <path d="M4 19.5C4 20.88 5.12 22 6.5 22H17.5C18.88 22 20 20.88 20 19.5" />
      <path d="M12 11V7" />
      <path d="M9 9H15" />
      <path d="M8 15H16" />
    </AssetBase>
  );
}
