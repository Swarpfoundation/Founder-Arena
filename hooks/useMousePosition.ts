"use client";

import { useEffect, useState } from "react";

export function useMousePosition(ref?: React.RefObject<HTMLElement | null>) {
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const element = ref?.current || window;
    const isWindow = element === window;

    const handleMouseMove = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      if (isWindow) {
        setPosition({
          x: mouseEvent.clientX / window.innerWidth,
          y: mouseEvent.clientY / window.innerHeight,
        });
      } else {
        const rect = (element as HTMLElement).getBoundingClientRect();
        setPosition({
          x: (mouseEvent.clientX - rect.left) / rect.width,
          y: (mouseEvent.clientY - rect.top) / rect.height,
        });
      }
    };

    const target = isWindow ? window : (element as HTMLElement);
    target.addEventListener("mousemove", handleMouseMove);
    return () => target.removeEventListener("mousemove", handleMouseMove);
  }, [ref]);

  return position;
}
