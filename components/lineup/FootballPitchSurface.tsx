"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type FootballPitchSurfaceProps = {
  className?: string;
  onReady?: () => void;
};

/** Campo de fútbol en perspectiva (SVG), sustituye el asset erróneo de cancha de baloncesto. */
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
        <linearGradient id="pitch-stripe-a" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      <rect x="8" y="8" width="284" height="184" rx="6" fill="url(#pitch-grass)" />
      <rect x="8" y="8" width="142" height="184" fill="url(#pitch-stripe-a)" />
      <rect x="150" y="8" width="142" height="184" fill="url(#pitch-stripe-a)" opacity="0.5" />

      <g
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <rect x="18" y="18" width="264" height="164" rx="2" />
        <line x1="150" y1="18" x2="150" y2="182" />
        <circle cx="150" cy="100" r="24" />
        <circle cx="150" cy="100" r="2" fill="rgba(255,255,255,0.55)" />

        <rect x="18" y="62" width="48" height="76" />
        <rect x="18" y="78" width="20" height="44" />
        <circle cx="54" cy="100" r="2" fill="rgba(255,255,255,0.55)" />
        <path d="M 66 86 A 12 12 0 0 1 66 114" />

        <rect x="234" y="62" width="48" height="76" />
        <rect x="262" y="78" width="20" height="44" />
        <circle cx="246" cy="100" r="2" fill="rgba(255,255,255,0.55)" />
        <path d="M 234 86 A 12 12 0 0 0 234 114" />

        <path d="M 18 8 Q 150 28 282 8" opacity="0.35" />
        <path d="M 18 192 Q 150 172 282 192" opacity="0.35" />
      </g>
    </svg>
  );
}
