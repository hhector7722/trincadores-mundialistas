"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const EASTER_EGG_SCENES = [
  { id: "1", x: 46, y: 16, w: 179, h: 223, hideRealTrophy: false },
  { id: "2", x: 286, y: 18, w: 270, h: 223, hideRealTrophy: false },
  { id: "3", x: 619, y: 27, w: 204, h: 214, hideRealTrophy: false },
  { id: "4", x: 894, y: 43, w: 251, h: 199, hideRealTrophy: false },
  { id: "5", x: 12, y: 273, w: 249, h: 220, hideRealTrophy: false },
  { id: "7", x: 596, y: 297, w: 247, h: 198, hideRealTrophy: false },
  { id: "8", x: 899, y: 317, w: 240, h: 180, hideRealTrophy: false },
  { id: "9", x: 17, y: 525, w: 234, h: 219, hideRealTrophy: false },
  { id: "10", x: 292, y: 554, w: 260, h: 190, hideRealTrophy: false },
  { id: "11", x: 604, y: 574, w: 239, h: 171, hideRealTrophy: false },
  { id: "12", x: 890, y: 542, w: 260, h: 203, hideRealTrophy: false },
];

export function EasterEggScene({ x, y, onToggleCup, forceShow, manualEggKey }: { x: number; y: number; onToggleCup?: (hidden: boolean) => void; forceShow?: boolean; manualEggKey?: number }) {
  const [activeScene, setActiveScene] = useState<typeof EASTER_EGG_SCENES[0] | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("tm-easter-egg-seen");
    let shouldShow = false;

    if (forceShow) {
      shouldShow = true;
    } else if (!hasSeen) {
      shouldShow = true;
      localStorage.setItem("tm-easter-egg-seen", "1");
    } else {
      shouldShow = Math.random() < 0.1;
    }

    if (shouldShow) {
      // Si se invoca manualmente con el botón EGG, mostramos los stickers en orden para facilitar su identificación.
      let scene;
      if (forceShow && manualEggKey) {
        scene = EASTER_EGG_SCENES[(manualEggKey - 1) % EASTER_EGG_SCENES.length];
      } else {
        scene = EASTER_EGG_SCENES[Math.floor(Math.random() * EASTER_EGG_SCENES.length)];
      }
      
      setActiveScene(scene);

      const delay = 400; // Espera inicial
      
      const startTimer = setTimeout(() => {
        if (onToggleCup) {
          onToggleCup(true); // Oculta la copa (tarda 200ms)
        }
        
        setIsStarted(true);
        setIsAnimating(true);
        
        // A los 2500ms comenzamos a mostrar la copa de nuevo (para que haga crossfade con la salida del sticker)
        setTimeout(() => {
          if (onToggleCup) {
            onToggleCup(false);
          }
        }, 2500);

        // A los 2700ms termina la animación y desmontamos
        setTimeout(() => {
          setIsAnimating(false);
          setActiveScene(null);
        }, 2700);
      }, delay);
      
      return () => {
        clearTimeout(startTimer);
      };
    }
  }, [manualEggKey]); // Añadimos manualEggKey para que cambie si pulsamos rápido

  if (!activeScene || !isStarted) return null;

  const imgWidthPercent = (1176 / activeScene.w) * 100;
  const imgHeightPercent = (750 / activeScene.h) * 100;
  const leftOffsetPercent = -(activeScene.x / activeScene.w) * 100;
  const topOffsetPercent = -(activeScene.y / activeScene.h) * 100;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes easterEggEntrance {
          0% {
            opacity: 0;
            transform: translate(-50%, -100%);
          }
          7.4% { /* 200ms (entrada coordinada con el fade-out de la copa) */
            opacity: 1;
            transform: translate(-50%, -100%);
          }
          92.6% { /* 2500ms (comienza a desvanecerse junto al fade-in de la copa) */
            opacity: 1;
            transform: translate(-50%, -100%);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -100%);
          }
        }
        .animate-easter-egg {
          animation: easterEggEntrance 2.7s linear forwards;
        }
      `}} />
      <div
        className={cn(
          "pointer-events-none absolute z-[20]",
          "animate-easter-egg"
        )}
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: '18%',
          aspectRatio: `${activeScene.w} / ${activeScene.h}`,
          overflow: 'hidden',
          transform: 'translate(-50%, -100%)' // Fallback
        }}
        aria-hidden
      >
        <img 
          src="/easter-eggs.png"
          style={{
            position: 'absolute',
            width: `${imgWidthPercent}%`,
            height: `${imgHeightPercent}%`,
            left: `${leftOffsetPercent}%`,
            top: `${topOffsetPercent}%`,
            maxWidth: 'none',
          }}
          alt=""
        />
      </div>
    </>
  );
}
