export const TIMING = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  dramatic: 0.8,
  countUp: 1.2,
} as const;

export const EASE = {
  smooth: [0.25, 0.46, 0.45, 0.94] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  spring: { type: "spring" as const, stiffness: 100, damping: 15 },
  springTight: { type: "spring" as const, stiffness: 300, damping: 25 },
};

export const STAGGER = {
  fast: 0.04,
  normal: 0.08,
  slow: 0.12,
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE.smooth } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: EASE.smooth } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE.smooth } },
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE.smooth } },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE.smooth } },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: STAGGER.normal, delayChildren: 0.1 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE.smooth } },
};

export const pageTransition = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut" as const } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2, ease: "easeIn" as const } },
};

export const cardHover = {
  rest: { y: 0, boxShadow: "0 0 12px rgba(34,211,238,0.15)" },
  hover: { y: -4, boxShadow: "0 0 24px rgba(34,211,238,0.3)", transition: { duration: 0.3, ease: EASE.smooth } },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
};

export const glowColors = {
  cyan: "rgba(34,211,238,0.3)",
  violet: "rgba(139,92,246,0.3)",
  rose: "rgba(244,63,94,0.3)",
  emerald: "rgba(52,211,153,0.3)",
  amber: "rgba(251,191,36,0.3)",
};

export const glowIntense = {
  cyan: "rgba(34,211,238,0.6)",
  violet: "rgba(139,92,246,0.6)",
  rose: "rgba(244,63,94,0.6)",
  emerald: "rgba(52,211,153,0.6)",
  amber: "rgba(251,191,36,0.6)",
};
