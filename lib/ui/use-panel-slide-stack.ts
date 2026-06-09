"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { ModalPanelSlide } from "@/components/ui/modal";

type SlidePhase = "prep" | "animate";

type SlideState<T> = {
  target: T;
  direction: "next" | "prev";
  phase: SlidePhase;
};

const SLIDE_MS = 300;

export function usePanelSlideStack<T>(initialView: T) {
  const [stack, setStack] = useState<T[]>([initialView]);
  const [slide, setSlide] = useState<SlideState<T> | null>(null);
  const slideLockRef = useRef(false);
  const slideFinishTimerRef = useRef<number | null>(null);

  const current = stack[stack.length - 1] ?? initialView;
  const canGoBack = stack.length > 1;

  const clearSlideFinishTimer = useCallback(() => {
    if (slideFinishTimerRef.current !== null) {
      window.clearTimeout(slideFinishTimerRef.current);
      slideFinishTimerRef.current = null;
    }
  }, []);

  const finishSlide = useCallback(() => {
    clearSlideFinishTimer();
    if (!slideLockRef.current) return;

    slideLockRef.current = false;

    setSlide((currentSlide) => {
      if (!currentSlide) return null;

      setStack((prev) => {
        if (currentSlide.direction === "next") {
          return [...prev, currentSlide.target];
        }
        return prev.slice(0, -1);
      });

      return null;
    });
  }, [clearSlideFinishTimer]);

  const finishSlideRef = useRef(finishSlide);
  finishSlideRef.current = finishSlide;

  useEffect(() => {
    return () => clearSlideFinishTimer();
  }, [clearSlideFinishTimer]);

  const startSlide = useCallback(
    (target: T, direction: "next" | "prev") => {
      if (slideLockRef.current) return;

      clearSlideFinishTimer();
      slideLockRef.current = true;

      setSlide({ target, direction, phase: "prep" });

      slideFinishTimerRef.current = window.setTimeout(() => {
        finishSlideRef.current();
      }, SLIDE_MS + 80);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSlide((currentSlide) =>
            currentSlide ? { ...currentSlide, phase: "animate" } : currentSlide
          );
        });
      });
    },
    [clearSlideFinishTimer]
  );

  const push = useCallback(
    (view: T) => {
      startSlide(view, "next");
    },
    [startSlide]
  );

  const pop = useCallback(() => {
    if (stack.length <= 1 || slideLockRef.current) return;
    const previous = stack[stack.length - 2];
    if (!previous) return;
    startSlide(previous, "prev");
  }, [stack, startSlide]);

  const reset = useCallback(
    (view: T) => {
      clearSlideFinishTimer();
      slideLockRef.current = false;
      setSlide(null);
      setStack([view]);
    },
    [clearSlideFinishTimer]
  );

  const replaceCurrent = useCallback(
    (view: T) => {
      clearSlideFinishTimer();
      slideLockRef.current = false;
      setSlide(null);
      setStack((prev) => {
        if (prev.length === 0) return [view];
        return [...prev.slice(0, -1), view];
      });
    },
    [clearSlideFinishTimer]
  );

  const buildPanelSlide = useCallback(
    (renderView: (view: T) => ReactNode): ModalPanelSlide | null => {
      if (!slide) return null;

      return {
        direction: slide.direction,
        phase: slide.phase,
        incoming: renderView(slide.target),
        onTransitionEnd: () => finishSlideRef.current(),
      };
    },
    [slide]
  );

  return {
    current,
    stack,
    canGoBack,
    push,
    pop,
    reset,
    replaceCurrent,
    isSliding: slide !== null,
    buildPanelSlide,
  };
}
