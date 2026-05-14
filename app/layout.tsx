import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GameLayout } from "@/components/game/GameLayout";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Founder Arena",
  description:
    "AI-powered startup strategy game. Pitch your idea, raise funding, build your team, and survive 12 months of volatile markets.",
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
