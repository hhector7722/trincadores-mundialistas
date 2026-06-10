"use client";

import { useEffect, useState, type RefObject } from "react";
import {
  computeFitMvpHorizontalLayout,
  type FitMvpHorizontalLayout,
} from "@/lib/lineup/fit-mvp-horizontal-layout";

type UseFitMvpLayoutOptions = {
  awayBenchCount: number;
  homeBenchCount: number;
  footerPx: number;
  enabled?: boolean;
  formationRowPx?: number;
  /** @deprecated Usar formationRowPx */
  headerPx?: number;
  gapPx?: number;
};

export function useFitMvpLayout(
  containerRef: RefObject<HTMLElement | null>,
  options: UseFitMvpLayoutOptions
): FitMvpHorizontalLayout | null {
  const {
    awayBenchCount,
    homeBenchCount,
    footerPx,
    enabled = true,
    formationRowPx,
    headerPx,
    gapPx,
  } = options;
  const [layout, setLayout] = useState<FitMvpHorizontalLayout | null>(null);

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
        computeFitMvpHorizontalLayout({
          widthPx: rect.width,
          heightPx: rect.height,
          awayBenchCount,
          homeBenchCount,
          footerPx,
          formationRowPx,
          headerPx,
          gapPx,
        })
      );
    }

    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(node);

    return () => observer.disconnect();
  }, [
    containerRef,
    awayBenchCount,
    homeBenchCount,
    footerPx,
    enabled,
    formationRowPx,
    headerPx,
    gapPx,
  ]);

  return layout;
}
