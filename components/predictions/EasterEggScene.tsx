"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const EASTER_EGG_SCENES = [
  { id: "1", x: 46, y: 16, w: 179, h: 223, hideRealTrophy: false },
  { id: "2", x: 286, y: 18, w: 270, h: 223, hideRealTrophy: false },
  { id: "3", x: 619, y: 27, w: 204, h: 214, hideRealTrophy: false },
  { id: "4", x: 894, y: 43, w: 251, h: 199, hideRealTrophy: false },
  { id: "5", x: 12, y: 273, w: 249, h: 220, hideRealTrophy: false },
  { id: "6", x: 288, y: 304, w: 261, h: 191, hideRealTrophy: false },
  { id: "7", x: 596, y: 297, w: 247, h: 198, hideRealTrophy: false },
  { id: "8", x: 899, y: 317, w: 240, h: 180, hideRealTrophy: false },
  { id: "9", x: 17, y: 525, w: 234, h: 219, hideRealTrophy: false },
  { id: "10", x: 292, y: 554, w: 260, h: 190, hideRealTrophy: false },
  { id: "11", x: 604, y: 574, w: 239, h: 171, hideRealTrophy: false },
  { id: "12", x: 890, y: 542, w: 260, h: 203, hideRealTrophy: false },
];

export function EasterEggScene({ x, y, onToggleCup }: { x: number; y: number; onToggleCup?: (hidden: boolean) => void }) {
  const [activeScene, setActiveScene] = useState<typeof EASTER_EGG_SCENES[0] | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("tm-easter-egg-seen");
    let shouldShow = false;

    if (!hasSeen) {
      shouldShow = true;
      setIsFirstVisit(true);
      localStorage.setItem("tm-easter-egg-seen", "1");
    } else {
      // 10% chance
      shouldShow = Math.random() < 0.1;
    }

    if (shouldShow) {
      const scene = EASTER_EGG_SCENES[Math.floor(Math.random() * EASTER_EGG_SCENES.length)];
      setActiveScene(scene);

      // Momento de aparición: Esperar entre 300ms y 500ms
      const delay = 300 + Math.random() * 200;
      
      const startTimer = setTimeout(() => {
        if (scene.hideRealTrophy && onToggleCup) {
          onToggleCup(true);
          // Start easter egg animation after cup fades out
          setTimeout(() => {
            setIsStarted(true);
            setIsAnimating(true);
            
            setTimeout(() => {
              setIsAnimating(false);
              setActiveScene(null);
              onToggleCup(false);
            }, 1500);
          }, 200);
        } else {
          setIsStarted(true);
          setIsAnimating(true);
          
          setTimeout(() => {
            setIsAnimating(false);
            setActiveScene(null);
          }, 1500);
        }
      }, delay);
      
      return () => {
        clearTimeout(startTimer);
        // We don't restore cup immediately here to avoid glitches on unmount, but normally unmount means the whole bracket goes away anyway.
      };
    }
  }, []);

  // Bloqueo de interacción de pantalla durante la primera visita
  useEffect(() => {
    if (isFirstVisit && isAnimating) {
      document.body.style.pointerEvents = 'none';
      return () => {
        document.body.style.pointerEvents = '';
      };
    }
  }, [isFirstVisit, isAnimating]);

  if (!activeScene || !isStarted) return null;

  const scale = 0.6; 
  const width = activeScene.w * scale;
  const height = activeScene.h * scale;
  const bgX = -activeScene.x * scale;
  const bgY = -activeScene.y * scale;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes easterEggEntrance {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          20% {
            opacity: 1;
            transform: translateY(2px);
          }
          30% {
            opacity: 1;
            transform: translateY(0);
          }
          70% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(0);
          }
        }
        .animate-easter-egg {
          animation: easterEggEntrance 1.5s ease-in-out forwards;
        }
      `}} />
      <div
        className={cn(
          "pointer-events-none absolute z-[5]",
          "animate-easter-egg"
        )}
        style={{
          left: `calc(${x}% - ${width / 2}px)`,
          top: `calc(${y}% + 52px)`,
          width,
          height,
          backgroundImage: 'url(/easter-eggs.png)',
          backgroundPosition: `${bgX}px ${bgY}px`,
          backgroundSize: `${1176 * scale}px ${750 * scale}px`,
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden
      />
    </>
  );
}
