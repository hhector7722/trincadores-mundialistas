"use client";

import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Pencil, Plus } from "lucide-react";
import { ConfirmedLineupCheckIcon } from "@/components/lineup/ConfirmedLineupCheckIcon";
import { cn } from "@/lib/utils";

/** Separación fija entre el final del nombre y el icono de edición. */
const EDIT_ICON_GAP_PX = 10;

/** Mismo tamaño que el lápiz de «Mi pronóstico» (HomeNextMatch). */
const EDIT_PENCIL_CLASS = "h-3 w-3 shrink-0";
const EDIT_PENCIL_STROKE = 2;

/** Clases del label/botón de acción (p. ej. «Añadir MVP», «Guardar MVP»). */
export const MATCH_CONTEXT_ACTION_TEXT_CLASS =
  "text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-accent)] transition-opacity hover:opacity-80";

export const MATCH_CONTEXT_ACTION_BUTTON_CLASS =
  "block w-full text-center text-[var(--tm-accent)] transition-opacity hover:opacity-80";

type MatchContextTextActionButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  /** Bloquea interacción sin atenuar el color (evita el gris nativo de `disabled`). */
  inactive?: boolean;
  title?: string;
};

/** Botón de texto amarillo compartido (p. ej. «Añadir MVP», «Guardar MVP»). */
export function MatchContextTextActionButton({
  children,
  onClick,
  className,
  inactive = false,
  title,
}: MatchContextTextActionButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-disabled={inactive || undefined}
      onClick={
        inactive
          ? undefined
          : (event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              onClick?.();
            }
      }
      className={cn(
        MATCH_CONTEXT_ACTION_BUTTON_CLASS,
        inactive && "cursor-default",
        className
      )}
    >
      <span className={cn("inline-flex items-center justify-center gap-1", MATCH_CONTEXT_ACTION_TEXT_CLASS)}>
        {children}
      </span>
    </button>
  );
}

/** Enlace «Plantilla» bajo el nombre de selección en la card inicio. */
export function HomeSquadFooterLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onClick();
      }}
      className={MATCH_CONTEXT_ACTION_BUTTON_CLASS}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center gap-1 text-[9px] leading-none",
          MATCH_CONTEXT_ACTION_TEXT_CLASS,
        )}
      >
        Plantilla
      </span>
    </button>
  );
}

type MatchContextActionButtonProps = {
  caption: string;
  onClick: () => void;
  savedValue?: string | null;
  showEdit?: boolean;
  addIcon?: boolean;
  showConfirmedBadge?: boolean;
  hideCaption?: boolean;
  emptyLabel?: string;
  /** `muted` = enlace secundario (modal detalle partido). */
  tone?: "accent" | "muted";
  className?: string;
};

export function MatchContextActionButton({
  caption,
  onClick,
  savedValue,
  showEdit = false,
  addIcon = false,
  showConfirmedBadge = false,
  hideCaption = false,
  emptyLabel,
  tone = "accent",
  className,
}: MatchContextActionButtonProps) {
  const muted = tone === "muted";
  const actionTextClass = muted
    ? "text-[9px] font-semibold uppercase tracking-wider text-white/50 transition-opacity hover:text-white/70 hover:opacity-100"
    : MATCH_CONTEXT_ACTION_TEXT_CLASS;
  const actionButtonClass = muted
    ? "block w-full text-center text-white/50 transition-opacity hover:text-white/70 hover:opacity-100"
    : MATCH_CONTEXT_ACTION_BUTTON_CLASS;
  const saved = Boolean(savedValue);
  const emptyText = emptyLabel ?? caption;
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [editIconPos, setEditIconPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!saved || !showEdit) {
      setEditIconPos(null);
      return;
    }

    const update = () => {
      const label = labelRef.current;
      const container = containerRef.current;
      if (!label || !container) return;

      const labelRect = label.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setEditIconPos({
        left: labelRect.right - containerRect.left + EDIT_ICON_GAP_PX,
        top: labelRect.top - containerRect.top + labelRect.height / 2,
      });
    };

    update();

    const label = labelRef.current;
    if (!label) return;

    const observer = new ResizeObserver(update);
    observer.observe(label);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [saved, showEdit, savedValue]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick();
  };

  return (
    <div className={cn("w-full min-w-0", className)}>
      {!hideCaption ? (
        <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-white/60">
          {saved && showEdit ? "Mi pronóstico" : caption}
        </p>
      ) : null}
      {saved ? (
        <div ref={containerRef} className="relative w-full">
          <button
            type="button"
            onClick={handleClick}
            className={cn(actionButtonClass, "min-w-0")}
          >
            <span
              ref={labelRef}
              className={cn(
                "inline-block max-w-full truncate text-center text-[10px] font-semibold sm:text-xs",
                hideCaption
                  ? "uppercase tracking-wide"
                  : "font-display normal-case",
                muted && "!text-white/50",
              )}
            >
              {savedValue}
            </span>
          </button>
          {showEdit && editIconPos != null ? (
            <button
              type="button"
              onClick={handleClick}
              aria-label={`Editar ${caption}: ${savedValue}`}
              className="absolute flex -translate-y-1/2 items-center text-[var(--tm-accent)] transition-opacity hover:opacity-80"
              style={{ left: editIconPos.left, top: editIconPos.top }}
            >
              <Pencil
                className={EDIT_PENCIL_CLASS}
                strokeWidth={EDIT_PENCIL_STROKE}
                aria-hidden="true"
              />
            </button>
          ) : null}
        </div>
      ) : (
        <MatchContextTextActionButton
          onClick={onClick}
          className={muted ? actionButtonClass : undefined}
        >
          <span className={cn("inline-flex items-center justify-center gap-1", actionTextClass)}>
            {addIcon ? (
              <Plus className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden="true" />
            ) : null}
            {emptyText}
            {showConfirmedBadge ? <ConfirmedLineupCheckIcon /> : null}
          </span>
        </MatchContextTextActionButton>
      )}
    </div>
  );
}
