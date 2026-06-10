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

  const defaultControlClass =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface-elevated)] text-[var(--tm-fg)] active:border-[var(--tm-accent-muted)]";

  const floatingControlBase =
    "flex shrink-0 items-center justify-center rounded-[5px] text-white transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-40";

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        isFloating ? "h-full justify-center gap-0" : "flex-1 gap-2"
      )}
    >
      {!hideLabel && (
        <span className="text-xs font-medium text-[var(--tm-muted)]">{label}</span>
      )}
      <div
        className={cn(
          "flex items-center justify-between",
          isFloating
            ? "h-10 w-full max-w-[6.25rem] gap-1.5 sm:h-11"
            : "w-full max-w-[140px] gap-2"
        )}
      >
        <button
          type="button"
          disabled={disabled || value <= 0}
          aria-label={`Menos goles ${label}`}
          onClick={() => onChange(Math.max(0, value - 1))}
          className={
            isFloating
              ? cn(floatingControlBase, "h-[1.125rem] w-[1.125rem] bg-[rgba(168,78,78,0.38)]")
              : cn(defaultControlClass, (disabled || value <= 0) && "opacity-40")
          }
        >
          <Minus
            className={cn(
              isFloating ? "h-2 w-2 stroke-[2.75]" : "h-5 w-5"
            )}
            aria-hidden="true"
          />
        </button>
        <span
          className={cn(
            "font-display min-w-[1.25ch] text-center text-[var(--tm-fg)] tabular-nums",
            isFloating
              ? "text-[2.5rem] leading-none sm:text-[2.75rem]"
              : "text-3xl"
          )}
        >
          {value}
        </span>
        <button
          type="button"
          disabled={disabled || value >= MAX_GOALS}
          aria-label={`Mas goles ${label}`}
          onClick={() => onChange(Math.min(MAX_GOALS, value + 1))}
          className={
            isFloating
              ? cn(floatingControlBase, "h-[1.125rem] w-[1.125rem] bg-[rgba(74,132,88,0.38)]")
              : cn(defaultControlClass, (disabled || value >= MAX_GOALS) && "opacity-40")
          }
        >
          <Plus
            className={cn(
              isFloating ? "h-2 w-2 stroke-[2.75]" : "h-5 w-5"
            )}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}