import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BADGE_ASSETS,
  DECISION_ASSETS,
  ENDING_ASSETS,
  EVENT_ASSETS,
  FOUNDER_ASSETS,
  FUNDING_ASSETS,
  GAME_ASSETS,
  INVESTOR_ASSETS,
  ONBOARDING_ASSETS,
  SECTOR_ASSETS,
  type GameAssetName,
} from "@/lib/game-assets";

const displayedAssets: readonly GameAssetName[] = [
  "FounderArenaLogo",
  "SwarpGamesLogo",
  "arena_bg_calm",
  "arena_bg_active",
  "arena_bg_danger",
  ...ONBOARDING_ASSETS,
  ...SECTOR_ASSETS,
  ...FOUNDER_ASSETS,
  ...DECISION_ASSETS,
  ...EVENT_ASSETS,
  ...INVESTOR_ASSETS,
  ...FUNDING_ASSETS,
  ...ENDING_ASSETS,
  ...BADGE_ASSETS,
];

describe("marketing game asset registry", () => {
  it("registers and displays every iOS image-set derivative", () => {
    expect(Object.keys(GAME_ASSETS)).toHaveLength(66);
    expect(new Set(displayedAssets).size).toBe(66);
    expect(new Set(displayedAssets)).toEqual(new Set(Object.keys(GAME_ASSETS)));
  });

  it("points every registry entry to an existing WebP file", () => {
    for (const asset of Object.values(GAME_ASSETS)) {
      expect(asset.src).toBe(`/game-assets/${asset.name}.webp`);
      expect(existsSync(join(process.cwd(), "public", asset.src))).toBe(true);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
    }
  });

  it("provides alt text for informative art and leaves backgrounds decorative", () => {
    for (const asset of Object.values(GAME_ASSETS)) {
      if (asset.category === "background") {
        expect(asset.alt).toBe("");
      } else {
        expect(asset.alt.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
