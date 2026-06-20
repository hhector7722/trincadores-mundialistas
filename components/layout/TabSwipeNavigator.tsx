"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { TabAdjacentPanel, TabTransitionIncoming } from "@/components/layout/TabAdjacentPanel";
import { useTabNavigation } from "@/components/layout/TabNavigationProvider";
import { useAppNavigation } from "@/components/layout/NavigationLoadingProvider";
import {
  getMainTabIndex,
  isExactMainTabRoot,
  isMainTabActive,
  MAIN_TABS,
} from "@/lib/layout/main-tabs";
import { trackUsageTabSwitch } from "@/lib/usage/client";
import { saveTabSnapshot } from "@/lib/layout/tab-snapshot-cache";
import { useTabPreviewMode } from "@/lib/layout/tab-preview";
import {
  getMainTabBarNeighbors,
  getTabSwipeProgress,
  pointerOffsetToSwipeDirection,
  resolveTabSwipeCommit,
  shouldApplyEdgeResistance,
  TAB_SWIPE_ANIMATION_MS,
  TAB_SWIPE_EASING,
} from "@/lib/layout/tab-swipe";
import { cn } from "@/lib/utils";

const COMMIT_RATIO = 0.14;
const VELOCITY_THRESHOLD = 0.28;
const EDGE_RESISTANCE = 0.58;
const LOCK_THRESHOLD_PX = 5;
const EDGE_ZONE_PX = 44;
const AXIS_Y_RATIO_CENTER = 1.65;
const AXIS_Y_RATIO_EDGE = 1.05;

type TabSwipeNavigatorProps = {
  children: ReactNode;
};

function setSwipeNavigating(active: boolean) {
  if (typeof document === "undefined") return;
  if (active) {
    document.documentElement.setAttribute("data-tab-swipe-navigating", "");
  } else {
    document.documentElement.removeAttribute("data-tab-swipe-navigating");
  }
}

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

function applyEdgeResistance(activeIndex: number, offset: number, width: number) {
  const direction = pointerOffsetToSwipeDirection(offset);
  if (!direction || !shouldApplyEdgeResistance(activeIndex, direction)) {
    return offset;
  }
  return edgeResistance(offset, width);
}

