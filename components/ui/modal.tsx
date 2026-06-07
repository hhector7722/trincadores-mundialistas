"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, X } from "lucide-react";
import { LoadingOverlay } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type ModalPanelSlide = {
  direction: "next" | "prev";
  phase: "prep" | "animate";
  incoming: ReactNode;
  onTransitionEnd: () => void;
};

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  wrapperClassName?: string;
  hideHeaderDivider?: boolean;
  backdropClassName?: string;
  belowPanel?: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onBack?: () => void;
  panelSlide?: ModalPanelSlide | null;
  loading?: boolean;
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

const panelShellClass =
  "flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-glass)] shadow-[var(--tm-shadow-soft)] outline-none backdrop-blur-xl";

function ModalPanelShell({
  title,
  titleId,
  onClose,
  onBack,
  hideHeaderDivider,
  className,
  children,
  loading = false,
}: {
  title: string;
  titleId: string;
  onClose: () => void;
  onBack?: () => void;
  hideHeaderDivider?: boolean;
  className?: string;
  children: ReactNode;
  loading?: boolean;
}) {
  return (
    <div className={cn(panelShellClass, "max-h-[calc(100dvh-2rem)]", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 px-4 py-3",
          !hideHeaderDivider && "border-b border-[var(--tm-border)]"
        )}
      >
        {onBack ? (
          <button
            type="button"
            aria-label="Volver"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--tm-muted)] transition-colors hover:bg-[var(--tm-surface-elevated)] hover:text-[var(--tm-fg)]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          <span className="w-10 shrink-0" aria-hidden="true" />
        )}
        <h2
          id={titleId}
          className="min-w-0 flex-1 truncate font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]"
        >
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
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        {children}
        {loading ? <LoadingOverlay /> : null}
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  wrapperClassName,
  hideHeaderDivider = false,
  backdropClassName,
  belowPanel,
  onSwipeLeft,
  onSwipeRight,
  onBack,
  panelSlide = null,
  loading = false,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swipeHandledRef = useRef(false);
  const hasSwipe = Boolean(onSwipeLeft || onSwipeRight);

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
    if (panelSlide || !hasSwipe) return;
    swipeHandledRef.current = false;
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchStartY.current = event.touches[0]?.clientY ?? null;
  }

  function onTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (panelSlide || !hasSwipe) return;
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    event.preventDefault();
    swipeHandledRef.current = true;

    if (deltaX < 0) {
      onSwipeLeft?.();
    } else {
      onSwipeRight?.();
    }
  }

  function onBackdropClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (swipeHandledRef.current) {
      swipeHandledRef.current = false;
      event.preventDefault();
      return;
    }
    onClose();
  }

  const slideActive = panelSlide !== null;
  const slideNext = panelSlide?.direction === "next";
  const slideAnimate = panelSlide?.phase === "animate";

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        slideActive && "touch-none"
      )}
      onTouchStart={hasSwipe ? onTouchStart : undefined}
      onTouchEnd={hasSwipe ? onTouchEnd : undefined}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className={cn(
          "absolute inset-0 overscroll-none bg-[#2a1058]/45 backdrop-blur-md",
          hasSwipe ? "touch-manipulation" : "touch-none",
          backdropClassName
        )}
        onClick={onBackdropClick}
        onTouchMove={hasSwipe ? undefined : (event) => event.preventDefault()}
      />
      <div
        className={cn(
          "relative z-10 flex w-full max-w-sm flex-col items-center gap-3 pointer-events-none",
          wrapperClassName
        )}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="pointer-events-auto w-full overflow-hidden outline-none focus:outline-none focus-visible:outline-none"
        >
          {slideActive && panelSlide ? (
            <div
              className={cn(
                "flex w-[200%]",
                slideAnimate && "transition-transform duration-300 ease-in-out",
                slideNext
                  ? slideAnimate
                    ? "-translate-x-1/2"
                    : "translate-x-0"
                  : slideAnimate
                    ? "translate-x-0"
                    : "-translate-x-1/2"
              )}
              onTransitionEnd={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.propertyName !== "transform") return;
                if (!slideAnimate) return;
                panelSlide.onTransitionEnd();
              }}
            >
              {slideNext ? (
                <>
                  <div className="w-1/2 shrink-0 pr-0">
                    <ModalPanelShell
                      title={title}
                      titleId={titleId}
                      onClose={onClose}
                      onBack={onBack}
                      hideHeaderDivider={hideHeaderDivider}
                      className={className}
                      loading={loading}
                    >
                      {children}
                    </ModalPanelShell>
                  </div>
                  <div className="w-1/2 shrink-0 pl-0">
                    <ModalPanelShell
                      title={title}
                      titleId={titleId}
                      onClose={onClose}
                      onBack={onBack}
                      hideHeaderDivider={hideHeaderDivider}
                      className={className}
                      loading={loading}
                    >
                      {panelSlide.incoming}
                    </ModalPanelShell>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-1/2 shrink-0">
                    <ModalPanelShell
                      title={title}
                      titleId={titleId}
                      onClose={onClose}
                      onBack={onBack}
                      hideHeaderDivider={hideHeaderDivider}
                      className={className}
                      loading={loading}
                    >
                      {panelSlide.incoming}
                    </ModalPanelShell>
                  </div>
                  <div className="w-1/2 shrink-0">
                    <ModalPanelShell
                      title={title}
                      titleId={titleId}
                      onClose={onClose}
                      onBack={onBack}
                      hideHeaderDivider={hideHeaderDivider}
                      className={className}
                      loading={loading}
                    >
                      {children}
                    </ModalPanelShell>
                  </div>
                </>
              )}
            </div>
          ) : (
            <ModalPanelShell
              title={title}
              titleId={titleId}
              onClose={onClose}
              onBack={onBack}
              hideHeaderDivider={hideHeaderDivider}
              className={className}
              loading={loading}
            >
              {children}
            </ModalPanelShell>
          )}
        </div>
        {belowPanel && <div className="pointer-events-auto w-full">{belowPanel}</div>}
      </div>
    </div>,
    document.body
  );
}
