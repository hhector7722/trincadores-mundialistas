"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
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

function layoutsEqual(
  prev: FitMvpHorizontalLayout | null,
  next: FitMvpHorizontalLayout
): boolean {
  if (!prev) return false;
  return (
    Math.round(prev.fieldWidthPx) === Math.round(next.fieldWidthPx) &&
    Math.round(prev.fieldHeightPx) === Math.round(next.fieldHeightPx) &&
    prev.awayBench.heightPx === next.awayBench.heightPx &&
    prev.homeBench.heightPx === next.homeBench.heightPx &&
    prev.awayBench.columns === next.awayBench.columns &&
    prev.homeBench.columns === next.homeBench.columns
  );
}

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

  useLayoutEffect(() => {
    if (!enabled) {
      setLayout(null);
      return;
    }

    const node = containerRef.current;
    if (!node) return;

    let rafId = 0;

    function measure() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;

        const next = computeFitMvpHorizontalLayout({
          widthPx: rect.width,
          heightPx: rect.height,
          awayBenchCount,
          homeBenchCount,
          footerPx,
          formationRowPx,
          headerPx,
          gapPx,
        });

        setLayout((prev) => (layoutsEqual(prev, next) ? prev : next));
      });
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
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
