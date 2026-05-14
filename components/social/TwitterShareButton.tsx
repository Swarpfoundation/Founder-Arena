"use client";

import { generateTwitterShareUrl } from "@/lib/social/share-text";
import { Twitter } from "lucide-react";

interface TwitterShareButtonProps {
  text: string;
  className?: string;
}

export function TwitterShareButton({ text, className }: TwitterShareButtonProps) {
  const url = generateTwitterShareUrl(text);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Share on X (Twitter)"
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white/10 bg-transparent hover:bg-white/5 hover:border-white/20 h-8 px-3 ${className ?? ""}`}
    >
      <Twitter className="w-4 h-4 mr-1.5" />
      Share on X
    </a>
  );
}
