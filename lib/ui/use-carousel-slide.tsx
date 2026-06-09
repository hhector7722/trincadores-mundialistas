"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { ModalPanelSlide } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

export type CarouselDotPosition = "start" | "middle" | "end";

export type CarouselSlideState<T> = {
  target: T;
  direction: "next" | "prev";
  phase: "prep" | "animate";
};

const SLIDE_MS = 300;

export function resolveCarouselDotPosition(index: number, total: number): CarouselDotPosition {
  if (total <= 1 || index <= 0) return "start";
  if (index >= total - 1) return "end";
  return "middle";
}

export function CarouselSwipeDots({ position }: { position: CarouselDotPosition }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((dot) => {
        const active =
          (position === "start" && dot === 0) ||
          (position === "middle" && dot === 1) ||
          (position === "end" && dot === 2);

        return (
          <span
            key={dot}
            className={cn(
              "rounded-full transition-all duration-200",
              active ? "h-2 w-2 bg-white" : "h-1.5 w-1.5 bg-white/35"
            )}
          />
        );
      })}
    </div>
  );
}

type UseCarouselSlideOptions<T> = {
  items: T[];
  open: boolean;
  initialItemKey: string;
  getItemKey: (item: T) => string;
  enabled: boolean;
  canSlide: boolean;
  onItemChange?: (item: T) => void;
};

export function useCarouselSlide<T>({
  items,
  open,
  initialItemKey,
  getItemKey,
  enabled,
  canSlide,
  onItemChange,
}: UseCarouselSlideOptions<T>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slide, setSlide] = useState<CarouselSlideState<T> | null>(null);
  const slideLockRef = useRef(false);
  const slideTimerRef = useRef<number | null>(null);
  const onItemChangeRef = useRef(onItemChange);
  const wasOpenRef = useRef(false);

  onItemChangeRef.current = onItemChange;

  const activeItem = items[activeIndex] ?? items[0];
  const canSwipe = enabled && items.length > 1;
  const dotPosition = resolveCarouselDotPosition(activeIndex, items.length);

  const clearSlideTimer = useCallback(() => {
    if (slideTimerRef.current !== null) {
      window.clearTimeout(slideTimerRef.current);
      slideTimerRef.current = null;
    }
  }, []);

  const finishSlide = useCallback(() => {
    clearSlideTimer();
    if (!slideLockRef.current) return;
    slideLockRef.current = false;

    setSlide((current) => {
      if (!current) return null;
      const nextIndex = items.findIndex((item) => getItemKey(item) === getItemKey(current.target));
      if (nextIndex >= 0) setActiveIndex(nextIndex);
      onItemChangeRef.current?.(current.target);
      return null;
    });
  }, [clearSlideTimer, getItemKey, items]);

  const finishSlideRef = useRef(finishSlide);
  finishSlideRef.current = finishSlide;

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      clearSlideTimer();
      slideLockRef.current = false;
      setSlide(null);
      return;
    }

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      const idx = items.findIndex((item) => getItemKey(item) === initialItemKey);
      setActiveIndex(idx >= 0 ? idx : 0);
      setSlide(null);
      slideLockRef.current = false;
    }
  }, [open, initialItemKey, items, clearSlideTimer, getItemKey]);

  useEffect(() => () => clearSlideTimer(), [clearSlideTimer]);

  const startSlide = useCallback(
    (offset: 1 | -1) => {
      if (!canSwipe || !canSlide || slideLockRef.current) return;

      const nextIndex = activeIndex + offset;
      if (nextIndex < 0 || nextIndex >= items.length) return;
      const target = items[nextIndex];
      if (!target) return;

      clearSlideTimer();
      slideLockRef.current = true;
      setSlide({ target, direction: offset === 1 ? "next" : "prev", phase: "prep" });

      slideTimerRef.current = window.setTimeout(() => {
        finishSlideRef.current();
      }, SLIDE_MS + 80);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSlide((current) => (current ? { ...current, phase: "animate" } : current));
        });
      });
    },
    [activeIndex, canSlide, canSwipe, clearSlideTimer, items]
  );

  const buildCarouselPanelSlide = useCallback(
    (renderItem: (item: T) => ReactNode): ModalPanelSlide | null => {
      if (!slide) return null;

      return {
        direction: slide.direction,
        phase: slide.phase,
        incoming: renderItem(slide.target),
        onTransitionEnd: () => finishSlideRef.current(),
      };
    },
    [slide]
  );

  return {
    activeIndex,
    activeItem,
    dotPosition,
    canSwipe,
    slide,
    startSlide,
    buildCarouselPanelSlide,
    isCarouselSliding: slide !== null,
  };
}
