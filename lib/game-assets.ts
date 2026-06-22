export type GameAssetCategory =
  | "brand"
  | "background"
  | "onboarding"
  | "sector"
  | "founder"
  | "decision"
  | "event"
  | "investor"
  | "funding"
  | "ending"
  | "badge";

export type GameAssetSection =
  | "navigation"
  | "hero"
  | "premise"
  | "founders"
  | "decisions"
  | "pressure"
  | "capital"
  | "outcomes"
  | "platforms"
  | "footer";

export type GameAsset = {
  name: string;
  src: string;
  category: GameAssetCategory;
  width: number;
  height: number;
  alt: string;
  section: GameAssetSection;
};

function square(
  name: string,
  category: GameAssetCategory,
  alt: string,
  section: GameAssetSection,
  size = 640,
): GameAsset {
  return { name, src: `/game-assets/${name}.webp`, category, width: size, height: size, alt, section };
}

function background(name: string, alt: string, section: GameAssetSection): GameAsset {
  return { name, src: `/game-assets/${name}.webp`, category: "background", width: 852, height: 1846, alt, section };
}

export const GAME_ASSETS = {
  FounderArenaLogo: square("FounderArenaLogo", "brand", "Founder Arena", "navigation", 512),
  SwarpGamesLogo: square("SwarpGamesLogo", "brand", "Swarp Games", "footer", 512),

  arena_bg_calm: background("arena_bg_calm", "", "platforms"),
  arena_bg_active: background("arena_bg_active", "", "hero"),
  arena_bg_danger: background("arena_bg_danger", "", "pressure"),

  onboarding_found_startup: square("onboarding_found_startup", "onboarding", "Founder planning a new startup", "premise"),
  onboarding_monthly_decisions: square("onboarding_monthly_decisions", "onboarding", "Founder reviewing strategic decisions", "premise"),
  onboarding_exit_or_fail: square("onboarding_exit_or_fail", "onboarding", "Founder facing the final company verdict", "premise"),

  sector_fintech: square("sector_fintech", "sector", "Fintech sector emblem", "founders"),
  sector_healthtech: square("sector_healthtech", "sector", "Healthtech sector emblem", "founders"),
  sector_edtech: square("sector_edtech", "sector", "Edtech sector emblem", "founders"),
  sector_saas: square("sector_saas", "sector", "SaaS sector emblem", "founders"),
  sector_ecommerce: square("sector_ecommerce", "sector", "E-commerce sector emblem", "founders"),
  sector_deeptech: square("sector_deeptech", "sector", "Deep tech sector emblem", "founders"),
  sector_marketplace: square("sector_marketplace", "sector", "Marketplace sector emblem", "founders"),
  sector_climate: square("sector_climate", "sector", "Climate technology sector emblem", "founders"),

  founder_technical: square("founder_technical", "founder", "Technical founder archetype", "founders"),
  founder_sales_driven: square("founder_sales_driven", "founder", "Sales-driven founder archetype", "founders"),
  founder_product_focused: square("founder_product_focused", "founder", "Product-focused founder archetype", "founders"),
  founder_operator: square("founder_operator", "founder", "Operator founder archetype", "founders"),
  founder_visionary: square("founder_visionary", "founder", "Visionary founder archetype", "founders"),

  decision_growth: square("decision_growth", "decision", "Growth strategy decision", "decisions"),
  decision_product: square("decision_product", "decision", "Product strategy decision", "decisions"),
  decision_team: square("decision_team", "decision", "Team strategy decision", "decisions"),
  decision_fundraising: square("decision_fundraising", "decision", "Fundraising strategy decision", "decisions"),
  decision_marketing: square("decision_marketing", "decision", "Marketing strategy decision", "decisions"),
  decision_operations: square("decision_operations", "decision", "Operations strategy decision", "decisions"),

  event_viral_moment: square("event_viral_moment", "event", "Viral growth event", "pressure"),
  event_key_hire_poached: square("event_key_hire_poached", "event", "Key employee poached event", "pressure"),
  event_press_feature: square("event_press_feature", "event", "Major press feature event", "pressure"),
  event_security_incident: square("event_security_incident", "event", "Security incident event", "pressure"),
  event_warm_investor_intro: square("event_warm_investor_intro", "event", "Warm investor introduction event", "pressure"),
  event_market_downturn: square("event_market_downturn", "event", "Market downturn event", "pressure"),
  event_competitor_pr_crisis: square("event_competitor_pr_crisis", "event", "Competitor public-relations crisis event", "pressure"),
  event_major_outage: square("event_major_outage", "event", "Major infrastructure outage event", "pressure"),
  event_government_grant: square("event_government_grant", "event", "Government grant event", "pressure"),
  event_quiet_month: square("event_quiet_month", "event", "Quiet operating period event", "pressure"),
  event_team_burnout: square("event_team_burnout", "event", "Team burnout event", "pressure"),
  event_partnership_revenue_hit: square("event_partnership_revenue_hit", "event", "Partnership revenue event", "pressure"),
  event_regulatory_hurdle: square("event_regulatory_hurdle", "event", "Regulatory hurdle event", "pressure"),
  event_top_customer_churns: square("event_top_customer_churns", "event", "Top customer churn event", "pressure"),
  event_accelerator_offer: square("event_accelerator_offer", "event", "Accelerator offer event", "pressure"),

  investor_board_pressure: square("investor_board_pressure", "investor", "Investor board pressure", "pressure"),
  investor_board_exit_pressure: square("investor_board_exit_pressure", "investor", "Investor exit pressure", "pressure"),
  investor_milestone_achieved: square("investor_milestone_achieved", "investor", "Investor milestone achieved", "pressure"),
  investor_bridge_round_offer: square("investor_bridge_round_offer", "investor", "Bridge round offer", "pressure"),
  investor_intro: square("investor_intro", "investor", "Investor introduction", "pressure"),
  investor_board_conflict: square("investor_board_conflict", "investor", "Board conflict", "pressure"),

  pitch_deck_terminal: square("pitch_deck_terminal", "funding", "Pitch deck command terminal", "capital"),
  vc_offer_received: square("vc_offer_received", "funding", "Venture capital offer received", "capital"),
  vc_pass_declined: square("vc_pass_declined", "funding", "Venture capital pitch declined", "capital"),
  term_sheet_contract: square("term_sheet_contract", "funding", "Term sheet contract", "capital"),
  bootstrap_mode: square("bootstrap_mode", "funding", "Bootstrapped company strategy", "capital"),
  acquisition_offer: square("acquisition_offer", "funding", "Company acquisition offer", "capital"),

  ending_failed: square("ending_failed", "ending", "Failed startup ending", "outcomes"),
  ending_survived: square("ending_survived", "ending", "Surviving startup ending", "outcomes"),
  ending_acquired: square("ending_acquired", "ending", "Acquired startup ending", "outcomes"),

  badge_common: square("badge_common", "badge", "Common founder reputation badge", "outcomes"),
  badge_rare: square("badge_rare", "badge", "Rare founder reputation badge", "outcomes"),
  badge_legendary: square("badge_legendary", "badge", "Legendary founder reputation badge", "outcomes"),
  badge_survived_run: square("badge_survived_run", "badge", "Survived startup run badge", "outcomes"),
  badge_acquired_startup: square("badge_acquired_startup", "badge", "Acquired startup badge", "outcomes"),
  badge_high_valuation: square("badge_high_valuation", "badge", "High valuation badge", "outcomes"),
  badge_clutch_recovery: square("badge_clutch_recovery", "badge", "Clutch recovery badge", "outcomes"),
  badge_repeated_founder: square("badge_repeated_founder", "badge", "Repeat founder badge", "outcomes"),
  badge_failed_startup: square("badge_failed_startup", "badge", "Failed startup badge", "outcomes"),
} as const satisfies Record<string, GameAsset>;

