import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function OfficePremiumIcon({ className, size = 24, title = "Premium Office" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M3 22V8L12 2L21 8V22" />
      <path d="M9 22V14H15V22" />
      <path d="M12 2V8" />
      <path d="M7 12H17" />
      <path d="M7 16H17" />
    </AssetBase>
  );
}
