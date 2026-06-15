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
  value: number | null;
  disabled?: boolean;
  onChange: (next: number | null) => void;
  variant?: "default" | "floating";
  hideLabel?: boolean;
}) {
  const isFloating = variant === "floating";
  const isUnset = value === null;

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
          disabled={disabled || isUnset || value <= 0}
          aria-label={`Menos goles ${label}`}
          onClick={() => {
            if (value === null) return;
            onChange(value === 0 ? null : value - 1);
          }}
          className={
            isFloating
              ? cn(
                  floatingControlBase,
                  "h-[1.125rem] w-[1.125rem] bg-[rgba(178,68,68,0.55)]",
                  (disabled || isUnset || value <= 0) && "opacity-40"
                )
              : cn(defaultControlClass, (disabled || isUnset || value <= 0) && "opacity-40")
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
            "font-display text-center text-[var(--tm-fg)] tabular-nums",
            isFloating
              ? isUnset
                ? "flex min-w-0 items-center justify-center"
                : "min-w-[1.25ch] text-[2.5rem] leading-none sm:text-[2.75rem]"
              : "min-w-[1.25ch] text-3xl"
          )}
        >
          {isUnset ? (
            <span
              className={cn(
                "block rounded-full bg-white/35",
                isFloating ? "h-px w-[0.4rem] sm:w-[0.45rem]" : "h-px w-3"
              )}
              aria-hidden="true"
            />
          ) : (
            value
          )}
        </span>
        <button
          type="button"
          disabled={disabled || (!isUnset && value >= MAX_GOALS)}
          aria-label={`Mas goles ${label}`}
          onClick={() => onChange(isUnset ? 0 : Math.min(MAX_GOALS, value! + 1))}
          className={
            isFloating
              ? cn(
                  floatingControlBase,
                  "h-[1.125rem] w-[1.125rem] bg-[rgba(62,138,82,0.55)]",
                  (disabled || (!isUnset && value >= MAX_GOALS)) && "opacity-40"
                )
              : cn(
                  defaultControlClass,
                  (disabled || (!isUnset && value >= MAX_GOALS)) && "opacity-40"
                )
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