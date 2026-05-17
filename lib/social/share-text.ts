export type ShareContext =
  | { type: "startup_success"; name: string; monthsSurvived: number; valuation: number; outcome: string }
  | { type: "startup_death"; name: string; monthsSurvived: number; deathReason: string | null }
  | { type: "acquisition"; name: string; acquirer: string; price: number }
  | { type: "exit"; name: string; exitType: string; valuation: number }
  | { type: "leaderboard_rank"; rank: number; category: string; startupName: string; score: number }
  | { type: "achievement"; title: string; description: string }
  | { type: "founder_profile"; name: string; level: number; bestScore: number; totalStartups: number };

const MAX_LENGTH = 280;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}

export function generateShareText(context: ShareContext, baseUrl?: string): string {
  let text = "";

  switch (context.type) {
    case "startup_success": {
      const val = `$${(context.valuation / 1000000).toFixed(1)}M`;
      text = `My startup ${context.name} survived ${context.monthsSurvived} Founder Weeks in Founder Arena and reached a ${val} valuation. Outcome: ${context.outcome}.`;
      break;
    }
    case "startup_death": {
      const reason = context.deathReason ?? "market forces";
      text = `My startup ${context.name} died in Week ${context.monthsSurvived} because of ${reason.toLowerCase()}. Lesson learned: burn kills faster than competition.`;
      break;
    }
    case "acquisition": {
      const price = `$${(context.price / 1000000).toFixed(1)}M`;
      text = `My startup ${context.name} was acquired by ${context.acquirer} for ${price} in Founder Arena.`;
      break;
    }
    case "exit": {
      const val = `$${(context.valuation / 1000000).toFixed(1)}M`;
      text = `My startup ${context.name} had a ${context.exitType} exit at a ${val} valuation in Founder Arena.`;
      break;
    }
    case "leaderboard_rank": {
      text = `I ranked #${context.rank} in ${context.category} on Founder Arena with ${context.startupName}. Score: ${context.score.toLocaleString()}.`;
      break;
    }
    case "achievement": {
      text = `Unlocked "${context.title}" in Founder Arena: ${context.description}`;
      break;
    }
    case "founder_profile": {
      text = `Level ${context.level} founder in Founder Arena. Best score: ${context.bestScore.toLocaleString()}. ${context.totalStartups} ventures started.`;
      break;
    }
  }

  if (baseUrl) {
    text += ` ${baseUrl}`;
  }

  return truncate(text, MAX_LENGTH);
}

export function generateTwitterShareUrl(text: string): string {
  const params = new URLSearchParams({ text });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function generateLinkedInShareUrl(url: string, title?: string, summary?: string): string {
  const params = new URLSearchParams({ url });
  if (title) params.set("title", title);
  if (summary) params.set("summary", summary);
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}
