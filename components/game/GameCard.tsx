"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

interface GameCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "cyan" | "violet" | "rose" | "emerald" | "amber" | "magenta" | "gold" | string | false;
  variant?: "default" | "subtle" | "solid";
  tilt?: boolean;
  pulse?: boolean;
  shimmer?: boolean;
  entrance?: boolean;
  onClick?: () => void;
}

export function GameCard({
  children,
  className,
  glow = false,
  variant = "default",
  pulse = false,
  entrance = false,
  onClick,
}: GameCardProps) {
  const reduced = useReducedMotion();

  const glowColor = glow ? {
    cyan: "glow-cyan",
    violet: "glow-violet",
    rose: "glow-rose",
    emerald: "glow-emerald",
    amber: "glow-gold",
    magenta: "glow-magenta",
    gold: "glow-gold",
  }[glow as string] || "" : "";

  const glowPulse = pulse && glow ? "animate-pulse-neon" : "";

  const variantClass = variant === "subtle"
    ? "bg-secondary/40 border-white/5"
    : variant === "solid"
    ? "bg-card border-border"
    : "game-card";

  return (
    <motion.div
      className={cn(
        "relative transition-all duration-300 p-5",
        variantClass,
        glowColor,
        glowPulse,
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      initial={entrance ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!reduced ? { y: -4 } : undefined}
      whileTap={!reduced ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
