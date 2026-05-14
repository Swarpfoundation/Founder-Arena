"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(
  target: number,
  duration = 1200,
  startOnMount = true,
  callback?: () => void
) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!startOnMount) return;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      setValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target);
        callback?.();
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, startOnMount, callback]);

  return value;
}

export function useCountUpString(
  target: number,
  duration = 1200,
  prefix = "",
  suffix = "",
  formatter?: (n: number) => string
) {
  const value = useCountUp(target, duration);
  const formatted = formatter ? formatter(value) : value.toLocaleString();
  return `${prefix}${formatted}${suffix}`;
}
