"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/* Full lockup using the official transparent PNG */
export function LogoLockup({
  className,
  imgClassName,
  glow = true,
}: {
  className?: string;
  imgClassName?: string;
  glow?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex items-center", className)}>
      {glow && (
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 -z-10 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.45),transparent_65%)] blur-xl"
        />
      )}
      <Image
        src="/logo.png"
        alt="Founder Arena"
        width={220}
        height={220}
        priority
        className={cn("h-full w-auto object-contain", imgClassName)}
      />
    </span>
  );
}

/* Compact square-ish mark for tight spaces */
export function LogoMark({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/logo.png"
      alt="Founder Arena"
      width={size}
      height={size}
      priority
      className={cn("object-contain", className)}
    />
  );
}
