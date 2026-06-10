"use client";

import { useEffect, useState, type RefObject } from "react";
import {
  computeFitFieldModalLayout,
  type FitFieldModalLayout,
} from "@/lib/lineup/fit-field-modal-layout";

type UseFitFieldModalLayoutOptions = {
  awayBenchCount: number;
  homeBenchCount: number;
  footerPx: number;
  gapPx?: number;
  enabled?: boolean;
};

export function useFitFieldModalLayout(
  containerRef: RefObject<HTMLElement | null>,
  options: UseFitFieldModalLayoutOptions
): FitFieldModalLayout | null {
  const { awayBenchCount, homeBenchCount, footerPx, gapPx = 2, enabled = true } = options;
  const [layout, setLayout] = useState<FitFieldModalLayout | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLayout(null);
      return;
    }

    const node = containerRef.current;
    if (!node) return;

    function measure() {
      const rect = node!.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;

      setLayout(
        computeFitFieldModalLayout({
          widthPx: rect.width,
          heightPx: rect.height,
          awayBenchCount,
          homeBenchCount,
          footerPx,
          gapPx,
        })
      );
    }

    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(node);

    return () => observer.disconnect();
  }, [containerRef, awayBenchCount, homeBenchCount, footerPx, gapPx, enabled]);

  return layout;
}
