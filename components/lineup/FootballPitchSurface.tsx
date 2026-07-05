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
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="0.4"
        strokeLinejoin="round"
      >
        {/* Línea perimetral externa: x=0 es banda izquierda, x=68 es banda derecha, y=0/105 son fondos */}
        <rect x="0" y="0" width="68" height="105" rx="0.5" />
        
        {/* Línea central */}
        <line x1="0" y1="52.5" x2="68" y2="52.5" />
        
        {/* Círculo central (proporcional y protagonista) */}
        <circle cx="34" cy="52.5" r="9.15" />
        <circle cx="34" cy="52.5" r="0.6" fill="rgba(255,255,255,0.22)" />

        {/* Mitad Superior (Visitante) */}
        {/* Área Grande */}
        <rect x="13.85" y="0" width="40.3" height="16.5" />
        {/* Área Chica */}
        <rect x="24.85" y="0" width="18.3" height="5.5" />
        {/* Punto de penalty */}
        <circle cx="34" cy="11" r="0.6" fill="rgba(255,255,255,0.22)" />
        {/* Arco de área */}
        <path d="M 26.7 16.5 A 9.15 9.15 0 0 0 41.3 16.5" />

        {/* Mitad Inferior (Local) */}
        {/* Área Grande */}
        <rect x="13.85" y="88.5" width="40.3" height="16.5" />
        {/* Área Chica */}
        <rect x="24.85" y="99.5" width="18.3" height="5.5" />
        {/* Punto de penalty */}
        <circle cx="34" cy="94" r="0.6" fill="rgba(255,255,255,0.22)" />
        {/* Arco de área */}
        <path d="M 26.7 88.5 A 9.15 9.15 0 0 1 41.3 88.5" />
      </g>
    </svg>
  );
}
