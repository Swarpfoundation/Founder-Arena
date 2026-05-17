import { PostTone } from "./types";

interface PostContext {
  startupName: string;
  sector: string;
  month: number;
  productProgress: number;
  founderName: string;
}

// Deterministic selection from an array using a numeric seed.
function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function numericSeed(actionId: string, month: number, startupName: string): number {
  let h = month * 31;
  for (let i = 0; i < actionId.length; i++) h = (h * 17 + actionId.charCodeAt(i)) & 0x7fffffff;
  for (let i = 0; i < startupName.length; i++) h = (h * 13 + startupName.charCodeAt(i)) & 0x7fffffff;
  return h;
}

// ─── Content pools per action ─────────────────────────────────────────────────

const FOUNDER_X_THREAD = [
  (ctx: PostContext) =>
    `We've been building ${ctx.startupName} for ${ctx.month} Founder Weeks. Here's what we actually learned (thread):`,
  (ctx: PostContext) =>
    `Honest update on ${ctx.startupName}: the hard parts nobody talks about. Week ${ctx.month}:`,
  (ctx: PostContext) =>
    `Things I wish I knew before starting ${ctx.startupName}. Product is at ${ctx.productProgress}% and the edge cases are wild.`,
  (ctx: PostContext) =>
    `We shipped something real today. Not polished. Not safe. Just working. ${ctx.startupName} keeps moving.`,
  () =>
    `Founders who tell you it gets easier are lying. Week ${Math.floor(Math.random() * 12) + 1} is different. It gets *clearer*.`,
  (ctx: PostContext) =>
    `The ${ctx.sector} space moves fast. Here's how ${ctx.startupName} is staying alive in it:`,
];

const PRODUCT_DEMO_TIKTOK = [
  (ctx: PostContext) =>
    `60 seconds of ${ctx.startupName}. No narration. Just the product. You'll get it.`,
  (ctx: PostContext) =>
    `We built this in ${ctx.month} Founder Weeks. ${ctx.productProgress}% complete. This is what it looks like right now.`,
  () =>
    `Not a pitch. Not a feature list. Just a real demo, live, nothing edited out.`,
  (ctx: PostContext) =>
    `If you work in ${ctx.sector}, this is for you. Watch the whole thing.`,
  () =>
    `Demo day was last week. This is what the judges didn't see.`,
];

const INSTAGRAM_BTS = [
  () =>
    `3am. Two monitors. Cold coffee. This is what building actually looks like.`,
  (ctx: PostContext) =>
    `The team behind ${ctx.startupName}. Week ${ctx.month}. Still here. Still shipping.`,
  () =>
    `We closed the office early and shipped from a café instead. Sometimes the walls close in.`,
  (ctx: PostContext) =>
    `${ctx.sector} is supposed to be glamorous. It's mostly Figma tabs and Slack threads. We're okay with that.`,
  () =>
    `New hires, old problems, better answers. A week at the company.`,
];

const LAUNCH_ANNOUNCEMENT = [
  (ctx: PostContext) =>
    `${ctx.startupName} is live. After ${ctx.month} Founder Weeks of building, we're shipping to real users today.`,
  (ctx: PostContext) =>
    `We told no one about this until now. ${ctx.startupName} is open. ${ctx.sector}, rethought.`,
  (ctx: PostContext) =>
    `Product progress: ${ctx.productProgress}%. Users: incoming. Launch day for ${ctx.startupName} starts now.`,
  () =>
    `It's not perfect. It never is. But it's real and it's live and it works. Go build with us.`,
  (ctx: PostContext) =>
    `The waitlist closes. ${ctx.startupName} goes public. See you on the other side.`,
];

const FOUNDER_TRANSPARENCY = [
  (ctx: PostContext) =>
    `Week ${ctx.month} numbers: revenue is real, burn is real, the pressure is real. Here's where we actually stand.`,
  (ctx: PostContext) =>
    `Not every startup needs to chase hype. This sprint we chose retention over noise. Here's what that cost ${ctx.startupName}.`,
  () =>
    `We almost ran out of cash. We didn't. Here's what we cut, what we kept, and what we learned.`,
  (ctx: PostContext) =>
    `Honest update: ${ctx.productProgress}% done on the core product. The rest is in motion. No hype, just work.`,
  () =>
    `I'm going to tell you something most founders won't: we had a bad sprint and we're still here.`,
];

const INFLUENCER_COLLAB = [
  (ctx: PostContext) =>
    `We partnered with someone whose audience actually needs ${ctx.startupName}. Here's the result.`,
  (ctx: PostContext) =>
    `The collab dropped today. ${ctx.sector} just got a little louder.`,
  () =>
    `When the right creator meets the right product, something different happens. Watch this.`,
  (ctx: PostContext) =>
    `They used ${ctx.startupName} for a week. Here's what they said.`,
];

const CRISIS_RESPONSE = [
  () =>
    `We heard the criticism. Here's our response — and what we're actually doing about it.`,
  (ctx: PostContext) =>
    `${ctx.startupName} had a problem this week. We're not hiding from it. Here's the full picture.`,
  () =>
    `Accountability post. We got this wrong. Here's what's changing.`,
  () =>
    `Some of the feedback this week was hard to read. Most of it was right. Here's how we're responding.`,
];

