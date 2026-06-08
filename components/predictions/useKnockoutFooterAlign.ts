"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import type { FooterButtonAlignX } from "@/lib/predictions/knockout-bracket-geometry";

const FALLBACK_ALIGN: FooterButtonAlignX = { leftPct: 24, rightPct: 76 };

export function useKnockoutFooterAlign(
  canvasRef: RefObject<HTMLElement | null>,
  footerRef: RefObject<HTMLElement | null>
): FooterButtonAlignX {
  const [align, setAlign] = useState<FooterButtonAlignX>(FALLBACK_ALIGN);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const footer = footerRef.current;
    if (!canvas || !footer) return;

    const sync = () => {
      const button = footer.querySelector("button");
      if (!button) return;

      const canvasRect = canvas.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      if (canvasRect.width <= 0) return;

      setAlign({
        leftPct: ((buttonRect.left - canvasRect.left) / canvasRect.width) * 100,
        rightPct: ((buttonRect.right - canvasRect.left) / canvasRect.width) * 100,
      });
    };

    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(canvas);
    observer.observe(footer);

    const button = footer.querySelector("button");
    if (button) observer.observe(button);

    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
    };
  }, [canvasRef, footerRef]);

  return align;
}
