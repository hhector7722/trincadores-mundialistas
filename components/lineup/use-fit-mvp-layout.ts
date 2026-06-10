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

function measureLayout(
  el: HTMLElement,
  options: Omit<UseFitMvpLayoutOptions, "enabled">
): FitMvpHorizontalLayout | null {
  const rect = el.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;

  return computeFitMvpHorizontalLayout({
    widthPx: rect.width,
    heightPx: rect.height,
    awayBenchCount: options.awayBenchCount,
    homeBenchCount: options.homeBenchCount,
    footerPx: options.footerPx,
    formationRowPx: options.formationRowPx,
    headerPx: options.headerPx,
    gapPx: options.gapPx,
  });
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

    const measureOptions = {
      awayBenchCount,
      homeBenchCount,
      footerPx,
      formationRowPx,
      headerPx,
      gapPx,
    };

    const initial = measureLayout(node, measureOptions);
    if (initial) {
      setLayout((prev) => (layoutsEqual(prev, initial) ? prev : initial));
    }

    let rafId = 0;

    function measureFromResize() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;

        const next = measureLayout(el, measureOptions);
        if (!next) return;

        setLayout((prev) => (layoutsEqual(prev, next) ? prev : next));
      });
    }

    const observer = new ResizeObserver(measureFromResize);
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
