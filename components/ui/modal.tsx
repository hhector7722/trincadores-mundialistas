"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  hideHeaderDivider?: boolean;
  backdropClassName?: string;
  belowPanel?: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

function lockPageScroll() {
  const html = document.documentElement;
  const main = document.querySelector("main");

  html.setAttribute("data-modal-open", "");

  const state = {
    htmlOverflow: html.style.overflow,
    bodyOverflow: document.body.style.overflow,
    mainOverflow: main instanceof HTMLElement ? main.style.overflow : "",
  };

  html.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  if (main instanceof HTMLElement) {
    main.style.overflow = "hidden";
  }

  return () => {
    html.removeAttribute("data-modal-open");
    html.style.overflow = state.htmlOverflow;
    document.body.style.overflow = state.bodyOverflow;
    if (main instanceof HTMLElement) {
      main.style.overflow = state.mainOverflow;
    }
  };
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  hideHeaderDivider = false,
  backdropClassName,
  belowPanel,
  onSwipeLeft,
  onSwipeRight,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;

    const unlockScroll = lockPageScroll();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => {
      unlockScroll();
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchStartY.current = event.touches[0]?.clientY ?? null;
  }

  function onTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    if (deltaX < 0) {
      onSwipeLeft?.();
    } else {
      onSwipeRight?.();
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className={cn(
          "absolute inset-0 touch-none overscroll-none bg-[#2a1058]/45 backdrop-blur-md",
          backdropClassName
        )}
        onClick={onClose}
        onTouchMove={(event) => event.preventDefault()}
      />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-3">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className={cn(
            "flex w-full max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-glass)] shadow-[var(--tm-shadow-soft)] outline-none backdrop-blur-xl",
            className
          )}
        >
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-3 px-4 py-3",
            !hideHeaderDivider && "border-b border-[var(--tm-border)]"
          )}
        >
          <h2 id={titleId} className="font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--tm-muted)] transition-colors hover:bg-[var(--tm-surface-elevated)] hover:text-[var(--tm-fg)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {children}
        </div>
        </div>
        {belowPanel}
      </div>
    </div>,
    document.body
  );
}
