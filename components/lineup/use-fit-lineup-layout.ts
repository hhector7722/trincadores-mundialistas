"use client";

import { useEffect, useState, type RefObject } from "react";
import {
  computeFitLineupLayout,
  type FitLineupLayout,
} from "@/lib/lineup/fit-lineup-layout";

type UseFitLineupLayoutOptions = {
  benchCount: number;
  metaPx: number;
  enabled?: boolean;
  gapPx?: number;
};

export function useFitLineupLayout(
  containerRef: RefObject<HTMLElement | null>,
  options: UseFitLineupLayoutOptions
): FitLineupLayout | null {
  const { benchCount, metaPx, enabled = true, gapPx } = options;
  const [layout, setLayout] = useState<FitLineupLayout | null>(null);

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
        computeFitLineupLayout({
          widthPx: rect.width,
          heightPx: rect.height,
          benchCount,
          metaPx,
          gapPx,
        })
      );
    }

    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(node);

    return () => observer.disconnect();
  }, [containerRef, benchCount, metaPx, enabled, gapPx]);

  return layout;
}
