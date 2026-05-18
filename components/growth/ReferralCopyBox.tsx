"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function ReferralCopyBox({ code, link }: { code: string; link: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="border border-cyan-500/20 bg-cyan-500/10 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300/70">
        Referral Link
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-white/80">
          {link}
        </div>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center justify-center gap-2 border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-400/20"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-3 text-xs text-white/45">
        Code: <span className="font-mono text-white/70">{code}</span>
      </p>
    </div>
  );
}
