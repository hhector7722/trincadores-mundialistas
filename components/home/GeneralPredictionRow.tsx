"use client";

import { Pencil, Plus } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { GENERAL_PREDICTION_VALUE_HEX } from "@/lib/ui/general-prediction-value-style";
import { cn } from "@/lib/utils";

type GeneralPredictionRowProps = {
  label: string;
  value?: string | null;
  valueNode?: ReactNode;
  editable: boolean;
  onAdd: () => void;
  onEdit: () => void;
};

export function GeneralPredictionRow({
  label,
  value = null,
  valueNode,
  editable,
  onAdd,
  onEdit,
}: GeneralPredictionRowProps) {
  const hasValue = Boolean(valueNode ?? value);

  function stopCardNavigation(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div className="tm-general-prediction-row grid h-full w-full grid-cols-[minmax(0,3.1rem)_minmax(0,1fr)_0.875rem] items-center gap-0.5">
      <span className="flex min-w-0 items-center text-[clamp(7px,2cqw,9px)] font-semibold uppercase leading-tight tracking-wide text-white/50">
        {label}
      </span>
      <div className="flex min-w-0 items-center justify-center overflow-visible px-0.5">
        {hasValue ? (
          valueNode ?? (
            <span
              className="line-clamp-2 max-w-full break-words text-center text-[clamp(8px,2.4cqw,10px)] font-medium leading-tight"
              style={{ color: GENERAL_PREDICTION_VALUE_HEX }}
            >
              {value}
            </span>
          )
        ) : editable ? (
          <button
            type="button"
            onClick={(event) => {
              stopCardNavigation(event);
              onAdd();
            }}
            className={cn(
              "inline-flex shrink-0 items-center whitespace-nowrap rounded-full",
              "bg-[#CCFF00] px-[clamp(6px,2.1cqw,8px)] py-[clamp(3px,1cqw,4px)]",
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
      <div className="flex items-center justify-end">
        {hasValue && editable ? (
          <button
            type="button"
            onClick={(event) => {
              stopCardNavigation(event);
              onEdit();
            }}
            aria-label={`Editar ${label}`}
            className="shrink-0 text-[#CCFF00] transition-opacity hover:opacity-80"
          >
            <Pencil className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
