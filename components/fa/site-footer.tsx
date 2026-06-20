"use client";

import { LogoLockup } from "./logo";

const LINKS = [
  { label: "The game", href: "#premise" },
  { label: "Founder journey", href: "#journey" },
  { label: "Investors", href: "#investors" },
  { label: "Command center", href: "#dashboard" },
  { label: "FAQ", href: "#faq" },
  { label: "Mobile beta", href: "#platforms" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-auto w-full overflow-hidden border-t border-white/[0.06] bg-[#05070b]">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 lg:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <LogoLockup className="h-12" glow={false} />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              A native mobile startup roguelike in development for iOS and Android.
            </p>
          </div>
          <nav aria-label="Footer" className="flex max-w-2xl flex-wrap gap-x-5 gap-y-3">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-cyan-soft">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="border-t border-white/[0.06] pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Founder Arena. Mobile game in development.
        </div>
      </div>
    </footer>
  );
}
