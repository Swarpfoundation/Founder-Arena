"use client";

import { cn } from "@/lib/utils";

export interface AssetProps {
  className?: string;
  size?: number;
  title?: string;
}

export function AssetBase({
  className,
  size = 24,
  title,
  children,
}: AssetProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

export function FilledAssetBase({
  className,
  size = 24,
  title,
  children,
}: AssetProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("shrink-0", className)}
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}
