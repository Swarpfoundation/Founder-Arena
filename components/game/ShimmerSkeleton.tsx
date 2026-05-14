"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShimmerSkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

export function ShimmerSkeleton({ className, width, height, rounded = "rounded-lg" }: ShimmerSkeletonProps) {
  return (
    <motion.div
      className={cn("shimmer", rounded, className)}
      style={{ width, height }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
  );
}

export function ShimmerCard({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card rounded-xl p-4 space-y-3", className)}>
      <ShimmerSkeleton width="60%" height={16} />
      <ShimmerSkeleton width="100%" height={80} rounded="rounded-lg" />
      <div className="flex gap-2">
        <ShimmerSkeleton width="30%" height={24} rounded="rounded-full" />
        <ShimmerSkeleton width="30%" height={24} rounded="rounded-full" />
      </div>
    </div>
  );
}
