import type { Metadata } from "next";
// Use the geist npm package (ships bundled woff2 files) instead of next/font/google
// so that builds remain deterministic in offline/restricted environments.
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { GameLayout } from "@/components/game/GameLayout";
import { Toaster } from "sonner";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "Founder Arena",
  description:
    "AI-powered startup strategy game. Pitch your idea, raise funding, build your team, and survive 12 Founder Weeks of volatile markets.",
  keywords: [
    "startup",
    "simulation",
    "game",
    "AI",
    "VC",
    "pitch",
    "funding",
  ],
  authors: [{ name: "Founder Arena" }],
  openGraph: {
    title: "Founder Arena",
    description: "AI-powered startup strategy game",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#05050a] text-foreground overflow-x-hidden`}
      >
        <GameLayout>{children}</GameLayout>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(5, 5, 10, 0.95)",
              border: "1px solid rgba(0,240,255,0.3)",
              color: "#00f0ff",
              fontFamily: "'Inter', sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
