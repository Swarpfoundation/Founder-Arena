"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useScroll,
  animate,
  useMotionValue,
  useSpring,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { Apple, Play, ArrowUpRight } from "lucide-react";

/* ----------------------------------------------------------------
   Reveal — scroll-triggered entrance
----------------------------------------------------------------- */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* Stagger container + item */
export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
};

export function StaggerGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

/* ----------------------------------------------------------------
   CountUp — animated number
----------------------------------------------------------------- */
export function CountUp({
  to,
  from = 0,
  duration = 1.8,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  format = true,
}: {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  format?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [val, setVal] = useState(from);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(from, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to, from, duration]);

  const display = format
    ? val.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : val.toFixed(decimals);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* ----------------------------------------------------------------
   Magnetic — magnetic hover wrapper
----------------------------------------------------------------- */
export function Magnetic({
  children,
  className,
  strength = 18,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = e.clientX - (r.left + r.width / 2);
    const my = e.clientY - (r.top + r.height / 2);
    x.set((mx / r.width) * strength);
    y.set((my / r.height) * strength);
  }
  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
}

/* ----------------------------------------------------------------
   GlowButton + StoreButtons
----------------------------------------------------------------- */
type ButtonProps = React.ComponentProps<"a"> & {
  variant?: "cyan" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function GlowButton({
  children,
  className,
  variant = "cyan",
  size = "md",
  ...props
}: ButtonProps) {
  const sizes = {
    sm: "h-10 px-4 text-sm",
    md: "h-12 px-6 text-[0.95rem]",
    lg: "h-14 px-8 text-base",
  };
  const variants = {
    cyan: "btn-cyan",
    ghost: "btn-ghost-cyan",
  };
  return (
    <a
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight will-change-transform",
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}

export function StoreButtons({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const h = size === "lg" ? "h-[3.75rem]" : size === "sm" ? "h-11" : "h-[3.25rem]";
  return (
    <div className={cn("flex flex-col sm:flex-row items-stretch sm:items-center gap-3", className)}>
      <Magnetic strength={12} className="w-full sm:w-auto">
        <GlowButton
          size={size}
          href="#platforms"
          aria-label="Read about the planned Founder Arena iOS beta"
          className={cn("w-full sm:w-auto", h)}
        >
          <Apple className="h-[1.1em] w-[1.1em] shrink-0" strokeWidth={1.6} />
          <span className="flex flex-col items-start leading-none">
            <span className="text-[0.62em] opacity-75">In development for</span>
            <span className="text-[0.95em] font-semibold">iOS</span>
          </span>
        </GlowButton>
      </Magnetic>
      <Magnetic strength={12} className="w-full sm:w-auto">
        <GlowButton
          size={size}
          variant="ghost"
          href="#platforms"
          aria-label="Read about the planned Founder Arena Android beta"
          className={cn("w-full sm:w-auto", h)}
        >
          <Play className="h-[1em] w-[1em] shrink-0 fill-current" strokeWidth={0} />
          <span className="flex flex-col items-start leading-none">
            <span className="text-[0.62em] opacity-75">In development for</span>
            <span className="text-[0.95em] font-semibold">Android</span>
          </span>
        </GlowButton>
      </Magnetic>
    </div>
  );
}

/* ----------------------------------------------------------------
   SectionLabel — eyebrow
----------------------------------------------------------------- */
export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-cyan/20 bg-cyan/[0.04] px-3.5 py-1.5 text-[0.72rem] font-medium uppercase tracking-[0.22em] text-cyan-soft",
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan" />
      </span>
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------
   SectionHeading
----------------------------------------------------------------- */
export function SectionHeading({
  label,
  title,
  description,
  align = "center",
  className,
}: {
  label?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" ? "items-center text-center mx-auto max-w-3xl" : "items-start text-left",
        className
      )}
    >
      {label && (
        <Reveal>
          <SectionLabel>{label}</SectionLabel>
        </Reveal>
      )}
      <Reveal delay={0.06}>
        <h2 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold leading-[1.04] tracking-tight">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.12}>
          <p
            className={cn(
              "text-base sm:text-lg leading-relaxed text-muted-foreground",
              align === "center" ? "max-w-2xl" : "max-w-xl"
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------
   PhoneFrame — premium device mockup
----------------------------------------------------------------- */
export function PhoneFrame({
  children,
  className,
  glow = true,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      {glow && (
        <div
          aria-hidden
          className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(60%_50%_at_50%_30%,rgba(0,212,255,0.30),transparent_70%)] blur-2xl"
        />
      )}
      <div className="relative mx-auto w-[280px] sm:w-[300px]">
        <div className="relative rounded-[2.6rem] border border-white/10 bg-[#070b12] p-2.5 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04)_inset]">
          {/* side buttons */}
          <div className="absolute -left-[3px] top-24 h-12 w-[3px] rounded-l bg-white/10" />
          <div className="absolute -left-[3px] top-40 h-16 w-[3px] rounded-l bg-white/10" />
          <div className="absolute -right-[3px] top-32 h-20 w-[3px] rounded-r bg-white/10" />
          <div className="relative overflow-hidden rounded-[2.1rem] bg-[#05070b]">
            {/* dynamic island */}
            <div className="absolute left-1/2 top-2 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-black/90 ring-1 ring-white/5" />
            <div className="relative aspect-[9/19.3] w-full">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   GridGlow — ambient grid + radial glow background
----------------------------------------------------------------- */
export function GridGlow({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div className="absolute inset-0 grid-field grid-field-fade" />
      <div className="absolute inset-x-0 top-0 h-[60vh] radial-glow" />
    </div>
  );
}

/* ----------------------------------------------------------------
   ParticleField — lightweight canvas particle network
----------------------------------------------------------------- */
export function ParticleField({
  className,
  density = 0.00009,
  color = "0, 212, 255",
}: {
  className?: string;
  density?: number;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; vx: number; vy: number; r: number };
    let pts: P[] = [];

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(26, Math.min(80, Math.floor(w * h * density)));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.5,
      }));
    }

    function step() {
      ctx!.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${color},0.6)`;
        ctx!.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.hypot(dx, dy);
          if (d < 120) {
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(q.x, q.y);
            ctx!.strokeStyle = `rgba(${color},${0.12 * (1 - d / 120)})`;
            ctx!.lineWidth = 1;
            ctx!.stroke();
          }
        }
      }
      raf = requestAnimationFrame(step);
    }

    resize();
    if (!reduce) {
      raf = requestAnimationFrame(step);
    } else {
      step();
      cancelAnimationFrame(raf);
    }

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [density, color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}

/* ----------------------------------------------------------------
   TiltCard — 3D tilt on hover
----------------------------------------------------------------- */
export function TiltCard({
  children,
  className,
  max = 8,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 18 });
  const sry = useSpring(ry, { stiffness: 200, damping: 18 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * max);
    rx.set(-py * max);
  }
  function reset() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1000 }}
      className={cn("preserve-3d", className)}
    >
      {children}
    </motion.div>
  );
}

/* ----------------------------------------------------------------
   ArrowLink
----------------------------------------------------------------- */
export function ArrowLink({
  children,
  href = "#",
  className,
}: {
  children: React.ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "group inline-flex items-center gap-1.5 text-sm font-medium text-cyan-soft transition-colors hover:text-white",
        className
      )}
    >
      {children}
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}

/* ----------------------------------------------------------------
   ScrollProgress — top progress bar
----------------------------------------------------------------- */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-cyan-deep via-cyan to-cyan-soft"
    />
  );
}

/* ----------------------------------------------------------------
   scroll progress hooks
----------------------------------------------------------------- */
export function useScrollProgress(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = vh + r.height;
      const passed = vh - r.top;
      const p = passed / total;
      setProgress(Math.max(0, Math.min(1, p)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);
  return progress;
}
