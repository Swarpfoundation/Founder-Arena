"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2, Check } from "lucide-react";

interface CopyLinkButtonProps {
  url: string;
  label?: string;
  className?: string;
}

export function CopyLinkButton({ url, label = "Copy link", className }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing silently
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={className}
      aria-label={copied ? "Link copied" : label}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <Link2 className="w-4 h-4 mr-1.5" />
          {label}
        </>
      )}
    </Button>
  );
}
