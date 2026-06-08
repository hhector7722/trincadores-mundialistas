"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTabNavigation } from "@/components/layout/TabNavigationProvider";
import { useAppNavigation } from "@/components/layout/NavigationLoadingProvider";
import { getMainTabIndex, isMainTabRoot, MAIN_TABS } from "@/lib/layout/main-tabs";
import { cn } from "@/lib/utils";

const COMMIT_RATIO = 0.28;
const VELOCITY_THRESHOLD = 0.45;
const EDGE_RESISTANCE = 0.34;
const ANIMATION_MS = 340;
const IOS_EASING = "cubic-bezier(0.33, 1, 0.68, 1)";
const LOCK_THRESHOLD_PX = 8;

type TabSwipeNavigatorProps = {
  children: ReactNode;
};

function isModalOpen() {
  return typeof document !== "undefined" && document.documentElement.hasAttribute("data-modal-open");
}

function canStartSwipe(target: EventTarget | null) {
  if (!(target instanceof Element)) return true;
  if (target.closest("[data-block-tab-swipe]")) return false;
  if (target.closest("input, textarea, select, button, a, [role='slider'], [data-vaul-drawer]")) {
    return false;
  }
  return true;
}

function edgeResistance(offset: number, width: number) {
  const ratio = Math.min(1, Math.abs(offset) / width);
  return offset * (1 - ratio * (1 - EDGE_RESISTANCE));
}

function TabPeek({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--tm-shell-bg-hex)]/90">
      <p className="font-display text-sm uppercase tracking-wide text-white/35">{label}</p>
    </div>
  );
}

