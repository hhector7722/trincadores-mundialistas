"use client";

import type { OptionVisualState } from "@/lib/quiz/play-flow";
import { cn } from "@/lib/utils";

type QuizOptionButtonProps = {
  optionId: string;
  label: string;
  visualState: OptionVisualState;
  locked: boolean;
  onSelect: () => void;
};

export function QuizOptionButton({
  optionId,
  label,
  visualState,
  locked,
  onSelect,
}: QuizOptionButtonProps) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onSelect}
      className={cn(
        "tm-quiz-option flex min-h-12 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors",
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
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase",
          visualState === "correct" || visualState === "revealed"
            ? "bg-emerald-500 text-white"
            : visualState === "wrong"
              ? "bg-red-500 text-white"
              : "bg-white/10 text-white/80"
        )}
      >
        {optionId}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
    </button>
  );
}
