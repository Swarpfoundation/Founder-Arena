import type { AIReviewJobStatus, AIReviewStatusPresentation } from "./types";

export function getAIReviewStatusPresentation(status: AIReviewJobStatus): AIReviewStatusPresentation {
  switch (status) {
    case "queued":
      return {
        label: "Queued",
        tone: "cyan",
        description: "Your pitch is waiting for the private beta AI review pipeline.",
        cta: "Refresh status",
      };
    case "running":
      return {
        label: "Running",
        tone: "violet",
        description: "The AI review is being generated. You can keep operating while it finishes.",
        cta: "Check again",
      };
    case "retrying":
      return {
        label: "Retrying",
        tone: "amber",
        description: "The provider had a transient issue. The worker will retry safely.",
        cta: "Check again",
      };
    case "completed":
      return {
        label: "Completed",
        tone: "emerald",
        description: "The review is ready.",
        cta: "Open review",
      };
    case "failed":
      return {
        label: "Failed",
        tone: "rose",
        description: "The review could not be generated. Try again later or enable mock fallback.",
        cta: "Return to pitch",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        tone: "rose",
        description: "This review job was cancelled.",
        cta: "Return to pitch",
      };
  }
}
