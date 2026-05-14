"use client";

import { CopyLinkButton } from "./CopyLinkButton";
import { TwitterShareButton } from "./TwitterShareButton";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  shareText: string;
  className?: string;
}

export function ShareButtons({ url, shareText, className }: ShareButtonsProps) {
  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Founder Arena",
          text: shareText,
          url,
        });
      } catch {
        // User cancelled or share failed
      }
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <CopyLinkButton url={url} />
      <TwitterShareButton text={shareText} />
      {typeof navigator !== "undefined" && "share" in navigator && (
        <Button variant="outline" size="sm" onClick={handleNativeShare}>
          <Share2 className="w-4 h-4 mr-1.5" />
          Share
        </Button>
      )}
    </div>
  );
}
