"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GameBackground } from "./GameBackground";
import { CRTEffect } from "./CRTEffect";
import { GameNav } from "./GameNav";

const GAME_ROUTE_PREFIXES = ["/dashboard", "/market", "/leaderboard", "/profile", "/graveyard", "/startup", "/founder"];

function isGameRoute(pathname: string): boolean {
  return GAME_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

export function GameLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const gameRoute = isGameRoute(pathname);

  return (
    <div className="relative min-h-screen bg-[#05050a] overflow-hidden">
      <GameBackground />
      {gameRoute && <CRTEffect />}
      {gameRoute && <GameNav />}
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