const CUSTOMER_TESTIMONIAL = [
  (ctx: PostContext) =>
    `Real users. Real results. This is why we built ${ctx.startupName}.`,
  () =>
    `Three customers. Three different problems. One product that worked for all of them.`,
  (ctx: PostContext) =>
    `The ${ctx.sector} team at a mid-market company cut their workflow time by 40%. Here's how.`,
  () =>
    `We stopped talking about features and started letting our users explain it.`,
  () =>
    `Customer story incoming. No editing. Just what they actually said.`,
];

const INVESTOR_UPDATE = [
  (ctx: PostContext) =>
    `Week ${ctx.month} investor brief for ${ctx.startupName}: revenue, runway, and what's next.`,
  (ctx: PostContext) =>
    `Sharing our Week ${ctx.month} traction report publicly. If you're in ${ctx.sector}, this will interest you.`,
  () =>
    `We tell our investors the same thing we tell the public: here are the numbers, here is the plan.`,
  (ctx: PostContext) =>
    `${ctx.startupName} update: ${ctx.productProgress}% product complete, revenue growing, team steady. The details:`,
];

const COMPETITOR_CALLOUT = [
  (ctx: PostContext) =>
    `The incumbents in ${ctx.sector} have been doing this the same way for years. ${ctx.startupName} is not doing it that way.`,
  () =>
    `A competitor raised $40M to solve a problem we solved in 3 months. Interesting.`,
  () =>
    `If you've been using [the other thing], here's what you're missing. We built the alternative.`,
  (ctx: PostContext) =>
    `The ${ctx.sector} market leader is bloated, slow, and expensive. ${ctx.startupName} exists because of that.`,
];

// ─── Reaction content pools (for feed items, not player posts) ───────────────

export const CUSTOMER_REACTIONS_POSITIVE = [
  "Finally someone shipping something real in this space.",
  "Been waiting for this. Signed up immediately.",
  "The demo sold me. Onboarding tomorrow.",
  "This is exactly what our team needed. Sharing with the group.",
  "The transparency hit different. We trust you now.",
];

export const CUSTOMER_REACTIONS_NEGATIVE = [
  "The demo exposed some rough edges. Will wait for a stable release.",
  "Saw the thread. Lots of promise, but where's the product?",
  "The launch felt rushed. Bugs on day one is a bad sign.",
  "Support tickets aren't getting answered. Credibility taking a hit.",
];

export const INVESTOR_REACTIONS_POSITIVE = [
  "Strong signal. Watching this closely.",
  "Traction is early but the founder's judgment is sound.",
  "The transparency post bumped this onto my list.",
  "Credibility is building. Keep the updates coming.",
];

export const INVESTOR_REACTIONS_NEGATIVE = [
  "Update looks good on paper but the numbers don't fully support the narrative.",
  "High hype, uncertain product. Still cautious.",
  "The callout was aggressive. Watching to see if it lands.",
];

export const RIVAL_REACTIONS = [
  "A rival founder posted: 'This will be obsolete in 6 months.'",
  "A competing startup copied your launch messaging within 48 hours.",
  "A rival just announced a competing feature in response to your demo.",
  "A competitor raised a bridge round right after your viral post. Coincidence.",
  "The rival's founder went quiet after your launch. Usually means they're watching.",
];

export const PRESS_REACTIONS_POSITIVE = [
  "A journalist at a tech publication is asking for a comment.",
  "Three industry newsletters mentioned your launch today.",
  "A podcast reached out about a founder story segment.",
];

export const PRESS_REACTIONS_NEGATIVE = [
  "A journalist is asking questions about your product's stability claims.",
  "A critical thread about your launch is gaining traction.",
  "An industry analyst flagged your growth numbers as 'optimistic'.",
];

// ─── Main generator ──────────────────────────────────────────────────────────

const ACTION_POOLS: Record<string, Array<(ctx: PostContext) => string>> = {
  founder_x_thread: FOUNDER_X_THREAD,
  product_demo_tiktok: PRODUCT_DEMO_TIKTOK,
  instagram_bts: INSTAGRAM_BTS,
  launch_announcement: LAUNCH_ANNOUNCEMENT,
  founder_transparency_post: FOUNDER_TRANSPARENCY,
  influencer_collab: INFLUENCER_COLLAB,
  crisis_response: CRISIS_RESPONSE,
  customer_testimonial: CUSTOMER_TESTIMONIAL,
  investor_update: INVESTOR_UPDATE,
  competitor_callout: COMPETITOR_CALLOUT,
};

const ACTION_TONES: Record<string, PostTone> = {
  founder_x_thread: "builder",
  product_demo_tiktok: "hype",
  instagram_bts: "transparent",
  launch_announcement: "visionary",
  founder_transparency_post: "transparent",
  influencer_collab: "hype",
  crisis_response: "crisis_response",
  customer_testimonial: "customer_centric",
  investor_update: "investor_facing",
  competitor_callout: "chaotic",
};

export function generatePostContent(
  actionId: string,
  ctx: PostContext
): { content: string; tone: PostTone } {
  const pool = ACTION_POOLS[actionId] ?? FOUNDER_X_THREAD;
  const seed = numericSeed(actionId, ctx.month, ctx.startupName);
  const fn = pick(pool, seed);
  return { content: fn(ctx), tone: ACTION_TONES[actionId] ?? "builder" };
}
