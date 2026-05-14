import { AssetBase } from "../base";
import type { AssetProps } from "../base";

export function ActorFrontierAiLabIcon({ className, size = 24, title = "OmniAI Labs" }: AssetProps) {
  return (
    <AssetBase className={className} size={size} title={title}>
      <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 5V9M12 15V19M5 12H9M15 12H19" />
    </AssetBase>
  );
}
