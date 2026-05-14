import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function ActorCryptoExchangeIcon({ className, size = 24, title = "Prism Exchange" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" />
      <path d="M12 6V12L15 15" />
      <path d="M12 12L9 15" />
    </AssetBase>
  );
}
