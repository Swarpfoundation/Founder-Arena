import {
  ArenaFeedItem,
  FeedItemSeverity,
  SocialAction,
  SocialActionEffects,
  SocialContext,
  SocialMetrics,
  SocialPost,
} from "./types";
import {
  CUSTOMER_REACTIONS_NEGATIVE,
  CUSTOMER_REACTIONS_POSITIVE,
  INVESTOR_REACTIONS_NEGATIVE,
  INVESTOR_REACTIONS_POSITIVE,
  PRESS_REACTIONS_NEGATIVE,
  PRESS_REACTIONS_POSITIVE,
  RIVAL_REACTIONS,
} from "./post-content";

let _feedSeq = 0;
function feedId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++_feedSeq}`;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function seed(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33 + str.charCodeAt(i)) & 0x7fffffff;
  return h;
}

// ─── Feed items generated immediately when a social action is performed ───────

export function generateActionFeedItems(
  action: SocialAction,
  post: SocialPost,
  metrics: SocialMetrics,
  ctx: SocialContext,
  didBackfire: boolean,
  appliedEffects: SocialActionEffects
): ArenaFeedItem[] {
  const items: ArenaFeedItem[] = [];
  const s = seed(action.id + ctx.month + ctx.startupName);

  // 1. The post itself
  items.push({
    id: feedId("post"),
    month: ctx.month,
    category: "post",
    title: actionPostTitle(action, ctx),
    body: post.content,
    severity: didBackfire ? "warning" : "positive",
    source: "founder",
    linkedPostId: post.id,
    effects: appliedEffects,
  });

  // 2. Backfire notification
  if (didBackfire && action.backfireCondition) {
    items.push({
      id: feedId("crisis"),
      month: ctx.month,
      category: "crisis",
      title: "Post backfired",
      body: action.backfireCondition.warningText,
      severity: "critical",
      source: "community",
      linkedPostId: post.id,
    });
  }

  // 3. Customer reaction
  if (
    action.id === "launch_announcement" ||
    action.id === "product_demo_tiktok" ||
    action.id === "customer_testimonial"
  ) {
    const positive =
      !didBackfire && metrics.trust > 50 && ctx.productProgress > 50;
    const pool = positive ? CUSTOMER_REACTIONS_POSITIVE : CUSTOMER_REACTIONS_NEGATIVE;
    items.push({
      id: feedId("reaction"),
      month: ctx.month,
      category: "reaction",
      title: positive ? "Customer response: positive" : "Customer response: mixed",
      body: pick(pool, s + 1),
      severity: positive ? "positive" : "warning",
      source: "customer",
      linkedPostId: post.id,
    });
  }

  // 4. Investor reaction
  if (
    action.id === "investor_update" ||
    action.id === "founder_transparency_post" ||
    (action.id === "launch_announcement" && !didBackfire)
  ) {
    const positive = ctx.investorScore > 45;
    const pool = positive ? INVESTOR_REACTIONS_POSITIVE : INVESTOR_REACTIONS_NEGATIVE;
    items.push({
      id: feedId("reaction"),
      month: ctx.month,
      category: "reaction",
      title: positive ? "Investor signal: positive" : "Investor signal: cautious",
      body: pick(pool, s + 2),
      severity: positive ? "positive" : "neutral",
      source: "investor",
      linkedPostId: post.id,
    });
  }

  // 5. Rival reaction — triggered by hype-heavy moves
  if (
    action.id === "competitor_callout" ||
    action.id === "launch_announcement" ||
    (action.id === "influencer_collab" && (appliedEffects.viralMomentumDelta ?? 0) > 15)
  ) {
    items.push({
      id: feedId("rival"),
      month: ctx.month,
      category: "rival",
      title: "Rival activity detected",
      body: pick(RIVAL_REACTIONS, s + 3),
      severity: "warning",
      source: "rival",
      linkedPostId: post.id,
    });
  }

  // 6. Press attention — positive
  if (
    !didBackfire &&
    (action.id === "launch_announcement" || action.id === "influencer_collab") &&
    metrics.hype > 50
  ) {
    items.push({
      id: feedId("press"),
      month: ctx.month,
      category: "press",
      title: "Press pickup",
      body: pick(PRESS_REACTIONS_POSITIVE, s + 4),
      severity: "positive",
      source: "journalist",
      linkedPostId: post.id,
    });
  }

  // 7. Press attention — negative (when crisis or callout)
  if (
    didBackfire ||
    action.id === "competitor_callout" ||
    metrics.brandRisk > 60
  ) {
    items.push({
      id: feedId("press"),
      month: ctx.month,
      category: "press",
      title: "Journalist inquiry",
      body: pick(PRESS_REACTIONS_NEGATIVE, s + 5),
      severity: "warning",
      source: "journalist",
      linkedPostId: post.id,
    });
  }

  // 8. Viral milestone
  if (
    !didBackfire &&
    (appliedEffects.viralMomentumDelta ?? 0) >= 15
  ) {
    items.push({
      id: feedId("viral"),
      month: ctx.month,
      category: "viral",
      title: "Viral momentum building",
      body: `Your ${action.channelLabel} content is spreading. Impressions climbing. Inbound messages up.`,
      severity: "positive",
      source: "community",
      linkedPostId: post.id,
    });
  }

  return items;
}

// ─── Feed items generated automatically each month (simulation hook) ──────────

export function generateMonthlyPassiveFeedItems(
  metrics: SocialMetrics,
  ctx: SocialContext
): ArenaFeedItem[] {
  const items: ArenaFeedItem[] = [];
  const s = seed(ctx.startupId + ctx.month);

  // Brand risk warning
  if (metrics.brandRisk > 70) {
    items.push({
      id: feedId("crisis"),
      month: ctx.month,
      category: "crisis",
      title: "Brand risk critical",
      body: `Public sentiment toward ${ctx.startupName} is under pressure. A crisis response post could help.`,
      severity: "critical",
      source: "community",
    });
  } else if (metrics.brandRisk > 45) {
    items.push({
      id: feedId("crisis"),
      month: ctx.month,
      category: "crisis",
      title: "Brand risk elevated",
      body: "Negative mentions are accumulating. Monitoring public sentiment closely.",
      severity: "warning",
      source: "community",
    });
  }

  // Hype decay warning
  if (metrics.hype < 20 && ctx.month > 3) {
    items.push({
      id: feedId("milestone"),
      month: ctx.month,
      category: "milestone",
      title: "Narrative fading",
      body: `${ctx.startupName} has gone quiet. The market moves on quickly — consider a fresh post.`,
      severity: "warning",
      source: "community",
    });
  }

  // Viral momentum still high — mention it
  if (metrics.viralMomentum > 50) {
    items.push({
      id: feedId("viral"),
      month: ctx.month,
      category: "viral",
      title: "Residual viral momentum",
      body: `Last month's content is still circulating. Hype window is open — follow up before it closes.`,
      severity: "positive",
      source: "community",
    });
  }

  // Community milestone
  if (metrics.followers >= 1000 && metrics.followers < 1200 && ctx.month <= 6) {
    items.push({
      id: feedId("milestone"),
      month: ctx.month,
      category: "milestone",
      title: "1,000 followers",
      body: `${ctx.startupName} crossed 1K followers. Small milestone, real signal.`,
      severity: "positive",
      source: "founder",
    });
  }

  // Trust high — investor perception positive
  if (metrics.trust > 75 && ctx.investorScore > 55) {
    items.push({
      id: feedId("reaction"),
      month: ctx.month,
      category: "reaction",
      title: "Investor confidence up",
      body: pick(INVESTOR_REACTIONS_POSITIVE, s + 10),
      severity: "positive",
      source: "investor",
    });
  }

  // Passive rival pressure if hype was strong last month
  if (metrics.hype > 65 && ctx.month > 2) {
    items.push({
      id: feedId("rival"),
      month: ctx.month,
      category: "rival",
      title: "Competitive noise",
      body: pick(RIVAL_REACTIONS, s + 20),
      severity: "neutral",
      source: "rival",
    });
  }

  return items;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function actionPostTitle(action: SocialAction, ctx: SocialContext): string {
  const channelStr = Array.isArray(action.channel)
    ? action.channel.map(channelName).join(" + ")
    : channelName(action.channel);
  return `${ctx.founderName} posted on ${channelStr}: ${action.title}`;
}

function channelName(ch: string): string {
  return ch === "x" ? "X" : ch === "founder_blog" ? "Blog" : ch.charAt(0).toUpperCase() + ch.slice(1);
}

export function severityLabel(s: FeedItemSeverity): string {
  return s;
}