export function TabSwipeNavigator({ children }: TabSwipeNavigatorProps) {
  const pathname = usePathname();
  const router = useRouter();
  const previewMode = useTabPreviewMode();
  const { navigateTab, tabPending } = useAppNavigation();
  const { setSwipeProgress, registerTabNavigator, setShellPathnameOverride } = useTabNavigation();
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const childrenRef = useRef(children);
  childrenRef.current = children;

  const activeIndex = getMainTabIndex(pathname);
  const enabled = !previewMode && isExactMainTabRoot(pathname) && activeIndex != null;

  const [dragX, setDragX] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const [commitActive, setCommitActive] = useState(false);
  const [frozenOutgoing, setFrozenOutgoing] = useState<ReactNode | null>(null);
  const [transitionHref, setTransitionHref] = useState<string | null>(null);

  const dragXRef = useRef(0);
  const widthRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const edgeStartRef = useRef(false);
  const lockedAxisRef = useRef<"none" | "x" | "y">("none");
  const navigatingRef = useRef(false);
  const animatingRef = useRef(false);
  const commitIncomingSideRef = useRef<"left" | "right">("right");
  const commitFromIndexRef = useRef<number | null>(null);

  const syncDrag = useCallback(
    (next: number) => {
      dragXRef.current = next;
      setDragX(next);
      if (activeIndex == null || widthRef.current <= 0) return;
      setSwipeProgress(getTabSwipeProgress(activeIndex, next, widthRef.current));
    },
    [activeIndex, setSwipeProgress]
  );

  const resetSwipe = useCallback(() => {
    dragXRef.current = 0;
    setDragX(0);
    setAnimating(false);
    animatingRef.current = false;
    setIsDragging(false);
    setSwipeProgress(null);
    lockedAxisRef.current = "none";
    pointerIdRef.current = null;
    edgeStartRef.current = false;
    navigatingRef.current = false;
    setSwipeNavigating(false);
  }, [setSwipeProgress]);

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

  useEffect(() => {
    if (!enabled) return;

    const root = rootRef.current;
    if (!root) return;

    const blockNativeHorizontal = (event: TouchEvent) => {
      if (lockedAxisRef.current !== "x") return;
      if (event.cancelable) event.preventDefault();
    };

    root.addEventListener("touchmove", blockNativeHorizontal, { passive: false });

    return () => {
      root.removeEventListener("touchmove", blockNativeHorizontal);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const markTabShell = () => {
      window.history.replaceState(
        { ...(window.history.state ?? {}), tmTabShell: true },
        "",
        window.location.href
      );
    };

    markTabShell();

    const onPopState = () => {
      if (!isExactMainTabRoot(window.location.pathname)) return;
      markTabShell();
      window.history.pushState(
        { ...(window.history.state ?? {}), tmTabShell: true },
        "",
        window.location.href
      );
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [enabled, pathname]);

  useEffect(() => {
    const html = document.documentElement;
    if (isDragging) {
      html.setAttribute("data-tab-swipe-dragging", "");
    } else {
      html.removeAttribute("data-tab-swipe-dragging");
    }
    return () => html.removeAttribute("data-tab-swipe-dragging");
  }, [isDragging]);

  useEffect(() => {
    if (!enabled || activeIndex == null) return;
    const { left, right } = getMainTabBarNeighbors(activeIndex);
    if (left != null) router.prefetch(MAIN_TABS[left]!.href);
    if (right != null) router.prefetch(MAIN_TABS[right]!.href);
  }, [activeIndex, enabled, router]);

  useEffect(() => {
    if (!enabled || isDragging || navigatingRef.current || animatingRef.current || commitActive) {
      return;
    }
    const track = trackRef.current;
    if (!track || activeIndex == null) return;
    const href = MAIN_TABS[activeIndex]?.href;
    if (!href) return;

    const frame = window.requestAnimationFrame(() => {
      saveTabSnapshot(href, track);
      setSnapshotVersion((value) => value + 1);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex, commitActive, enabled, isDragging, pathname]);

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
      animatingRef.current = true;
      syncDrag(target);

      if (!track) {
        setAnimating(false);
        animatingRef.current = false;
        onDone?.();
        return;
      }

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        track.removeEventListener("transitionend", handleEnd);
        window.clearTimeout(fallbackTimer);
        setAnimating(false);
        animatingRef.current = false;
        onDone?.();
      };

      const handleEnd = (event: TransitionEvent) => {
        if (event.target !== track || event.propertyName !== "transform") return;
        finish();
      };

      const fallbackTimer = window.setTimeout(finish, TAB_SWIPE_ANIMATION_MS + 80);

      track.addEventListener("transitionend", handleEnd);
    },
    [syncDrag]
  );

  const finishCommit = useCallback(() => {
    commitFromIndexRef.current = null;
    setFrozenOutgoing(null);
    setTransitionHref(null);
    setShellPathnameOverride(null);
    setCommitActive(false);
    resetSwipe();
  }, [resetSwipe, setShellPathnameOverride]);

  const commitToIndex = useCallback(
    (nextIndex: number) => {
      if (navigatingRef.current || animatingRef.current) return;

      if (activeIndex == null || nextIndex === activeIndex) {
        animateTo(0, resetSwipe);
        return;
      }

      const width = widthRef.current;
      const href = MAIN_TABS[nextIndex]?.href;
      if (!href) return;

      const tab = MAIN_TABS[nextIndex];
      if (tab && activeIndex != null) {
        trackUsageTabSwitch(MAIN_TABS[activeIndex]?.href ?? pathname, href, tab.label);
      }

      router.prefetch(href);

      const direction = nextIndex > activeIndex ? -1 : 1;
      commitIncomingSideRef.current = direction === -1 ? "right" : "left";
      commitFromIndexRef.current = activeIndex;

      setFrozenOutgoing(childrenRef.current);
      setTransitionHref(href);
      setShellPathnameOverride(href);
      setCommitActive(true);
      navigatingRef.current = true;
      setSwipeNavigating(true);

      navigateTab(href);

      if (width <= 0) {
        navigatingRef.current = false;
        return;
      }

      animateTo(direction * width, () => {
        navigatingRef.current = false;
      });
    },
    [activeIndex, animateTo, navigateTab, pathname, resetSwipe, router, setShellPathnameOverride]
  );

  useEffect(() => {
    if (!enabled) {
      registerTabNavigator(null);
      return;
    }

    registerTabNavigator({ commitToTab: commitToIndex });
    return () => registerTabNavigator(null);
  }, [commitToIndex, enabled, registerTabNavigator]);

  useLayoutEffect(() => {
    if (!commitActive || !transitionHref) return;
    if (!isMainTabActive(pathname, transitionHref)) return;
    if (tabPending || animating || navigatingRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      finishCommit();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [animating, commitActive, finishCommit, pathname, tabPending, transitionHref]);

  useEffect(() => {
    if (commitActive || navigatingRef.current || isDragging || animatingRef.current) return;
    resetSwipe();
  }, [commitActive, isDragging, pathname, resetSwipe]);

  useEffect(() => {
    return () => {
      setShellPathnameOverride(null);
    };
  }, [setShellPathnameOverride]);

  const settleDrag = useCallback(() => {
    if (activeIndex == null) {
      resetSwipe();
      return;
    }

    const width = widthRef.current;
    const offset = dragXRef.current;
    const elapsed = Math.max(performance.now() - startTimeRef.current, 1);
    const velocity = offset / elapsed;

    const targetIndex = resolveTabSwipeCommit(activeIndex, offset, velocity, width, {
      commitRatio: COMMIT_RATIO,
      velocityThreshold: VELOCITY_THRESHOLD,
    });

    if (targetIndex != null && targetIndex !== activeIndex) {
      commitToIndex(targetIndex);
      return;
    }

    animateTo(0, () => {
      resetSwipe();
    });
  }, [activeIndex, animateTo, commitToIndex, resetSwipe]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled || animating || navigatingRef.current || commitActive || isModalOpen()) return;
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
    if (
      pointerIdRef.current !== event.pointerId ||
      !enabled ||
      animating ||
      navigatingRef.current ||
      commitActive
    ) {
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

    if (event.cancelable) event.preventDefault();

    const next =
      activeIndex == null ? deltaX : applyEdgeResistance(activeIndex, deltaX, widthRef.current);
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

  const inCommitTransition = commitActive && frozenOutgoing != null && transitionHref != null;
  const incomingReady =
    transitionHref != null && isMainTabActive(pathname, transitionHref) && !tabPending;

  const neighborIndex =
    commitActive && commitFromIndexRef.current != null
      ? commitFromIndexRef.current
      : activeIndex;
  const { left: leftIndex, right: rightIndex } = getMainTabBarNeighbors(neighborIndex);
  const prevTab = leftIndex != null ? MAIN_TABS[leftIndex] : null;
  const nextTab = rightIndex != null ? MAIN_TABS[rightIndex] : null;

  const showAdjacentPanels = (isDragging || animating) && !inCommitTransition;
  const slideTransition = animating
    ? `transform ${TAB_SWIPE_ANIMATION_MS}ms ${TAB_SWIPE_EASING}`
    : "none";

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
      {inCommitTransition ? (
        <TabTransitionIncoming
          href={transitionHref}
          dragX={dragX}
          side={commitIncomingSideRef.current}
          animating={animating}
          liveContent={children}
          liveReady={incomingReady}
        />
      ) : null}

      {showAdjacentPanels && prevTab ? (
        <TabAdjacentPanel
          key={`${prevTab.href}-${snapshotVersion}`}
          href={prevTab.href}
          dragX={dragX}
          animating={animating}
          side="left"
        />
      ) : null}

      {showAdjacentPanels && nextTab ? (
        <TabAdjacentPanel
          key={`${nextTab.href}-${snapshotVersion}`}
          href={nextTab.href}
          dragX={dragX}
          animating={animating}
          side="right"
        />
      ) : null}

      <div
        ref={trackRef}
        className={cn(
          "tm-tab-swipe-track relative z-[1] flex h-full min-h-0 w-full flex-col bg-transparent will-change-transform",
          !animating && dragX === 0 && "transform-gpu"
        )}
        style={{
          transform: `translate3d(${dragX}px, 0, 0)`,
          transition: slideTransition,
        }}
      >
        {inCommitTransition ? frozenOutgoing : children}
      </div>
    </div>
  );
}
