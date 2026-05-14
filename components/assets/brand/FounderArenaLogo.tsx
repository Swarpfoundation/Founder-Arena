import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function FounderArenaLogo({ className, size = 32, title = "Founder Arena" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      {/* Hexagon arena frame */}
      <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" />
      {/* Inner chevron / arrow up */}
      <path d="M8 12L12 8L16 12" />
      {/* Center dot */}
      <circle cx="12" cy="14" r="1.5" />
      {/* Side brackets */}
      <path d="M5 10V14" />
      <path d="M19 10V14" />
    </AssetBase>
  );
}
