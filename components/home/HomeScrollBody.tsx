"use client";

import { useEffect, useRef, type ReactNode } from "react";

type HomeScrollBodyProps = {
  children: ReactNode;
};

/** Scroll acotado del home: sin rubber-band por encima del tope. */
export function HomeScrollBody({ children }: HomeScrollBodyProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const clampTop = () => {
      if (el.scrollTop < 0) {
        el.scrollTop = 0;
      }
    };

    el.addEventListener("scroll", clampTop, { passive: true });
    return () => el.removeEventListener("scroll", clampTop);
  }, []);

  return (
    <div ref={ref} className="tm-home-layout__scroll min-h-0 flex-1">
      {children}
    </div>
  );
}
