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
    <div className="flex min-h-6 items-center gap-1.5 py-px">
      <span className="w-[5rem] shrink-0 truncate text-[9px] font-semibold uppercase tracking-wide text-white/50">
        {label}
      </span>
      <div className="min-w-0 flex-1">
        {hasValue ? (
          <div className="relative inline-flex max-w-full min-w-0 items-center">
            <span className="truncate text-[10px] font-medium text-[#CCFF00]">{value}</span>
            {editable ? (
              <button
                type="button"
                onClick={onEdit}
                aria-label={`Editar ${label}`}
                className="ml-0.5 shrink-0 text-[#CCFF00] transition-opacity hover:opacity-80"
              >
                <Pencil className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : editable ? (
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              "inline-flex w-fit max-w-full items-center whitespace-nowrap rounded-full",
              "bg-[#CCFF00] px-[clamp(6px,2cqw,8px)] py-[clamp(2px,0.8cqw,3px)]",
              "text-[clamp(8px,2.2cqw,9px)] font-bold uppercase tracking-wide text-black",
              "transition-opacity hover:opacity-90 active:opacity-80"
            )}
          >
            <Plus className="mr-0.5 h-2 w-2 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            Añadir
          </button>
        ) : (
          <span className="text-[10px] text-white/30">—</span>
        )}
      </div>
    </div>
  );
}
