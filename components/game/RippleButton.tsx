"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RippleButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit";
}

export function RippleButton({
  children,
  className,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdRef.current++;
      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }

    onClick?.();
  };

  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:shadow-[0_0_24px_rgba(34,211,238,0.4)]",
    secondary: "bg-gradient-to-r from-violet-500 to-violet-600 text-white hover:shadow-[0_0_24px_rgba(139,92,246,0.4)]",
    danger: "bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:shadow-[0_0_24px_rgba(244,63,94,0.4)]",
    ghost: "bg-transparent border border-white/10 text-white hover:bg-white/5 hover:border-white/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3 text-base",
  };

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      className={cn(
        "relative overflow-hidden rounded-lg font-medium transition-all duration-200",
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      whileHover={!disabled ? { y: -2 } : undefined}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
    >
      <span className="relative z-10">{children}</span>
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/20 pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: "translate(-50%, -50%)",
          }}
          initial={{ width: 0, height: 0, opacity: 0.5 }}
          animate={{ width: 300, height: 300, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </motion.button>
  );
}
