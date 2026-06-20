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
import { isStackSubpage, resolvePageNavDirection, type PageNavDirection } from "@/lib/layout/page-navigation";
import { useAppNavigation } from "@/components/layout/NavigationLoadingProvider";
import { PAGE_PUSH_MS, iosTransition } from "@/lib/ui/motion";
import { cn } from "@/lib/utils";

type PageStackNavigatorProps = {
  children: ReactNode;
};

type PageTransition = {
  direction: "push" | "pop";
  outgoing: ReactNode;
  incoming: ReactNode;
};

const EDGE_ZONE_PX = 28;
const LOCK_THRESHOLD_PX = 6;
const COMMIT_RATIO = 0.34;
const VELOCITY_THRESHOLD = 0.38;

function isModalOpen() {
  return typeof document !== "undefined" && document.documentElement.hasAttribute("data-modal-open");
}

function canStartEdgeBack(target: EventTarget | null) {
  if (!(target instanceof Element)) return true;
  if (target.closest("[data-block-page-back]")) return false;
  if (target.closest("input, textarea, select, button, a, [role='slider'], [data-vaul-drawer]")) {
    return false;
  }
  return true;
}

function setPageBackDragging(active: boolean) {
  if (typeof document === "undefined") return;
  if (active) {
    document.documentElement.setAttribute("data-page-back-dragging", "");
  } else {
    document.documentElement.removeAttribute("data-page-back-dragging");
  }
}

