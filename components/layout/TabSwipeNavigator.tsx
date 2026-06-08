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

/** Distancia mínima para confirmar cambio de pestaña (ratio del ancho). */
const COMMIT_RATIO = 0.16;
/** Flick horizontal suficiente para cambiar sin recorrer mucho. */
const VELOCITY_THRESHOLD = 0.22;
/** Resistencia en el primer/último tab (0–1, más alto = más suave). */
const EDGE_RESISTANCE = 0.58;
const ANIMATION_MS = 420;
const IOS_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
const LOCK_THRESHOLD_PX = 5;
/** Zona lateral donde el swipe horizontal tiene prioridad (px). */
const EDGE_ZONE_PX = 44;
/** Desde el centro hace falta un gesto más horizontal para robar el scroll vertical. */
const AXIS_Y_RATIO_CENTER = 1.65;
const AXIS_Y_RATIO_EDGE = 1.05;

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

function isNearHorizontalEdge(clientX: number, width: number) {
  return clientX <= EDGE_ZONE_PX || clientX >= width - EDGE_ZONE_PX;
}

function edgeResistance(offset: number, width: number) {
  const ratio = Math.min(1, Math.abs(offset) / width);
  return offset * (1 - ratio * (1 - EDGE_RESISTANCE));
}

function TabPeek({ label, side }: { label: string; side: "left" | "right" }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center bg-[var(--tm-shell-bg-hex)]/95",
        side === "left" ? "justify-start pl-6" : "justify-end pr-6"
      )}
    >
      <p className="font-display text-xs uppercase tracking-[0.2em] text-white/50">{label}</p>
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
  const [isDragging, setIsDragging] = useState(false);

  const dragXRef = useRef(0);
  const widthRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const edgeStartRef = useRef(false);
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
    setIsDragging(false);
    setSwipeProgress(null);
    lockedAxisRef.current = "none";
    pointerIdRef.current = null;
    edgeStartRef.current = false;
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
        setIsDragging(false);
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
    // Deslizar a la izquierda → pestaña anterior (izquierda en la barra). Derecha → siguiente.
    const wantsPrevious =
      offset < 0 && (ratio >= COMMIT_RATIO || velocity < -VELOCITY_THRESHOLD);
    const wantsNext =
      offset > 0 && (ratio >= COMMIT_RATIO || velocity > VELOCITY_THRESHOLD);

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

    const root = rootRef.current;
    const width = root?.clientWidth ?? widthRef.current;
    edgeStartRef.current = isNearHorizontalEdge(event.clientX, width);

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

      const axisYRatio = edgeStartRef.current ? AXIS_Y_RATIO_EDGE : AXIS_Y_RATIO_CENTER;
      if (Math.abs(deltaY) > Math.abs(deltaX) * axisYRatio) {
        lockedAxisRef.current = "y";
        event.currentTarget.releasePointerCapture(event.pointerId);
        pointerIdRef.current = null;
        return;
      }
      lockedAxisRef.current = "x";
      setIsDragging(true);
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
  const showEdgeHints = !isDragging && !animating && dragX === 0;

  return (
    <div
      ref={rootRef}
      className={cn(
        "tm-tab-swipe-root relative min-h-0 min-w-0 flex-1 touch-pan-y overflow-hidden",
        isDragging && "tm-tab-swipe-root--dragging"
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      {showEdgeHints && prevTab ? (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-3 bg-gradient-to-r from-[var(--tm-accent)]/10 to-transparent"
          aria-hidden
        />
      ) : null}
      {showEdgeHints && nextTab ? (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-3 bg-gradient-to-l from-[var(--tm-accent)]/10 to-transparent"
          aria-hidden
        />
      ) : null}

      {prevTab ? (
        <div
          className="pointer-events-none absolute inset-0 z-0 will-change-transform"
          style={{
            transform: `translate3d(calc(-100% - ${dragX}px), 0, 0)`,
            transition: animating ? `transform ${ANIMATION_MS}ms ${IOS_EASING}` : "none",
          }}
          aria-hidden
        >
          <TabPeek label={prevTab.label} side="left" />
        </div>
      ) : null}

      {nextTab ? (
        <div
          className="pointer-events-none absolute inset-0 z-0 will-change-transform"
          style={{
            transform: `translate3d(calc(100% - ${dragX}px), 0, 0)`,
            transition: animating ? `transform ${ANIMATION_MS}ms ${IOS_EASING}` : "none",
          }}
          aria-hidden
        >
          <TabPeek label={nextTab.label} side="right" />
        </div>
      ) : null}

      <div
        ref={trackRef}
        className={cn(
          "relative z-[1] flex h-full min-h-0 w-full flex-col bg-transparent will-change-transform",
          isDragging && "tm-tab-swipe-track--dragging",
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