export function TabSwipeNavigator({ children }: TabSwipeNavigatorProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { navigateTab } = useAppNavigation();
  const { setSwipeProgress } = useTabNavigation();
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeIndex = getMainTabIndex(pathname);
  const enabled = isMainTabRoot(pathname) && activeIndex != null;

  const [dragX, setDragX] = useState(0);
  const [animating, setAnimating] = useState(false);

  const dragXRef = useRef(0);
  const widthRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const lockedAxisRef = useRef<"none" | "x" | "y">("none");
  const navigatingRef = useRef(false);

  const syncDrag = useCallback(
    (next: number) => {
      dragXRef.current = next;
      setDragX(next);
      if (activeIndex == null || widthRef.current <= 0) return;
      setSwipeProgress(activeIndex - next / widthRef.current);
    },
    [activeIndex, setSwipeProgress]
  );

  const resetSwipe = useCallback(() => {
    dragXRef.current = 0;
    setDragX(0);
    setAnimating(false);
    setSwipeProgress(null);
    lockedAxisRef.current = "none";
    pointerIdRef.current = null;
    navigatingRef.current = false;
  }, [setSwipeProgress]);

  useEffect(() => {
    resetSwipe();
  }, [pathname, resetSwipe]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const updateWidth = () => {
      widthRef.current = root.clientWidth || window.innerWidth;
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(root);
    window.addEventListener("resize", updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const animateTo = useCallback(
    (target: number, onDone?: () => void) => {
      const track = trackRef.current;
      const from = dragXRef.current;

      if (Math.abs(target - from) < 0.5) {
        syncDrag(target);
        onDone?.();
        return;
      }

      setAnimating(true);
      syncDrag(target);

      if (!track) {
        setAnimating(false);
        onDone?.();
        return;
      }

      const handleEnd = () => {
        track.removeEventListener("transitionend", handleEnd);
        setAnimating(false);
        onDone?.();
      };

      track.addEventListener("transitionend", handleEnd);
    },
    [syncDrag]
  );

  const commitToIndex = useCallback(
    (nextIndex: number) => {
      if (activeIndex == null || nextIndex === activeIndex) {
        animateTo(0, resetSwipe);
        return;
      }

      const width = widthRef.current;
      const direction = nextIndex > activeIndex ? -1 : 1;
      navigatingRef.current = true;

      animateTo(direction * width, () => {
        const href = MAIN_TABS[nextIndex]?.href;
        if (href) {
          navigateTab(href);
          router.prefetch(href);
        }
        dragXRef.current = 0;
        setDragX(0);
        setAnimating(false);
        setSwipeProgress(null);
        navigatingRef.current = false;
      });
    },
    [activeIndex, animateTo, navigateTab, resetSwipe, router, setSwipeProgress]
  );

  const settleDrag = useCallback(() => {
    if (activeIndex == null) {
      resetSwipe();
      return;
    }

    const width = widthRef.current;
    const offset = dragXRef.current;
    const elapsed = Math.max(performance.now() - startTimeRef.current, 1);
    const velocity = offset / elapsed;
    const ratio = Math.abs(offset) / Math.max(width, 1);

    let nextIndex = activeIndex;
    const wantsPrevious = offset > 0 && (ratio >= COMMIT_RATIO || velocity > VELOCITY_THRESHOLD);
    const wantsNext = offset < 0 && (ratio >= COMMIT_RATIO || velocity < -VELOCITY_THRESHOLD);

    if (wantsPrevious && activeIndex > 0) nextIndex = activeIndex - 1;
    if (wantsNext && activeIndex < MAIN_TABS.length - 1) nextIndex = activeIndex + 1;

    if (nextIndex !== activeIndex) {
      commitToIndex(nextIndex);
      return;
    }

    animateTo(0, () => {
      resetSwipe();
    });
  }, [activeIndex, animateTo, commitToIndex, resetSwipe]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled || animating || navigatingRef.current || isModalOpen()) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!canStartSwipe(event.target)) return;

    pointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;
    startTimeRef.current = performance.now();
    lockedAxisRef.current = "none";

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId || !enabled || animating || navigatingRef.current) {
      return;
    }

    const deltaX = event.clientX - startXRef.current;
    const deltaY = event.clientY - startYRef.current;

    if (lockedAxisRef.current === "none") {
      if (Math.hypot(deltaX, deltaY) < LOCK_THRESHOLD_PX) return;
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.15) {
        lockedAxisRef.current = "y";
        event.currentTarget.releasePointerCapture(event.pointerId);
        pointerIdRef.current = null;
        return;
      }
      lockedAxisRef.current = "x";
    }

    if (lockedAxisRef.current !== "x") return;

    let next = deltaX;
    const width = widthRef.current;

    if (activeIndex === 0 && next > 0) next = edgeResistance(next, width);
    if (activeIndex === MAIN_TABS.length - 1 && next < 0) next = edgeResistance(next, width);

    syncDrag(next);
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (lockedAxisRef.current === "x") {
      settleDrag();
    } else {
      resetSwipe();
    }
  };

  if (!enabled || activeIndex == null) {
    return <div className="tm-tab-swipe-root min-h-0 min-w-0 flex-1">{children}</div>;
  }

  const prevTab = activeIndex > 0 ? MAIN_TABS[activeIndex - 1] : null;
  const nextTab = activeIndex < MAIN_TABS.length - 1 ? MAIN_TABS[activeIndex + 1] : null;

  return (
    <div
      ref={rootRef}
      className="tm-tab-swipe-root relative min-h-0 min-w-0 flex-1 touch-pan-y overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      {prevTab ? (
        <div
          className="pointer-events-none absolute inset-0 z-0 will-change-transform"
          style={{
            transform: `translate3d(calc(-100% + ${dragX}px), 0, 0)`,
            transition: animating ? `transform ${ANIMATION_MS}ms ${IOS_EASING}` : "none",
          }}
          aria-hidden
        >
          <TabPeek label={prevTab.label} />
        </div>
      ) : null}

      {nextTab ? (
        <div
          className="pointer-events-none absolute inset-0 z-0 will-change-transform"
          style={{
            transform: `translate3d(calc(100% + ${dragX}px), 0, 0)`,
            transition: animating ? `transform ${ANIMATION_MS}ms ${IOS_EASING}` : "none",
          }}
          aria-hidden
        >
          <TabPeek label={nextTab.label} />
        </div>
      ) : null}

      <div
        ref={trackRef}
        className={cn(
          "relative z-[1] min-h-full w-full bg-transparent will-change-transform",
          !animating && dragX === 0 && "transform-gpu"
        )}
        style={{
          transform: `translate3d(${dragX}px, 0, 0)`,
          transition: animating ? `transform ${ANIMATION_MS}ms ${IOS_EASING}` : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