export function PageStackNavigator({ children }: PageStackNavigatorProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { navPending } = useAppNavigation();
  const stackRef = useRef<string[]>([pathname]);
  const prevPathRef = useRef(pathname);
  const displayedRef = useRef(children);
  displayedRef.current = children;

  const [transition, setTransition] = useState<PageTransition | null>(null);

  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [animatingBack, setAnimatingBack] = useState(false);

  const layerRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const lockedAxisRef = useRef<"none" | "x" | "y">("none");
  const dragXRef = useRef(0);

  const edgeBackEnabled = isStackSubpage(pathname) && transition == null;

  useEffect(() => {
    const root = layerRef.current;
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

  useLayoutEffect(() => {
    if (pathname === prevPathRef.current) return;

    const { direction, nextStack } = resolvePageNavDirection(stackRef.current, pathname);
    stackRef.current = nextStack;

    if (direction === "push" || direction === "pop") {
      setTransition({
        direction,
        outgoing: displayedRef.current,
        incoming: children,
      });
      prevPathRef.current = pathname;

      const timer = window.setTimeout(() => {
        setTransition(null);
      }, PAGE_PUSH_MS + 48);

      return () => window.clearTimeout(timer);
    }

    prevPathRef.current = pathname;
    setTransition(null);
  }, [pathname, children]);

  useEffect(() => {
    if (transition) return;
    displayedRef.current = children;
  }, [children, transition]);

  useEffect(() => {
    setPageBackDragging(isDragging);
    return () => setPageBackDragging(false);
  }, [isDragging]);

  const resetDrag = useCallback(() => {
    dragXRef.current = 0;
    setDragX(0);
    setIsDragging(false);
    setAnimatingBack(false);
    lockedAxisRef.current = "none";
    pointerIdRef.current = null;
  }, []);

  const animateBackCommit = useCallback(() => {
    const width = widthRef.current;
    if (width <= 0) {
      router.back();
      resetDrag();
      return;
    }

    setAnimatingBack(true);
    dragXRef.current = width;
    setDragX(width);

    const layer = layerRef.current;
    if (!layer) {
      router.back();
      resetDrag();
      return;
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      layer.removeEventListener("transitionend", onEnd);
      window.clearTimeout(fallback);
      router.back();
      resetDrag();
    };

    const onEnd = (event: TransitionEvent) => {
      if (event.target !== layer || event.propertyName !== "transform") return;
      finish();
    };

    const fallback = window.setTimeout(finish, PAGE_PUSH_MS + 80);
    layer.addEventListener("transitionend", onEnd);
  }, [resetDrag, router]);

  const settleDrag = useCallback(() => {
    const width = widthRef.current;
    const offset = dragXRef.current;
    const elapsed = Math.max(performance.now() - startTimeRef.current, 1);
    const velocity = offset / elapsed;
    const ratio = offset / Math.max(width, 1);
    const committed = ratio >= COMMIT_RATIO || velocity > VELOCITY_THRESHOLD;

    if (committed) {
      animateBackCommit();
      return;
    }

    setAnimatingBack(true);
    dragXRef.current = 0;
    setDragX(0);

    const layer = layerRef.current;
    if (!layer) {
      resetDrag();
      return;
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      layer.removeEventListener("transitionend", onEnd);
      window.clearTimeout(fallback);
      resetDrag();
    };

    const onEnd = (event: TransitionEvent) => {
      if (event.target !== layer || event.propertyName !== "transform") return;
      finish();
    };

    const fallback = window.setTimeout(finish, PAGE_PUSH_MS + 80);
    layer.addEventListener("transitionend", onEnd);
  }, [animateBackCommit, resetDrag]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!edgeBackEnabled || animatingBack || isModalOpen()) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.clientX > EDGE_ZONE_PX) return;
    if (!canStartEdgeBack(event.target)) return;

    pointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;
    startTimeRef.current = performance.now();
    lockedAxisRef.current = "none";

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId || animatingBack) return;

    const deltaX = event.clientX - startXRef.current;
    const deltaY = event.clientY - startYRef.current;

    if (lockedAxisRef.current === "none") {
      if (Math.hypot(deltaX, deltaY) < LOCK_THRESHOLD_PX) return;
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
        lockedAxisRef.current = "y";
        event.currentTarget.releasePointerCapture(event.pointerId);
        pointerIdRef.current = null;
        return;
      }
      if (deltaX <= 0) {
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

    const next = Math.max(0, deltaX);
    dragXRef.current = next;
    setDragX(next);
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (lockedAxisRef.current === "x") {
      settleDrag();
    } else {
      resetDrag();
    }
  };

  const showEdgeShadow = isDragging || animatingBack;
  const slideTransition = isDragging ? "none" : iosTransition("transform", PAGE_PUSH_MS);

  if (transition) {
    return (
      <div className="tm-page-stack tm-page-stack--dual relative min-h-0 min-w-0 flex-1">
        <div
          className={cn(
            "tm-page-stack__layer tm-page-stack__layer--base",
            transition.direction === "push"
              ? "tm-page-stack__layer--push-out"
              : "tm-page-stack__layer--pop-out"
          )}
        >
          {transition.outgoing}
        </div>
        <div
          className={cn(
            "tm-page-stack__layer tm-page-stack__layer--overlay relative",
            transition.direction === "push"
              ? "tm-page-stack__layer--push-in"
              : "tm-page-stack__layer--pop-in"
          )}
        >
          {transition.incoming}
          {transition.direction === "push" && navPending ? (
            <div
              className="tm-page-stack__pending-spinner pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden
            >
              <div className="tm-spinner tm-spinner--sm" />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "tm-page-stack relative min-h-0 min-w-0 flex-1",
        isDragging && "tm-page-stack--dragging"
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      {showEdgeShadow ? (
        <div
          className="tm-page-stack__edge-shadow pointer-events-none absolute inset-y-0 left-0 z-0 w-8"
          aria-hidden
          style={{
            opacity: Math.min(0.42, dragX / Math.max(widthRef.current * 0.55, 1)),
          }}
        />
      ) : null}

      <div
        ref={layerRef}
        className="tm-page-stack__layer relative z-[1] flex min-h-0 w-full flex-1 flex-col will-change-transform"
        style={{
          transform: dragX > 0 ? `translate3d(${dragX}px, 0, 0)` : undefined,
          transition: dragX > 0 ? slideTransition : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
