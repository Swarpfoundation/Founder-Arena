import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface WrapperProps {
  children: ReactNode;
  className?: string;
  size?: number;
  glow?: "cyan" | "violet" | "emerald" | "rose" | "amber" | false;
}

export function IconCircle({ children, className, size = 40, glow = false }: WrapperProps) {
  const glowClass = glow ? `glow-${glow}` : "";
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-white/5 border border-white/10",
        glowClass,
        className
      )}
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );
}

export function AssetBadgeShell({
  children,
  className,
  size = 48,
  glow = false,
}: WrapperProps) {
  const glowClass = glow ? `glow-${glow}` : "";
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10",
        glowClass,
        className
      )}
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );
}
