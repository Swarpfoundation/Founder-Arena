"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crosshair,
  Plus,
  Trophy,
  TrendingUp,
  User,
  Skull,
  ChevronRight,
  LogOut,
  Home,
  CreditCard,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { path: "/dashboard", label: "COMMAND", icon: Crosshair },
  { path: "/startup/new", label: "DEPLOY", icon: Plus },
  { path: "/leaderboard", label: "RANKINGS", icon: Trophy },
  { path: "/market", label: "INTEL", icon: TrendingUp },
  { path: "/profile", label: "OPERATIVE", icon: User },
  { path: "/graveyard", label: "FALLEN", icon: Skull },
  { path: "/billing", label: "BILLING", icon: CreditCard },
];

export function GameNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const activePath = pathname;

  return (
    <>
      {/* Floating Menu Button */}
      <motion.button
        className="fixed top-6 left-6 z-[100] w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-cyan-400/30 flex items-center justify-center text-cyan-400 hover:border-cyan-400/60 hover:text-cyan-300 transition-all"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <Image src="/logo.png" alt="Founder Arena" width={24} height={24} />
            </motion.div>
          ) : (
            <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <ChevronRight className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* HUD-style Title */}
      <div className="fixed top-6 right-6 z-[100] flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 relative">
            <Image src="/logo.png" alt="Founder Arena" width={32} height={32} />
          </div>
          <span className="text-sm font-bold tracking-[0.3em] text-cyan-400 hidden md:block group-hover:text-glow-cyan transition-all">
            FOUNDER ARENA
          </span>
        </Link>
      </div>

      {/* Full Screen Game Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[99] bg-black/90 backdrop-blur-xl flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl w-full px-6">
              {navItems.map((item, i) => {
                const isActive = activePath === item.path || activePath.startsWith(item.path + "/");
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
                  >
                    <Link
                      href={item.path}
                      onClick={() => setOpen(false)}
                      className={`block relative group overflow-hidden ${isActive ? "pointer-events-none" : ""}`}
                    >
                      <div className={`relative p-6 border transition-all duration-300 ${
                        isActive
                          ? "border-cyan-400/60 bg-cyan-400/10 glow-cyan"
                          : "border-white/10 bg-white/5 hover:border-cyan-400/30 hover:bg-cyan-400/5"
                      }`}>
                        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400/40" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400/40" />
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 flex items-center justify-center ${isActive ? "text-cyan-400" : "text-white/40 group-hover:text-cyan-400"} transition-colors`}>
                            <item.icon className="w-7 h-7" />
                          </div>
                          <div>
                            <p className={`text-lg font-bold tracking-wider ${isActive ? "text-cyan-400 text-glow-cyan" : "text-white/80 group-hover:text-white"} transition-colors`}>
                              {item.label}
                            </p>
                            {isActive && (
                              <motion.div
                                className="h-0.5 bg-cyan-400 mt-1"
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 0.3 }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: navItems.length * 0.05 }}
                className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center gap-4"
              >
                <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 px-6 py-3 border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all text-sm tracking-wider">
                  <Home className="w-4 h-4" /> MAINFRAME
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut({ redirectTo: "/" });
                  }}
                  className="flex items-center gap-2 px-6 py-3 border border-rose-400/20 text-rose-400/60 hover:text-rose-400 hover:border-rose-400/40 transition-all text-sm tracking-wider cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> EJECT
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
