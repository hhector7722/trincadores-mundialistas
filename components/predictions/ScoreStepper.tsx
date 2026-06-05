"use client";

import { Minus, Plus } from "lucide-react";
import { MAX_GOALS } from "@/lib/predictions/validation";
import { cn } from "@/lib/utils";

export function ScoreStepper({
  label,
  value,
  disabled,
  onChange,
  variant = "default",
  hideLabel = false,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (next: number) => void;
  variant?: "default" | "floating";
  hideLabel?: boolean;
}) {
  const isFloating = variant === "floating";

  const controlClass = cn(
    "flex shrink-0 items-center justify-center text-[var(--tm-fg)]",
    isFloating
      ? "h-10 w-10 text-[var(--tm-accent)] transition-opacity hover:opacity-80 active:opacity-60"
      : "h-12 w-12 rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface-elevated)] active:border-[var(--tm-accent-muted)]"
  );

  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      {!hideLabel && (
        <span className="text-xs font-medium text-[var(--tm-muted)]">{label}</span>
      )}
      <div
        className={cn(
          "flex items-center justify-between gap-2",
          isFloating ? "w-full max-w-[160px]" : "w-full max-w-[140px]"
        )}
      >
        <button
          type="button"
          disabled={disabled || value <= 0}
          aria-label={`Menos goles ${label}`}
          onClick={() => onChange(Math.max(0, value - 1))}
          className={cn(controlClass, (disabled || value <= 0) && "opacity-40")}
        >
          <Minus className={cn("h-5 w-5", isFloating && "h-4 w-4")} />
        </button>
        <span className="font-display min-w-[2ch] text-center text-3xl text-[var(--tm-fg)]">
          {value}
        </span>
        <button
          type="button"
          disabled={disabled || value >= MAX_GOALS}
          aria-label={`Mas goles ${label}`}
          onClick={() => onChange(Math.min(MAX_GOALS, value + 1))}
          className={cn(controlClass, (disabled || value >= MAX_GOALS) && "opacity-40")}
        >
          <Plus className={cn("h-5 w-5", isFloating && "h-4 w-4")} />
        </button>
      </div>
    </div>
  );
}