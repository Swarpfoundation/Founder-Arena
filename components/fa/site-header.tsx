"use client";

import * as React from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";
import { LogoLockup } from "./logo";
import { Menu, X } from "lucide-react";

const NAV = [
  { label: "The Game", href: "#premise" },
  { label: "Founder Journey", href: "#journey" },
  { label: "Investors", href: "#investors" },
  { label: "Command Center", href: "#dashboard" },
  { label: "FAQ", href: "#faq" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 24);
  });

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-5 sm:pt-4"
    >
      <div
        className={cn(
          "flex w-full max-w-6xl items-center justify-between gap-4 rounded-2xl px-3.5 py-2.5 transition-all duration-500 sm:px-5",
          scrolled
            ? "glass border-white/10 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.8)]"
            : "border border-transparent"
        )}
      >
        <a href="#top" className="flex items-center" aria-label="Founder Arena home">
          <LogoLockup className="h-7 sm:h-8" glow={false} />
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#platforms"
            className="hidden sm:inline-flex btn-cyan h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium"
          >
            Beta info
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-3 right-3 top-[4.5rem] z-40 lg:hidden"
        >
          <div className="glass rounded-2xl p-3">
            <nav className="flex flex-col" aria-label="Mobile">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-base text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <a
              href="#platforms"
              onClick={() => setOpen(false)}
              className="btn-cyan mt-2 flex h-12 items-center justify-center rounded-full text-sm font-medium"
            >
              Mobile beta info
            </a>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
