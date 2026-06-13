"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  applyPullResistance,
  findNearestScrollable,
  findPullScrollRoot,
  isPullRefreshBlocked,
  isScrollAtTop,
  pullProgress,
  PULL_THRESHOLD_PX,
} from "@/lib/layout/pull-to-refresh";

const IOS_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
const SNAP_BACK_MS = 380;

type PullPhase = "idle" | "pulling" | "refreshing" | "snapping";

function canStartFromTarget(target: EventTarget | null, root: HTMLElement): boolean {
  if (!(target instanceof Element)) return true;
  if (target.closest("[data-block-pull-refresh], input, textarea, select, button, a, [data-vaul-drawer]")) {
    return false;
  }

  const scrollable = findNearestScrollable(target, root);
  if (!scrollable) return false;
  return isScrollAtTop(scrollable);
}

export function PullToRefresh() {
  const pathname = usePathname();
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [phase, setPhase] = useState<PullPhase>("idle");
  const [isPending, startTransition] = useTransition();

  const rootRef = useRef<HTMLElement | null>(null);
  const phaseRef = useRef<PullPhase>("idle");
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const pullingRef = useRef(false);
  const lockedRef = useRef<"none" | "pull" | "scroll">("none");
  const distanceRef = useRef(0);
  const refreshRequestedRef = useRef(false);

  const setPhaseSafe = useCallback((next: PullPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const syncDistance = useCallback((next: number) => {
    distanceRef.current = next;
    setPullDistance(next);
  }, []);

  const applyRootTransform = useCallback((distance: number) => {
    const root = rootRef.current;
    if (!root) return;
    if (distance > 0) {
      root.style.transform = `translate3d(0, ${distance}px, 0)`;
      root.style.transition = "none";
    } else {
      root.style.transform = "";
      root.style.transition = "";
    }
  }, []);

  const snapBack = useCallback(() => {
    const root = rootRef.current;
    if (root) {
      root.style.transition = `transform ${SNAP_BACK_MS}ms ${IOS_EASING}`;
      root.style.transform = "translate3d(0, 0, 0)";
    }
    setPhaseSafe("snapping");
    syncDistance(0);
    window.setTimeout(() => {
      if (root) {
        root.style.transition = "";
        root.style.transform = "";
      }
      setPhaseSafe("idle");
      pullingRef.current = false;
      lockedRef.current = "none";
    }, SNAP_BACK_MS);
  }, [setPhaseSafe, syncDistance]);

  const triggerRefresh = useCallback(() => {
    refreshRequestedRef.current = true;
    setPhaseSafe("refreshing");
    syncDistance(PULL_THRESHOLD_PX * 0.85);
    applyRootTransform(PULL_THRESHOLD_PX * 0.85);

    startTransition(() => {
      router.refresh();
    });
  }, [applyRootTransform, router, setPhaseSafe, syncDistance]);

  useEffect(() => {
    if (!refreshRequestedRef.current || isPending) return;
    refreshRequestedRef.current = false;
    snapBack();
  }, [isPending, snapBack]);

  useEffect(() => {
    rootRef.current = findPullScrollRoot();
    syncDistance(0);
    setPhaseSafe("idle");
    pullingRef.current = false;
    lockedRef.current = "none";
  }, [pathname, setPhaseSafe, syncDistance]);

  useEffect(() => {
    const onTouchStart = (event: TouchEvent) => {
      if (isPullRefreshBlocked() || phaseRef.current === "refreshing") return;

      const root = findPullScrollRoot();
      rootRef.current = root;
      if (!root || !canStartFromTarget(event.target, root)) return;

      startYRef.current = event.touches[0]?.clientY ?? 0;
      startXRef.current = event.touches[0]?.clientX ?? 0;
      pullingRef.current = true;
      lockedRef.current = "none";
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!pullingRef.current || phaseRef.current === "refreshing" || isPullRefreshBlocked()) return;

      const root = rootRef.current;
      if (!root) return;

      const touch = event.touches[0];
      if (!touch) return;

      const deltaY = touch.clientY - startYRef.current;
      const deltaX = touch.clientX - startXRef.current;

      if (lockedRef.current === "none") {
        if (Math.hypot(deltaX, deltaY) < 6) return;
        if (Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
          pullingRef.current = false;
          lockedRef.current = "scroll";
          return;
        }
        if (deltaY <= 0) {
          pullingRef.current = false;
          lockedRef.current = "scroll";
          return;
        }
        if (!canStartFromTarget(event.target, root)) {
          pullingRef.current = false;
          lockedRef.current = "scroll";
          return;
        }
        lockedRef.current = "pull";
      }

      if (lockedRef.current !== "pull") return;

      const resisted = applyPullResistance(deltaY);
      if (resisted <= 0) return;

      if (event.cancelable) event.preventDefault();

      syncDistance(resisted);
      applyRootTransform(resisted);
      setPhaseSafe("pulling");
    };

    const onTouchEnd = () => {
      if (!pullingRef.current || lockedRef.current !== "pull") {
        pullingRef.current = false;
        lockedRef.current = "none";
        if (distanceRef.current > 0) snapBack();
        return;
      }

      pullingRef.current = false;
      lockedRef.current = "none";

      if (distanceRef.current >= PULL_THRESHOLD_PX) {
        triggerRefresh();
        return;
      }

      snapBack();
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [applyRootTransform, setPhaseSafe, snapBack, syncDistance, triggerRefresh]);

  const progress = pullProgress(pullDistance);
  const showIndicator = phase === "pulling" || phase === "refreshing" || pullDistance > 0;
  const indicatorOffset = Math.max(12, pullDistance * 0.55);

  return (
    <div
      className={cn(
        "tm-pull-refresh pointer-events-none fixed left-0 right-0 z-[88] flex justify-center",
        !showIndicator && "opacity-0"
      )}
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 3.25rem)",
        transform: `translateY(${indicatorOffset}px)`,
        opacity: showIndicator ? Math.min(1, 0.35 + progress * 0.65) : 0,
        transition:
          phase === "snapping" || (phase === "idle" && pullDistance === 0)
            ? `transform ${SNAP_BACK_MS}ms ${IOS_EASING}, opacity ${SNAP_BACK_MS}ms ${IOS_EASING}`
            : "none",
      }}
      aria-hidden={!showIndicator}
    >
      <div
        className={cn(
          "tm-pull-refresh__ring flex size-9 items-center justify-center rounded-full border border-[var(--tm-border)] bg-[var(--tm-glass)] shadow-[var(--tm-shadow)] backdrop-blur-md",
          phase === "refreshing" && "tm-pull-refresh__ring--active"
        )}
        style={{
          transform: `scale(${0.72 + progress * 0.28}) rotate(${progress * 220}deg)`,
          transition: phase === "pulling" ? "none" : `transform ${SNAP_BACK_MS}ms ${IOS_EASING}`,
        }}
      >
        <span
          className={cn(
            "tm-pull-refresh__spinner block size-5 rounded-full border-2 border-[var(--tm-accent)]/25 border-t-[var(--tm-accent)]",
            phase === "refreshing" && "tm-pull-refresh__spinner--spin"
          )}
        />
      </div>
    </div>
  );
}
