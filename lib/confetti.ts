"use client";

import confetti from "canvas-confetti";

export function triggerTermSheetAccepted() {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#22d3ee", "#34d399", "#ffffff"],
  });
}

export function triggerAchievementUnlocked() {
  confetti({
    particleCount: 100,
    spread: 60,
    origin: { y: 0.7 },
    colors: ["#fbbf24", "#f59e0b", "#ffffff"],
    shapes: ["circle"],
  });
}

export function triggerBreakout() {
  const duration = 3000;
  const end = Date.now() + duration;
  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#22d3ee", "#34d399"],
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#8b5cf6", "#22d3ee"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

export function triggerGrowthAccepted() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.5 },
    colors: ["#fbbf24", "#22d3ee", "#34d399", "#ffffff"],
  });
}

export function triggerDeath() {
  confetti({
    particleCount: 60,
    spread: 100,
    origin: { y: 0.5 },
    colors: ["#f43f5e", "#7f1d1d", "#000000"],
    gravity: 0.8,
    drift: 0,
  });
}
