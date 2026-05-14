import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function SeverityModerateIcon({ className, size = 24, title = "Moderate" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M10.29 3.86L1.82 18C1.65 18.3 1.65 18.7 1.82 19C2 19.3 2.3 19.5 2.65 19.5H21.35C21.7 19.5 22 19.3 22.18 19C22.35 18.7 22.35 18.3 22.18 18L13.71 3.86C13.53 3.55 13.2 3.35 12.83 3.35H11.17C10.8 3.35 10.47 3.55 10.29 3.86Z" />
      <path d="M12 10V14" />
      <path d="M12 17H12.01" strokeWidth={2} />
    </AssetBase>
  );
}
