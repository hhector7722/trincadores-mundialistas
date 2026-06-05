"use client";

import { Minus, Plus } from "lucide-react";
import { MAX_GOALS } from "@/lib/predictions/validation";
import { cn } from "@/lib/utils";

export function ScoreStepper({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <span className="text-xs font-medium text-[var(--tm-muted)]">{label}</span>
      <div className="flex w-full max-w-[140px] items-center justify-between gap-2">
        <button
          type="button"
          disabled={disabled || value <= 0}
          aria-label={`Menos goles ${label}`}
          onClick={() => onChange(Math.max(0, value - 1))}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface)] text-[var(--tm-fg)]",
            (disabled || value <= 0) && "opacity-40"
          )}
        >
          <Minus className="h-5 w-5" />
        </button>
        <span className="font-display min-w-[2ch] text-center text-3xl text-[var(--tm-fg)]">
          {value}
        </span>
        <button
          type="button"
          disabled={disabled || value >= MAX_GOALS}
          aria-label={`Mas goles ${label}`}
          onClick={() => onChange(Math.min(MAX_GOALS, value + 1))}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface)] text-[var(--tm-fg)]",
            (disabled || value >= MAX_GOALS) && "opacity-40"
          )}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}