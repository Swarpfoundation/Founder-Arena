"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Crosshair, ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#05050a] flex flex-col items-center justify-center overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0,240,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,240,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="relative inline-block">
            <motion.div
              animate={{ filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Image src="/logo.png" alt="Founder Arena" width={120} height={120} priority />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          className="text-6xl md:text-8xl font-black tracking-tighter mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400 text-glow-cyan">
            FOUNDER
          </span>
          <br />
          <span className="text-white tracking-[0.2em]" style={{ textShadow: "0 0 40px rgba(0,240,255,0.3)" }}>
            ARENA
          </span>
        </motion.h1>

        <motion.p
          className="text-cyan-400/60 text-lg md:text-xl tracking-[0.3em] uppercase mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Build. Raise. Survive.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Link href="/dashboard">
            <motion.button
              className="group relative px-10 py-5 bg-transparent overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 border-2 border-cyan-400/50" />
              <div className="absolute inset-0 bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400" />
              <span className="relative flex items-center gap-3 text-cyan-400 font-bold tracking-[0.2em]">
                <Crosshair className="w-5 h-5" />
                ENTER ARENA
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>
          </Link>

          <Link href="/login">
            <motion.button
              className="group relative px-10 py-5 bg-transparent overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 border border-white/20" />
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-3 text-white/60 font-bold tracking-[0.2em] group-hover:text-white transition-colors">
                LOGIN
              </span>
            </motion.button>
          </Link>
        </motion.div>

        <motion.div
          className="mt-16 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p className="text-[10px] tracking-[0.4em] text-cyan-400/40 uppercase">
            Closed Beta · Season 1 Live
          </p>
          <p className="text-sm text-white/40 max-w-md text-center">
            Startup roguelike. Pitch to AI VCs, raise funding, run 12 months of
            crises, rivals, and boardroom battles. Every run becomes a documentary.
          </p>
          <Link href="/demo" className="mt-2 text-xs text-cyan-400/50 hover:text-cyan-400 transition-colors tracking-widest uppercase underline underline-offset-4">
            See how it works →
          </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
    </div>
  );
}
