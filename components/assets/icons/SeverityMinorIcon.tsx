import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function SeverityMinorIcon({ className, size = 24, title = "Minor" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8V12" />
      <path d="M12 16H12.01" strokeWidth={2} />
    </AssetBase>
  );
}
