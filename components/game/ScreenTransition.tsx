"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ScreenTransitionProps {
  isActive: boolean;
  content?: React.ReactNode;
}

export function ScreenTransition({ isActive, content }: ScreenTransitionProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-[150] bg-[#020617]/95 backdrop-blur-md flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {content || (
            <div className="flex flex-col items-center gap-4">
              <motion.div
                className="w-12 h-12 rounded-full border-2 border-cyan-400/30 border-t-cyan-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.span
                className="text-sm text-cyan-400/60 tracking-[0.2em] font-mono"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                LOADING...
              </motion.span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
