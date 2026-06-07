"use client";

import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type MatchContextActionButtonProps = {
  caption: string;
  onClick: () => void;
  savedValue?: string | null;
  showEdit?: boolean;
  addIcon?: boolean;
  className?: string;
};

export function MatchContextActionButton({
  caption,
  onClick,
  savedValue,
  showEdit = false,
  addIcon = false,
  className,
}: MatchContextActionButtonProps) {
  const saved = Boolean(savedValue);

  return (
    <div className={cn("inline-block w-full min-w-0", className)}>
      <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-white/60">
        {saved && showEdit ? "Mi pronóstico" : caption}
      </p>
      {saved ? (
        <div className="relative w-0 min-w-full">
          <button
            type="button"
            onClick={onClick}
            className="block w-full truncate text-center font-display text-[10px] font-semibold normal-case text-[var(--tm-accent)] transition-opacity hover:opacity-80 sm:text-xs"
          >
            {savedValue}
          </button>
          {showEdit ? (
            <button
              type="button"
              onClick={onClick}
              aria-label={`Editar ${caption}`}
              className="absolute left-full top-1/2 -ml-1.5 -translate-y-1/2 text-[var(--tm-accent)] transition-opacity hover:opacity-80"
            >
              <Pencil className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden="true" />
            </button>
          ) : null}
        </div>
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
            {caption}
          </span>
        </button>
      )}
    </div>
  );
}
