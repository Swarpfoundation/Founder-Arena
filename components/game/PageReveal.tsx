"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { pageTransition } from "@/lib/animations";

export function PageReveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : pageTransition.initial}
      animate={reduced ? undefined : pageTransition.animate}
      exit={reduced ? undefined : pageTransition.exit}
    >
      {children}
    </motion.div>
  );
}
