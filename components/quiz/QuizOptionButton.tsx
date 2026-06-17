"use client";

import type { OptionVisualState } from "@/lib/quiz/play-flow";
import { cn } from "@/lib/utils";

type QuizOptionButtonProps = {
  optionId: string;
  label: string;
  visualState: OptionVisualState;
  locked: boolean;
  onSelect: () => void;
  /** Grid 2×2: letra y texto en una fila. */
  compact?: boolean;
};

export function QuizOptionButton({
  optionId,
  label,
  visualState,
  locked,
  onSelect,
  compact = false,
}: QuizOptionButtonProps) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onSelect}
      className={cn(
        "tm-quiz-option w-full rounded-xl border font-medium transition-colors",
        compact
          ? "flex min-h-12 items-center gap-2 px-3 py-2 text-left text-xs"
          : "flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm",
        visualState === "default" &&
          "border-[var(--tm-border)] bg-[var(--tm-surface)] text-[var(--tm-fg)] hover:border-[var(--tm-accent-muted)]",
        visualState === "correct" &&
          "border-emerald-400/60 bg-emerald-500/20 text-[var(--tm-fg)]",
        visualState === "wrong" && "border-red-400/60 bg-red-500/20 text-[var(--tm-fg)]",
        visualState === "revealed" &&
          "border-emerald-400/40 bg-emerald-500/10 text-[var(--tm-fg)]",
        locked && visualState === "default" && "opacity-60"
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full font-bold uppercase",
          compact ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs",
          visualState === "correct" || visualState === "revealed"
            ? "bg-emerald-500 text-white"
            : visualState === "wrong"
              ? "bg-red-500 text-white"
              : "bg-white/10 text-white/80"
        )}
      >
        {optionId}
      </span>
      <span className="min-w-0 flex-1 truncate leading-tight">{label}</span>
    </button>
  );
}
