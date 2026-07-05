"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type FootballPitchSurfaceProps = {
  className?: string;
  onReady?: () => void;
  /** Ancho lógico del viewBox (define la relación de aspecto junto a vbHeight). */
  vbWidth?: number;
  /** Alto lógico del viewBox. */
  vbHeight?: number;
};

/**
 * Campo dibujado en un SVG con viewBox adaptable.
 * Las marcas se calculan proporcionalmente para que el viewBox
 * y el contenedor compartan la misma relación de aspecto,
 * eliminando letterboxing y asegurando que el sistema de coordenadas
 * del LayoutEngine (0-100) se alinee con el renderizado.
 */
export function FootballPitchSurface({
  className,
  onReady,
  vbWidth = 68,
  vbHeight = 105,
}: FootballPitchSurfaceProps) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <svg
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
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

      {/* Terreno de juego principal */}
      <rect x="0" y="0" width="68" height="105" fill="url(#pitch-grass)" />
      <rect x="0" y="0" width="68" height="52.5" fill="url(#pitch-stripe-a)" />
      <rect x="0" y="52.5" width="68" height="52.5" fill="url(#pitch-stripe-a)" opacity="0.55" />

      <g
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      >
        {/* Línea perimetral externa: x=0 es banda izquierda, x=68 es banda derecha, y=0/105 son fondos */}
        <rect x="0" y="0" width="68" height="105" rx="0.5" />
        
        {/* Línea central */}
        <line x1="0" y1="52.5" x2="68" y2="52.5" />
        
        {/* Círculo central (reducido) */}
        <circle cx="34" cy="52.5" r="5" />
        <circle cx="34" cy="52.5" r="0.6" fill="rgba(255,255,255,0.35)" />

        {/* Mitad Superior (Visitante) */}
        {/* Área Grande */}
        <rect x="22" y="0" width="24" height="10" />
        {/* Área Chica */}
        <rect x="28" y="0" width="12" height="4" />
        {/* Punto de penalty */}
        <circle cx="34" cy="11" r="0.6" fill="rgba(255,255,255,0.35)" />
        {/* Arco de área */}
        <path d="M 30 10 A 4 4 0 0 0 38 10" />

        {/* Mitad Inferior (Local) */}
        {/* Área Grande */}
        <rect x="22" y="95" width="24" height="10" />
        {/* Área Chica */}
        <rect x="28" y="101" width="12" height="4" />
        {/* Punto de penalty */}
        <circle cx="34" cy="94" r="0.6" fill="rgba(255,255,255,0.35)" />
        {/* Arco de área */}
        <path d="M 30 95 A 4 4 0 0 1 38 95" />
      </g>
    </svg>
  );
}
