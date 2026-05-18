"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { submitBetaFeedbackAction } from "@/lib/actions/beta-feedback";

interface BetaFeedbackFormProps {
  startupId?: string;
  reviewId?: string;
  decision?: string;
  score?: number | null;
  provider?: string;
  route?: string;
  defaultType?: "ai_review_quality" | "bug_report" | "gameplay_balance" | "confusing_ui" | "referral_issue" | "other";
  buttonLabel?: string;
}

const REVIEW_CATEGORIES = [
  ["review_too_harsh", "Review too harsh"],
  ["review_too_generous", "Review too generous"],
  ["explanation_unclear", "Explanation unclear"],
  ["rejection_reason_wrong", "Rejection reason wrong"],
  ["score_inconsistent", "Score seems inconsistent"],
  ["term_sheet_missing_or_wrong", "Term sheet missing/wrong"],
  ["provider_output_broken", "Output looked broken"],
  ["other", "Other"],
] as const;

const FEEDBACK_TYPES = [
  ["ai_review_quality", "AI review quality"],
  ["bug_report", "Bug report"],
  ["gameplay_balance", "Gameplay balance"],
  ["confusing_ui", "UX confusion"],
  ["referral_issue", "Referral issue"],
  ["other", "Other"],
] as const;

export function BetaFeedbackForm({
  startupId,
  reviewId,
  decision,
  score,
  provider,
  route,
  defaultType = "ai_review_quality",
  buttonLabel = "Report review quality",
}: BetaFeedbackFormProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(defaultType);
  const [category, setCategory] = useState("explanation_unclear");
  const [rating, setRating] = useState("3");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setResult(null);
    startTransition(async () => {
      const response = await submitBetaFeedbackAction({
        startupId,
        reviewId,
        type,
        category,
        rating: Number(rating),
        message,
        route,
        decision,
        score: typeof score === "number" ? score : undefined,
        provider,
      });
      if (response.success) {
        setMessage("");
        setResult({ tone: "success", message: "Feedback sent. It will appear in the private beta admin inbox." });
        setOpen(false);
      } else {
        setResult({ tone: "error", message: response.error ?? "Feedback could not be sent." });
      }
    });
  }

  if (!open) {
    return (
      <div className="border border-cyan-500/15 bg-cyan-500/5 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Private Beta Feedback</p>
            <p className="mt-1 text-xs text-white/50">
              Reports are private to admins and do not change this review decision automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center gap-2 border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-cyan-200 hover:bg-cyan-400/15"
          >
            <MessageSquare className="h-4 w-4" />
            {buttonLabel}
          </button>
        </div>
        {result && (
          <p className={`mt-3 text-xs ${result.tone === "success" ? "text-emerald-300" : "text-rose-300"}`}>
            {result.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="border border-violet-500/20 bg-violet-500/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-300">Send Beta Feedback</p>
          <p className="mt-1 text-xs text-white/45">
            Do not include passwords, API keys, private personal details, or payment data.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="border border-white/10 bg-white/[0.03] p-2 text-white/50 hover:text-white"
          aria-label="Close feedback form"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-xs text-white/55">
          Type
          <select
            value={type}
            onChange={(event) => setType(event.target.value as typeof type)}
            className="mt-1 w-full border border-white/10 bg-[#0a0f1e] px-3 py-2 text-sm text-white"
          >
            {FEEDBACK_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-white/55">
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-1 w-full border border-white/10 bg-[#0a0f1e] px-3 py-2 text-sm text-white"
          >
            {REVIEW_CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-white/55">
          Rating
          <select
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            className="mt-1 w-full border border-white/10 bg-[#0a0f1e] px-3 py-2 text-sm text-white"
          >
            <option value="5">5 - Very useful</option>
            <option value="4">4 - Useful</option>
            <option value="3">3 - Mixed</option>
            <option value="2">2 - Weak</option>
            <option value="1">1 - Broken</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block text-xs text-white/55">
        What should we review?
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, 2000))}
          rows={4}
          className="mt-1 w-full resize-none border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/25"
          placeholder="Example: The rejection was useful, but the market concern missed the customer segment I described."
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={isPending || message.trim().length < 8}
          className="inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-200 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {isPending ? "Sending" : "Send feedback"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/55 hover:text-white"
        >
          Cancel
        </button>
        {result && (
          <p className={`text-xs ${result.tone === "success" ? "text-emerald-300" : "text-rose-300"}`}>
            {result.message}
          </p>
        )}
      </div>
    </div>
  );
}
