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
    <div className="flex min-h-9 items-center gap-2">
      <span className="w-[5.5rem] shrink-0 truncate text-[10px] font-semibold uppercase tracking-wide text-white/50">
        {label}
      </span>
      <div className="min-w-0 flex-1">
        {hasValue ? (
          <div className="relative inline-flex max-w-full min-w-0 items-center">
            <span className="truncate text-[11px] font-medium text-[#CCFF00]">{value}</span>
            {editable ? (
              <button
                type="button"
                onClick={onEdit}
                aria-label={`Editar ${label}`}
                className="ml-1 shrink-0 text-[#CCFF00] transition-opacity hover:opacity-80"
              >
                <Pencil className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : editable ? (
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              "inline-flex min-h-7 items-center gap-1 rounded-full px-2.5",
              "bg-[#CCFF00] text-[10px] font-semibold uppercase tracking-wide text-[#2a1058]",
              "transition-opacity hover:opacity-90 active:opacity-80"
            )}
          >
            <Plus className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            Añadir
          </button>
        ) : (
          <span className="text-[11px] text-white/30">—</span>
        )}
      </div>
    </div>
  );
}
