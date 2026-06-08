"use client";

import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type GeneralPredictionRowProps = {
  label: string;
  value: string | null;
  editable: boolean;
  onAdd: () => void;
  onEdit: () => void;
};

export function GeneralPredictionRow({
  label,
  value,
  editable,
  onAdd,
  onEdit,
}: GeneralPredictionRowProps) {
  const hasValue = Boolean(value);

  return (
    <div className="grid min-h-6 grid-cols-[minmax(0,4.75rem)_minmax(0,1fr)] items-center gap-1 py-0.5">
      <span className="flex min-w-0 items-center truncate text-[9px] font-semibold uppercase tracking-wide text-white/50">
        {label}
      </span>
      <div className="flex min-w-0 items-center justify-end gap-1 overflow-visible">
        {hasValue ? (
          <>
            <span className="min-w-0 truncate text-right text-[10px] font-medium text-[#CCFF00]">
              {value}
            </span>
            {editable ? (
              <button
                type="button"
                onClick={onEdit}
                aria-label={`Editar ${label}`}
                className="shrink-0 text-[#CCFF00] transition-opacity hover:opacity-80"
              >
                <Pencil className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" />
              </button>
            ) : null}
          </>
        ) : editable ? (
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              "inline-flex shrink-0 items-center whitespace-nowrap rounded-full",
              "bg-[#CCFF00] px-[clamp(8px,2.5cqw,10px)] py-[clamp(3px,1cqw,4px)]",
              "text-[clamp(8px,2.2cqw,9px)] font-bold uppercase tracking-wide text-black",
              "transition-opacity hover:opacity-90 active:opacity-80"
            )}
          >
            <Plus className="mr-0.5 h-2.5 w-2.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            Añadir
          </button>
        ) : (
          <span className="text-[10px] text-white/30">—</span>
        )}
      </div>
    </div>
  );
}
