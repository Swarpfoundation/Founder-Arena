"use client";

import { cn } from "@/lib/utils";

export function Sparkline({
  data,
  className,
  color = "#22d3ee",
  width = 120,
  height = 32,
}: {
  data: number[];
  className?: string;
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const path = `M ${points.join(" L ")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      width={width}
      height={height}
      preserveAspectRatio="none"
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={points[points.length - 1].split(",")[0]} cy={points[points.length - 1].split(",")[1]} r={2.5} fill={color} />
    </svg>
  );
}
