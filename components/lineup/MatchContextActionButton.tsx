"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Separación fija entre el final del nombre y el icono de edición. */
const EDIT_ICON_GAP_PX = 10;

/** Mismo tamaño que el lápiz de «Mi pronóstico» (HomeNextMatch). */
const EDIT_PENCIL_CLASS = "h-3 w-3 shrink-0";
const EDIT_PENCIL_STROKE = 2;

/** Clases del label/botón de acción (p. ej. «Añadir MVP», «Guardar MVP»). */
export const MATCH_CONTEXT_ACTION_TEXT_CLASS =
  "text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-accent)] transition-opacity hover:opacity-80";

type MatchContextActionButtonProps = {
  caption: string;
  onClick: () => void;
  savedValue?: string | null;
  showEdit?: boolean;
  addIcon?: boolean;
  hideCaption?: boolean;
  emptyLabel?: string;
  className?: string;
};

export function MatchContextActionButton({
  caption,
  onClick,
  savedValue,
  showEdit = false,
  addIcon = false,
  hideCaption = false,
  emptyLabel,
  className,
}: MatchContextActionButtonProps) {
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
            onClick={onClick}
            className="block w-full min-w-0 text-center text-[var(--tm-accent)] transition-opacity hover:opacity-80"
          >
            <span
              ref={labelRef}
              className={cn(
                "inline-block max-w-full truncate text-center text-[10px] font-semibold sm:text-xs",
                hideCaption
                  ? "uppercase tracking-wide"
                  : "font-display normal-case"
              )}
            >
              {savedValue}
            </span>
          </button>
          {showEdit && editIconPos != null ? (
            <button
              type="button"
              onClick={onClick}
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
        <button
          type="button"
          onClick={onClick}
            className="block w-full text-center text-[var(--tm-accent)] transition-opacity hover:opacity-80"
          >
            <span className={cn("inline-flex items-center justify-center gap-1", MATCH_CONTEXT_ACTION_TEXT_CLASS)}>
            {addIcon ? (
              <Plus className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden="true" />
            ) : null}
            {emptyText}
          </span>
        </button>
      )}
    </div>
  );
}
