"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { LoadingOverlay } from "@/components/ui/spinner";
import { trackUsageModalDwell, trackUsageModalOpen } from "@/lib/usage/client";
import { MODAL_ENTER_MS, MODAL_EXIT_MS, PANEL_SLIDE_MS, iosTransition } from "@/lib/ui/motion";
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
  title: ReactNode;
  children: ReactNode;
  className?: string;
  /** Contenedor raíz del portal (posición, z-index, padding). */
  containerClassName?: string;
  wrapperClassName?: string;
  /** Contenedor del panel (por defecto `w-full`). */
  panelHostClassName?: string;
  hideHeaderDivider?: boolean;
  hideTitle?: boolean;
  /** Sin barra superior (título, trailing ni cerrar). Usar `ariaLabel`. */
  hideHeader?: boolean;
  /** Controles en la cabecera, a la izquierda del botón cerrar. */
  headerTrailing?: ReactNode;
  ariaLabel?: string;
  backdropClassName?: string;
  belowPanel?: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onBack?: () => void;
  panelSlide?: ModalPanelSlide | null;
  loading?: boolean;
  /** Título alineado a la izquierda (sin hueco izquierdo si no hay volver). */
  headerTitleAlign?: "left" | "default" | "center";
  /** Contenido centrado en la barra cuando `hideTitle` (p. ej. fecha del partido). */
  headerCenter?: ReactNode;
  /** Cabecera mínima para modales de campo (menos padding y targets más pequeños). */
  headerCompact?: boolean;
  /** Flecha de volver sin marco ni relleno. */
  backButtonPlain?: boolean;
  /** Si false, el contenido no hace scroll interno (layout adaptativo sin recortes). */
  scrollContent?: boolean;
  /** Panel opaco; el fondo exterior (backdrop) se difumina con blur. */
  opaque?: boolean;
  /** Apila por encima de otro modal (p. ej. al abrir desde «Ver datos»). */
  stackElevated?: boolean;
  /** Oculta el botón X de la cabecera (p. ej. cierre solo por backdrop). */
  hideCloseButton?: boolean;
  /** Id estable para analytics de uso. */
  usageId?: string;
  /** Etiqueta legible para analytics (si title no es string). */
  usageLabel?: string;
  /** Desactiva tracking de modal (p. ej. reproductor de resumen con metricas propias). */
  disableUsageTracking?: boolean;
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

  const preventScroll = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-modal-scroll="true"]')) {
      return;
    }
    // Permitir pinch-zoom si se hace multitouch (aunque en modales suele bloquearse)
    if (e.touches.length > 1) return;
    
    e.preventDefault();
  };

  document.addEventListener("touchmove", preventScroll, { passive: false });

  return () => {
    document.removeEventListener("touchmove", preventScroll);
    html.removeAttribute("data-modal-open");
    html.style.overflow = state.htmlOverflow;
    document.body.style.overflow = state.bodyOverflow;
    if (main instanceof HTMLElement) {
      main.style.overflow = state.mainOverflow;
    }
  };
}

const panelShellBaseClass =
  "flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--tm-border)] shadow-[var(--tm-shadow-soft)] outline-none";

function panelShellClass(opaque: boolean) {
  return cn(
    panelShellBaseClass,
    opaque ? "bg-[var(--tm-bg-elevated)]" : "bg-[var(--tm-glass)] backdrop-blur-xl"
  );
}

