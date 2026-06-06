"use client";

import { cn } from "@/lib/utils";

type QuizOptionButtonProps = {
  optionId: string;
  label: string;
  selected: boolean;
  locked: boolean;
  onSelect: () => void;
};

export function QuizOptionButton({
  optionId,
  label,
  selected,
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
        selected
          ? "border-[var(--tm-accent)] bg-[var(--tm-accent-soft)] text-[var(--tm-fg)]"
          : "border-[var(--tm-border)] bg-[var(--tm-surface)] text-[var(--tm-fg)] hover:border-[var(--tm-accent-muted)]",
        locked && !selected && "opacity-60"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase",
          selected
            ? "bg-[var(--tm-accent)] text-[var(--tm-primary-fg)]"
            : "bg-white/10 text-white/80"
        )}
      >
        {optionId}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
    </button>
  );
}
