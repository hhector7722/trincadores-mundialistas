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
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      >
        <rect x="6" y="6" width="56" height="93" rx="1" />
        <line x1="6" y1="52.5" x2="62" y2="52.5" />
        <circle cx="34" cy="52.5" r="8" />
        <circle cx="34" cy="52.5" r="0.8" fill="rgba(255,255,255,0.55)" />

        <rect x="18" y="6" width="32" height="14" />
        <rect x="24" y="6" width="20" height="6" />
        <circle cx="34" cy="14" r="0.8" fill="rgba(255,255,255,0.55)" />
        <path d="M 30 20 A 4 4 0 0 0 38 20" />

        <rect x="18" y="85" width="32" height="14" />
        <rect x="24" y="93" width="20" height="6" />
        <circle cx="34" cy="91" r="0.8" fill="rgba(255,255,255,0.55)" />
        <path d="M 30 85 A 4 4 0 0 1 38 85" />
      </g>
    </svg>
  );
}
