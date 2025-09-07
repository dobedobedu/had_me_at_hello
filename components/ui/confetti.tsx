'use client';

import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface ConfettiProps {
  duration?: number;
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  oncePerSession?: boolean;
  storageKey?: string;
}

export function Confetti({ 
  duration = 3000,
  particleCount = 100,
  spread = 70,
  origin = { x: 0.5, y: 0.5 },
  oncePerSession = true,
  storageKey = 'confettiShown'
}: ConfettiProps) {
  useEffect(() => {
    if (oncePerSession && typeof window !== 'undefined') {
      try {
        const shown = sessionStorage.getItem(storageKey);
        if (shown === '1') return;
        sessionStorage.setItem(storageKey, '1');
      } catch {}
    }

    // Single burst instead of continuous
    confetti({
      particleCount,
      spread,
      origin,
      colors: ['#003825', '#004b34', '#d4a017', '#FFD700', '#FFA500'],
      ticks: 200,
      gravity: 1.2,
      decay: 0.94,
      startVelocity: 30,
    });
  }, [duration, particleCount, spread, origin, oncePerSession, storageKey]);

  return null;
}

export function triggerConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#003825', '#004b34', '#d4a017', '#FFD700', '#FFA500'],
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

export function triggerMiniConfetti(x: number = 0.5, y: number = 0.5) {
  confetti({
    particleCount: 20,
    spread: 40,
    origin: { x, y },
    colors: ['#d4a017', '#FFD700'],
    ticks: 100,
    gravity: 1.5,
    decay: 0.92,
    startVelocity: 20,
    scalar: 0.8,
  });
}
