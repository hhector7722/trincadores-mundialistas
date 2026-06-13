"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { PredictorPanel } from "@/components/laboratorio/PredictorPanel";
import { cn } from "@/lib/utils";

const FAB_HEIGHT_PX = 56;
const FAB_DEFAULT_GAP_PX = 12;
const FAB_MIN_TOP_PX = 16;
const LONG_PRESS_MS = 420;
const DRAG_THRESHOLD_PX = 6;
const POSITION_STORAGE_KEY = "tm-predictor-fab-bottom";

type PredictorFabProps = {
  enabled: boolean;
};

function readTabBarBottomGap(): number {
  if (typeof document === "undefined") {
    return 72 + FAB_DEFAULT_GAP_PX;
  }

  const root = document.documentElement;
  const tabBarRaw = getComputedStyle(root).getPropertyValue("--tab-bar-height");
  const tabBar = Number.parseFloat(tabBarRaw);
  const safeRaw = getComputedStyle(root).getPropertyValue("--tm-safe-bottom");
  const safe = Number.parseFloat(safeRaw);

  const tabBarPx = Number.isFinite(tabBar) && tabBar > 0 ? tabBar : 72;
  const safePx = Number.isFinite(safe) && safe > 0 ? safe : 0;

  return tabBarPx + FAB_DEFAULT_GAP_PX + safePx;
}

function clampFabBottom(bottomPx: number): number {
  const minBottom = readTabBarBottomGap();
  const maxBottom = Math.max(minBottom, window.innerHeight - FAB_HEIGHT_PX - FAB_MIN_TOP_PX);
  return Math.min(Math.max(bottomPx, minBottom), maxBottom);
}

function readStoredFabBottom(): number | null {
  try {
    const raw = sessionStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? clampFabBottom(parsed) : null;
  } catch {
    return null;
  }
}

function storeFabBottom(bottomPx: number): void {
  try {
    sessionStorage.setItem(POSITION_STORAGE_KEY, String(bottomPx));
  } catch {
    // ignore quota / private mode
  }
}

export function PredictorFab({ enabled }: PredictorFabProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [fabBottomPx, setFabBottomPx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const longPressTimerRef = useRef<number | null>(null);
  const dragActiveRef = useRef(false);
  const suppressClickRef = useRef(false);
  const pointerStartYRef = useRef(0);
  const startBottomRef = useRef(0);
  const movedDuringHoldRef = useRef(false);
  const activePointerRef = useRef<{ id: number; target: HTMLButtonElement } | null>(null);

  useLayoutEffect(() => {
    setMounted(true);
    const stored = readStoredFabBottom();
    if (stored !== null) {
      setFabBottomPx(stored);
    }
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    function handleResize() {
      setFabBottomPx((current) => (current === null ? null : clampFabBottom(current)));
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  useEffect(() => () => clearLongPressTimer(), [clearLongPressTimer]);

  function resolveBottomPx(): number {
    return fabBottomPx ?? readTabBarBottomGap();
  }

  function beginDrag(clientY: number) {
    dragActiveRef.current = true;
    movedDuringHoldRef.current = false;
    setIsDragging(true);
    pointerStartYRef.current = clientY;
    startBottomRef.current = resolveBottomPx();

    const activePointer = activePointerRef.current;
    if (activePointer) {
      activePointer.target.setPointerCapture(activePointer.id);
    }
  }

  function updateDrag(clientY: number) {
    if (!dragActiveRef.current) {
      return;
    }

    const deltaY = pointerStartYRef.current - clientY;
    if (Math.abs(deltaY) >= DRAG_THRESHOLD_PX) {
      movedDuringHoldRef.current = true;
    }

    const nextBottom = clampFabBottom(startBottomRef.current + deltaY);
    setFabBottomPx(nextBottom);
  }

  function endDrag() {
    clearLongPressTimer();

    const activePointer = activePointerRef.current;
    if (activePointer?.target.hasPointerCapture(activePointer.id)) {
      activePointer.target.releasePointerCapture(activePointer.id);
    }
    activePointerRef.current = null;

    if (!dragActiveRef.current) {
      return;
    }

    dragActiveRef.current = false;
    setIsDragging(false);

    if (movedDuringHoldRef.current) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    setFabBottomPx((current) => {
      if (current === null) {
        return null;
      }

      const clamped = clampFabBottom(current);
      storeFabBottom(clamped);
      return clamped;
    });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (open) {
      return;
    }

    clearLongPressTimer();
    movedDuringHoldRef.current = false;
    pointerStartYRef.current = event.clientY;
    startBottomRef.current = resolveBottomPx();
    activePointerRef.current = { id: event.pointerId, target: event.currentTarget };

    longPressTimerRef.current = window.setTimeout(() => {
      beginDrag(pointerStartYRef.current);
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragActiveRef.current) {
      const deltaFromStart = Math.abs(event.clientY - pointerStartYRef.current);
      if (deltaFromStart >= DRAG_THRESHOLD_PX && longPressTimerRef.current !== null) {
        clearLongPressTimer();
      }
      return;
    }

    event.preventDefault();
    updateDrag(event.clientY);
  }

  function handlePointerUp() {
    clearLongPressTimer();
    endDrag();
  }

  function handlePointerCancel() {
    clearLongPressTimer();
    endDrag();
  }

  function handleClick() {
    if (suppressClickRef.current || dragActiveRef.current || isDragging) {
      return;
    }

    setOpen((current) => !current);
  }

  if (!enabled || !mounted) {
    return null;
  }

  const bottomStyle = { bottom: `${resolveBottomPx()}px` };

  return createPortal(
    <>
      <button
        type="button"
        aria-label={open ? "Cerrar asistente de predicciones" : "Abrir asistente de predicciones"}
        aria-expanded={open}
        aria-controls="predictor-assistant-panel"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={bottomStyle}
        className={cn(
          "tm-predictor-fab fixed right-0 z-50 shrink-0",
          "flex h-14 min-h-12 w-[3.5rem] items-center justify-center",
          "rounded-l-full rounded-r-none",
          "bg-[#2a1058]",
          "border-y border-l border-[var(--tm-accent)]/45",
          "select-none",
          !isDragging && "hover:w-[3.75rem] hover:-translate-x-1",
          !isDragging && "active:scale-[0.97] active:translate-x-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tm-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2a1058]",
          open && "tm-predictor-fab--open",
          isDragging && "tm-predictor-fab--dragging"
        )}
      >
        <span
          className="pointer-events-none block w-full pr-[0.2em] text-center font-display text-[13px] font-bold tracking-[0.2em] text-[var(--tm-accent)]"
          aria-hidden
        >
          AI
        </span>
      </button>

      <div id="predictor-assistant-panel">
        <PredictorPanel open={open} onClose={() => setOpen(false)} />
      </div>
    </>,
    document.body
  );
}
