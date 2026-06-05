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
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 touch-none overscroll-none bg-black/60 backdrop-blur-md"
        onClick={onClose}
        onTouchMove={(event) => event.preventDefault()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex w-full max-w-sm max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-surface)] shadow-[0_24px_64px_rgba(0,0,0,0.45)] outline-none",
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
    </div>,
    document.body
  );
}
