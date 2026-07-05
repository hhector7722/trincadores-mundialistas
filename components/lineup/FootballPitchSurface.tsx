"use client";

import { cn } from "@/lib/utils";

type FootballPitchSurfaceProps = {
  className?: string;
  /** Ancho lógico del viewBox (define la relación de aspecto junto a vbHeight). */
  vbWidth?: number;
  /** Alto lógico del viewBox. */
  vbHeight?: number;
};

function pct(value: number, of: number) {
  return (value / 100) * of;
}

/**
 * Campo dibujado en un SVG con viewBox adaptable.
 * Las marcas se calculan proporcionalmente para que el viewBox
 * y el contenedor compartan la misma relación de aspecto,
 * eliminando letterboxing y asegurando que el sistema de coordenadas
 * del LayoutEngine (0-100) se alinee con el renderizado.
 */
export function FootballPitchSurface({
  className,
  vbWidth = 100,
  vbHeight = 100,
}: FootballPitchSurfaceProps) {
  const Vw = vbWidth;
  const Vh = vbHeight;

  const sx = (x: number) => pct(x, Vw);
  const sy = (y: number) => pct(y, Vh);
  const sw = (d: number) => pct(d, Vw);
  const pt = (x: number, y: number) => `${sx(x)} ${sy(y)}`;

  const strokeW = Math.max(0.5, sw(0.6));

  return (
    <svg
      viewBox={`0 0 ${Vw} ${Vh}`}
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

      <rect x="0" y="0" width={Vw} height={Vh} fill="url(#pitch-grass)" />
      <rect x="0" y="0" width={Vw} height={sy(50)} fill="url(#pitch-stripe-a)" />
      <rect x="0" y={sy(50)} width={Vw} height={sy(50)} fill="url(#pitch-stripe-a)" opacity="0.55" />

      <g
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={strokeW}
        strokeLinejoin="round"
      >
        <rect x={sx(2)} y={sy(2)} width={sw(96)} height={sy(96)} rx={sw(1)} />
        <line x1={sx(2)} y1={sy(50)} x2={sx(98)} y2={sy(50)} />

        <circle cx={sx(50)} cy={sy(50)} r={sw(7)} />
        <circle cx={sx(50)} cy={sy(50)} r={sw(0.4)} fill="rgba(255,255,255,0.4)" />

        <rect x={sx(25)} y={sy(2)} width={sw(50)} height={sy(16)} />
        <rect x={sx(30)} y={sy(2)} width={sw(40)} height={sy(8)} />
        <circle cx={sx(50)} cy={sy(13)} r={sw(0.4)} fill="rgba(255,255,255,0.4)" />
        <path d={`M ${pt(30, 18)} A ${sw(7)} ${sw(7)} 0 0 0 ${pt(70, 18)}`} />

        <rect x={sx(25)} y={sy(82)} width={sw(50)} height={sy(16)} />
        <rect x={sx(30)} y={sy(90)} width={sw(40)} height={sy(8)} />
        <circle cx={sx(50)} cy={sy(87)} r={sw(0.4)} fill="rgba(255,255,255,0.4)" />
        <path d={`M ${pt(30, 82)} A ${sw(7)} ${sw(7)} 0 0 1 ${pt(70, 82)}`} />
      </g>
    </svg>
  );
}