export type GameAssetName = keyof typeof GAME_ASSETS;

export const ONBOARDING_ASSETS = ["onboarding_found_startup", "onboarding_monthly_decisions", "onboarding_exit_or_fail"] as const satisfies readonly GameAssetName[];
export const SECTOR_ASSETS = ["sector_fintech", "sector_healthtech", "sector_edtech", "sector_saas", "sector_ecommerce", "sector_deeptech", "sector_marketplace", "sector_climate"] as const satisfies readonly GameAssetName[];
export const FOUNDER_ASSETS = ["founder_technical", "founder_sales_driven", "founder_product_focused", "founder_operator", "founder_visionary"] as const satisfies readonly GameAssetName[];
export const DECISION_ASSETS = ["decision_growth", "decision_product", "decision_team", "decision_fundraising", "decision_marketing", "decision_operations"] as const satisfies readonly GameAssetName[];
export const EVENT_ASSETS = ["event_viral_moment", "event_key_hire_poached", "event_press_feature", "event_security_incident", "event_warm_investor_intro", "event_market_downturn", "event_competitor_pr_crisis", "event_major_outage", "event_government_grant", "event_quiet_month", "event_team_burnout", "event_partnership_revenue_hit", "event_regulatory_hurdle", "event_top_customer_churns", "event_accelerator_offer"] as const satisfies readonly GameAssetName[];
export const INVESTOR_ASSETS = ["investor_board_pressure", "investor_board_exit_pressure", "investor_milestone_achieved", "investor_bridge_round_offer", "investor_intro", "investor_board_conflict"] as const satisfies readonly GameAssetName[];
export const FUNDING_ASSETS = ["pitch_deck_terminal", "vc_offer_received", "vc_pass_declined", "term_sheet_contract", "bootstrap_mode", "acquisition_offer"] as const satisfies readonly GameAssetName[];
export const ENDING_ASSETS = ["ending_failed", "ending_survived", "ending_acquired"] as const satisfies readonly GameAssetName[];
export const BADGE_ASSETS = ["badge_common", "badge_rare", "badge_legendary", "badge_survived_run", "badge_acquired_startup", "badge_high_valuation", "badge_clutch_recovery", "badge_repeated_founder", "badge_failed_startup"] as const satisfies readonly GameAssetName[];
