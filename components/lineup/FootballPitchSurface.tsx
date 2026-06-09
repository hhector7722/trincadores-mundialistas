"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type FootballPitchSurfaceProps = {
  className?: string;
  onReady?: () => void;
};

/**
 * Campo vertical: porterías arriba/abajo, coincidente con el sistema de coords
 * (y bajo = portería propia, y alto = línea de ataque).
 */
export function FootballPitchSurface({ className, onReady }: FootballPitchSurfaceProps) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <svg
      viewBox="0 0 300 200"
      aria-hidden
      className={cn("h-full w-full", className)}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="pitch-grass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1f5a32" />
          <stop offset="50%" stopColor="#2a6b3c" />
          <stop offset="100%" stopColor="#1a4d2c" />
        </linearGradient>
        <linearGradient id="pitch-stripe-a" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      <rect x="8" y="8" width="284" height="184" rx="6" fill="url(#pitch-grass)" />
      <rect x="8" y="8" width="284" height="92" fill="url(#pitch-stripe-a)" />
      <rect x="8" y="100" width="284" height="92" fill="url(#pitch-stripe-a)" opacity="0.55" />

      <g
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <rect x="22" y="16" width="256" height="168" rx="2" />
        <line x1="22" y1="100" x2="278" y2="100" />
        <circle cx="150" cy="100" r="22" />
        <circle cx="150" cy="100" r="2" fill="rgba(255,255,255,0.55)" />

        <rect x="88" y="16" width="124" height="44" />
        <rect x="112" y="16" width="76" height="18" />
        <circle cx="150" cy="38" r="2" fill="rgba(255,255,255,0.55)" />
        <path d="M 134 60 A 14 14 0 0 0 166 60" />

        <rect x="88" y="140" width="124" height="44" />
        <rect x="112" y="166" width="76" height="18" />
        <circle cx="150" cy="162" r="2" fill="rgba(255,255,255,0.55)" />
        <path d="M 134 140 A 14 14 0 0 1 166 140" />
      </g>
    </svg>
  );
}
