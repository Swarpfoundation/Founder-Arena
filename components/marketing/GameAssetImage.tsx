import Image from "next/image";
import { GAME_ASSETS, type GameAssetName } from "@/lib/game-assets";

type GameAssetImageProps = {
  name: GameAssetName;
  className?: string;
  sizes?: string;
  priority?: boolean;
  decorative?: boolean;
};

export function GameAssetImage({
  name,
  className,
  sizes,
  priority = false,
  decorative = false,
}: GameAssetImageProps) {
  const asset = GAME_ASSETS[name];

  return (
    <Image
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={decorative ? "" : asset.alt}
      className={className}
      sizes={sizes}
      priority={priority}
    />
  );
}
