"use client";

import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div className={cn("inline-block w-full min-w-0", className)}>
      {!hideCaption ? (
        <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-white/60">
          {saved && showEdit ? "Mi pronóstico" : caption}
        </p>
      ) : null}
      {saved ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={showEdit ? `Editar ${caption}: ${savedValue}` : savedValue ?? caption}
          className="flex w-full min-w-0 items-center justify-center gap-0.5 text-[var(--tm-accent)] transition-opacity hover:opacity-80"
        >
          <span className="truncate text-center font-display text-[10px] font-semibold normal-case sm:text-xs">
            {savedValue}
          </span>
          {showEdit ? (
            <Pencil className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden="true" />
          ) : null}
        </button>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="block w-full text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-accent)] transition-opacity hover:opacity-80"
        >
          <span className="inline-flex items-center justify-center gap-1">
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
