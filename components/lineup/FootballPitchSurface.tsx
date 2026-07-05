"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type FootballPitchSurfaceProps = {
  className?: string;
  onReady?: () => void;
};

/**
 * Campo vertical recortado al terreno reglamentario (sin césped exterior).
 * viewBox = líneas de banda; el 100 % del contenedor coincide con el área táctica.
 * Coordenadas: y bajo = portería propia, y alto = línea de ataque.
 */
export function FootballPitchSurface({ className, onReady }: FootballPitchSurfaceProps) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <svg
      viewBox="6 6 56 93"
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

      <rect x="6" y="6" width="56" height="93" fill="url(#pitch-grass)" />
      <rect x="6" y="6" width="56" height="46.5" fill="url(#pitch-stripe-a)" />
      <rect x="6" y="52.5" width="56" height="46.5" fill="url(#pitch-stripe-a)" opacity="0.55" />

      <g
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      >
        <rect x="6" y="6" width="56" height="93" rx="1" />
        <line x1="6" y1="52.5" x2="62" y2="52.5" />
        <circle cx="34" cy="52.5" r="4.5" />
        <circle cx="34" cy="52.5" r="0.6" fill="rgba(255,255,255,0.4)" />

        <rect x="23" y="6" width="22" height="9" />
        <rect x="28" y="6" width="12" height="4" />
        <circle cx="34" cy="12" r="0.6" fill="rgba(255,255,255,0.4)" />
        <path d="M 30.5 15 A 4.5 4.5 0 0 0 37.5 15" />

        <rect x="23" y="90" width="22" height="9" />
        <rect x="28" y="95" width="12" height="4" />
        <circle cx="34" cy="93" r="0.6" fill="rgba(255,255,255,0.4)" />
        <path d="M 30.5 90 A 4.5 4.5 0 0 1 37.5 90" />
      </g>
    </svg>
  );
}