function ModalPanelShell({
  title,
  titleId,
  onClose,
  onBack,
  hideHeaderDivider,
  hideTitle = false,
  hideHeader = false,
  headerTrailing,
  headerTitleAlign = "default",
  headerCenter,
  headerCompact = false,
  backButtonPlain = false,
  scrollContent = true,
  opaque = false,
  className,
  children,
  loading = false,
  hideCloseButton = false,
}: {
  title: ReactNode;
  titleId: string;
  onClose: () => void;
  onBack?: () => void;
  hideHeaderDivider?: boolean;
  hideTitle?: boolean;
  hideHeader?: boolean;
  headerTrailing?: ReactNode;
  headerTitleAlign?: "left" | "default" | "center";
  headerCenter?: ReactNode;
  headerCompact?: boolean;
  backButtonPlain?: boolean;
  scrollContent?: boolean;
  opaque?: boolean;
  className?: string;
  children: ReactNode;
  loading?: boolean;
  hideCloseButton?: boolean;
}) {
  const titleLeft = headerTitleAlign === "left";
  const titleCenter = headerTitleAlign === "center";

  return (
    <div className={cn(panelShellClass(opaque), "max-h-[calc(100dvh-2rem)]", className)}>
      {hideHeader ? (
        <span id={titleId} className="sr-only">
          {title}
        </span>
      ) : (
      <div
        className={cn(
          "relative flex shrink-0 items-center gap-1",
          headerCompact ? "px-2 py-1" : "gap-2 px-4",
          !headerCompact && (hideTitle ? "py-2" : "py-3"),
          !hideHeaderDivider && "border-b border-[var(--tm-border)]"
        )}
      >
        {onBack ? (
          <button
            type="button"
            aria-label="Volver"
            onClick={onBack}
            className={cn(
              "relative z-10 flex shrink-0 items-center justify-center text-[var(--tm-muted)] transition-colors hover:text-[var(--tm-fg)]",
              backButtonPlain
                ? headerCompact
                  ? "h-8 w-8"
                  : "h-10 w-10"
                : cn(
                    "rounded-full hover:bg-[var(--tm-surface-elevated)]",
                    headerCompact ? "h-8 w-8" : "h-10 w-10"
                  )
            )}
          >
            <ChevronLeft className={headerCompact ? "h-4 w-4" : "h-5 w-5"} />
          </button>
        ) : (
          <span
            className={cn(
              "relative z-10 shrink-0",
              hideTitle && headerCenter
                ? "w-0"
                : titleCenter && !onBack
                  ? "w-0"
                  : hideTitle || (titleLeft && !onBack)
                    ? "w-0"
                    : headerCompact
                      ? "w-0"
                      : "w-10"
            )}
            aria-hidden="true"
          />
        )}
        {!hideTitle && !titleCenter ? (
          <h2
            id={titleId}
            className={cn(
              "relative z-10 min-w-0 flex-1 truncate font-display text-[var(--tm-fg)]",
              headerCompact ? "text-xs" : "text-sm",
              titleLeft ? "text-left normal-case tracking-normal" : "uppercase tracking-wide"
            )}
          >
            {title}
          </h2>
        ) : !hideTitle && titleCenter ? (
          <>
            <h2 id={titleId} className="sr-only">
              {title}
            </h2>
            <div className="relative z-10 min-w-0 flex-1" aria-hidden="true" />
          </>
        ) : headerCenter ? (
          <div id={titleId} className="sr-only">
            {headerCenter}
          </div>
        ) : (
          <div id={titleId} className="relative z-10 min-w-0 flex-1" />
        )}
        {headerCenter ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-4"
          >
            <p className="text-center font-display text-xs font-semibold leading-tight text-[var(--tm-accent)] sm:text-sm">
              {headerCenter}
            </p>
          </div>
        ) : null}
        {titleCenter && !hideTitle ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-4"
          >
            <p className="max-w-full truncate text-center font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">
              {title}
            </p>
          </div>
        ) : null}
        <div className="relative z-10 ml-auto flex shrink-0 items-center gap-2">
          {headerTrailing ? <div className="shrink-0">{headerTrailing}</div> : null}
          {!hideCloseButton ? (
            <button
              type="button"
              aria-label="Cerrar modal"
              onClick={onClose}
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full text-[var(--tm-muted)] transition-colors hover:bg-[var(--tm-surface-elevated)] hover:text-[var(--tm-fg)]",
                headerCompact ? "h-8 w-8" : "h-10 w-10"
              )}
            >
              <X className={headerCompact ? "h-4 w-4" : "h-5 w-5"} />
            </button>
          ) : null}
        </div>
      </div>
      )}
      <div
        data-modal-scroll={scrollContent ? "true" : undefined}
        className={cn(
          "relative flex flex-col",
          scrollContent
            ? "min-h-0 flex-1 overflow-y-auto overscroll-contain"
            : "flex min-h-0 flex-1 flex-col overflow-hidden"
        )}
      >
        {children}
        {loading ? (
          <LoadingOverlay
            className={opaque ? "bg-[var(--tm-bg-elevated)] backdrop-blur-none" : undefined}
          />
        ) : null}
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
  containerClassName,
  wrapperClassName,
  panelHostClassName,
  hideHeaderDivider = false,
  hideTitle = false,
  hideHeader = false,
  ariaLabel,
  backdropClassName,
  belowPanel,
  onSwipeLeft,
  onSwipeRight,
  onBack,
  panelSlide = null,
  loading = false,
  headerTrailing,
  headerTitleAlign = "default",
  headerCenter,
  headerCompact = false,
  backButtonPlain = false,
  scrollContent = true,
  opaque = false,
  stackElevated = false,
  hideCloseButton = false,
  usageId,
  usageLabel,
  disableUsageTracking = false,
}: ModalProps) {
  const titleId = useId();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swipeHandledRef = useRef(false);
  const hasSwipe = Boolean(onSwipeLeft || onSwipeRight);
  const openedAtRef = useRef<number | null>(null);
  const trackedLabelRef = useRef<string | null>(null);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const panelSlideTransition = iosTransition("transform", PANEL_SLIDE_MS);

  const resolvedUsageLabel =
    usageLabel ??
    (typeof title === "string" ? title : ariaLabel) ??
    usageId ??
    "Modal";
  const resolvedUsageId =
    usageId ??
    resolvedUsageLabel
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  useEffect(() => {
    if (disableUsageTracking) return;

    if (!open) {
      if (openedAtRef.current != null && trackedLabelRef.current) {
        trackUsageModalDwell(
          resolvedUsageId,
          trackedLabelRef.current,
          pathname,
          Date.now() - openedAtRef.current
        );
      }
      openedAtRef.current = null;
      trackedLabelRef.current = null;
      return;
    }

    const now = Date.now();
    if (
      openedAtRef.current != null &&
      trackedLabelRef.current &&
      trackedLabelRef.current !== resolvedUsageLabel
    ) {
      trackUsageModalDwell(
        resolvedUsageId,
        trackedLabelRef.current,
        pathname,
        now - openedAtRef.current
      );
      trackUsageModalOpen(resolvedUsageId, resolvedUsageLabel, pathname);
      openedAtRef.current = now;
    } else if (openedAtRef.current == null) {
      trackUsageModalOpen(resolvedUsageId, resolvedUsageLabel, pathname);
      openedAtRef.current = now;
    }

    trackedLabelRef.current = resolvedUsageLabel;
  }, [disableUsageTracking, open, pathname, resolvedUsageId, resolvedUsageLabel]);

  useEffect(() => {
    if (open) {
      document.documentElement.setAttribute("data-modal-open", "");
      setMounted(true);
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setVisible(false);
    document.documentElement.removeAttribute("data-modal-open");
    const timer = window.setTimeout(() => setMounted(false), MODAL_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;

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
  }, [mounted, onClose]);

  if (!mounted) return null;

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
        "fixed inset-0 flex items-center justify-center p-4",
        stackElevated ? "z-[110]" : "z-[100]",
        slideActive && "touch-none",
        containerClassName
      )}
      onTouchStart={hasSwipe ? onTouchStart : undefined}
      onTouchEnd={hasSwipe ? onTouchEnd : undefined}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className={cn(
          "tm-modal-backdrop absolute inset-0 overscroll-none",
          opaque ? "bg-[#2a1058]/40 backdrop-blur-md" : "bg-[#2a1058]/40 backdrop-blur-sm",
          "touch-none",
          visible ? "tm-modal-backdrop--visible" : "tm-modal-backdrop--hidden",
          !opaque && backdropClassName
        )}
        onClick={onBackdropClick}
        onTouchMove={(event) => event.preventDefault()}
      />
      <div
        className={cn(
          "relative z-10 flex w-full max-w-sm flex-col items-center gap-3 pointer-events-none",
          visible ? "tm-modal-panel-host--visible" : "tm-modal-panel-host--hidden",
          wrapperClassName
        )}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={hideHeader ? undefined : titleId}
          aria-label={hideHeader ? ariaLabel ?? (typeof title === "string" ? title : undefined) : hideTitle ? ariaLabel : undefined}
          tabIndex={-1}
          className={cn(
            "pointer-events-auto w-full overflow-hidden outline-none focus:outline-none focus-visible:outline-none",
            panelHostClassName
          )}
        >
          {slideActive && panelSlide ? (
            <div
              className="flex w-[200%]"
              style={{
                transform: slideNext
                  ? slideAnimate
                    ? "translateX(-50%)"
                    : "translateX(0)"
                  : slideAnimate
                    ? "translateX(0)"
                    : "translateX(-50%)",
                transition: slideAnimate ? panelSlideTransition : "none",
              }}
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
                      hideTitle={hideTitle}
                      hideHeader={hideHeader}
                      headerTrailing={headerTrailing}
                      headerTitleAlign={headerTitleAlign}
                      headerCenter={headerCenter}
                      headerCompact={headerCompact}
                      backButtonPlain={backButtonPlain}
                      scrollContent={scrollContent}
                      opaque={opaque}
                      className={className}
                      loading={loading}
                      hideCloseButton={hideCloseButton}
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
                      hideTitle={hideTitle}
                      hideHeader={hideHeader}
                      headerTrailing={headerTrailing}
                      headerTitleAlign={headerTitleAlign}
                      headerCenter={headerCenter}
                      headerCompact={headerCompact}
                      backButtonPlain={backButtonPlain}
                      scrollContent={scrollContent}
                      opaque={opaque}
                      className={className}
                      loading={loading}
                      hideCloseButton={hideCloseButton}
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
                      hideTitle={hideTitle}
                      hideHeader={hideHeader}
                      headerTrailing={headerTrailing}
                      headerTitleAlign={headerTitleAlign}
                      headerCenter={headerCenter}
                      headerCompact={headerCompact}
                      backButtonPlain={backButtonPlain}
                      scrollContent={scrollContent}
                      opaque={opaque}
                      className={className}
                      loading={loading}
                      hideCloseButton={hideCloseButton}
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
                      hideTitle={hideTitle}
                      hideHeader={hideHeader}
                      headerTrailing={headerTrailing}
                      headerTitleAlign={headerTitleAlign}
                      headerCenter={headerCenter}
                      headerCompact={headerCompact}
                      backButtonPlain={backButtonPlain}
                      scrollContent={scrollContent}
                      opaque={opaque}
                      className={className}
                      loading={loading}
                      hideCloseButton={hideCloseButton}
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
              hideTitle={hideTitle}
              hideHeader={hideHeader}
              headerTrailing={headerTrailing}
              headerTitleAlign={headerTitleAlign}
              headerCenter={headerCenter}
              headerCompact={headerCompact}
              backButtonPlain={backButtonPlain}
              scrollContent={scrollContent}
              opaque={opaque}
              className={className}
              loading={loading}
              hideCloseButton={hideCloseButton}
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
