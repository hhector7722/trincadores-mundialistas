"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type HorizontalPitchSurfaceProps = {
  className?: string;
  onReady?: () => void;
};

/**
 * Campo horizontal: porterías izquierda/derecha, línea central vertical.
 * Coordenadas: x = profundidad (0 izquierda, 100 derecha), y = lateral.
 */
export function HorizontalPitchSurface({ className, onReady }: HorizontalPitchSurfaceProps) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <svg
      viewBox="6 6 93 56"
      aria-hidden
      className={cn("h-full w-full", className)}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="hpitch-grass" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1a4d2c" />
          <stop offset="50%" stopColor="#2a6b3c" />
          <stop offset="100%" stopColor="#1f5a32" />
        </linearGradient>
        <linearGradient id="hpitch-stripe-a" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      <rect x="6" y="6" width="93" height="56" fill="url(#hpitch-grass)" />
      <rect x="6" y="6" width="46.5" height="56" fill="url(#hpitch-stripe-a)" />
      <rect x="52.5" y="6" width="46.5" height="56" fill="url(#hpitch-stripe-a)" opacity="0.55" />

      <g
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      >
        <rect x="6" y="6" width="93" height="56" rx="1" />
        <line x1="52.5" y1="6" x2="52.5" y2="62" />
        <circle cx="52.5" cy="34" r="8" />
        <circle cx="52.5" cy="34" r="0.8" fill="rgba(255,255,255,0.55)" />

        <rect x="6" y="18" width="14" height="32" />
        <rect x="6" y="24" width="6" height="20" />
        <circle cx="14" cy="34" r="0.8" fill="rgba(255,255,255,0.55)" />
        <path d="M 20 30 A 4 4 0 0 1 20 38" />

        <rect x="85" y="18" width="14" height="32" />
        <rect x="93" y="24" width="6" height="20" />
        <circle cx="91" cy="34" r="0.8" fill="rgba(255,255,255,0.55)" />
        <path d="M 85 30 A 4 4 0 0 0 85 38" />
      </g>
    </svg>
  );
}
