export type AchievementTier = "bronze" | "silver" | "gold" | "legendary";

const ACHIEVEMENT_TIER_MAP: Record<string, AchievementTier> = {
  // Bronze
  first_pitch: "bronze",
  first_hire: "bronze",
  graveyard_entry: "bronze",
  product_shipper: "bronze",
  // Silver
  funded_founder: "silver",
  team_builder: "silver",
  survived_12_months: "silver",
  compliance_minded: "silver",
  crisis_manager: "silver",
  security_first: "silver",
  partnership_win: "silver",
  platform_partner: "silver",
  // Gold
  efficient_operator: "gold",
  revenue_machine: "gold",
  investor_favorite: "gold",
  series_a_ready: "gold",
  raised_series_a: "gold",
  strategic_backing: "gold",
  acquisition_offer: "gold",
  capital_efficient_scale: "gold",
  // Legendary
  breakout_startup: "legendary",
  unicorn_dream: "legendary",
  cockroach_founder: "legendary",
  clutch_founder: "legendary",
  viral_moment: "legendary",
  successful_exit: "legendary",
  rejected_lowball: "legendary",
};

export function getAchievementTier(key: string | null | undefined): AchievementTier {
  if (!key) return "bronze";
  return ACHIEVEMENT_TIER_MAP[key] ?? "bronze";
}

export function getTierColor(tier: AchievementTier): string {
  switch (tier) {
    case "bronze":
      return "#cd7f32";
    case "silver":
      return "#c0c0c0";
    case "gold":
      return "#ffd700";
    case "legendary":
      return "#8b5cf6";
  }
}

export function getTierBorderClass(tier: AchievementTier): string {
  switch (tier) {
    case "bronze":
      return "border-amber-700/30";
    case "silver":
      return "border-slate-400/30";
    case "gold":
      return "border-yellow-500/30";
    case "legendary":
      return "border-violet-500/30";
  }
}

export function getTierGlowClass(tier: AchievementTier): string {
  switch (tier) {
    case "bronze":
      return "glow-amber";
    case "silver":
      return "glow-slate";
    case "gold":
      return "glow-yellow";
    case "legendary":
      return "glow-violet";
  }
}

export function getTierBadgeClass(tier: AchievementTier): string {
  switch (tier) {
    case "bronze":
      return "bg-amber-700/10 text-amber-500 border-amber-700/20";
    case "silver":
      return "bg-slate-400/10 text-slate-300 border-slate-400/20";
    case "gold":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "legendary":
      return "bg-violet-500/10 text-violet-400 border-violet-500/20";
  }
}
