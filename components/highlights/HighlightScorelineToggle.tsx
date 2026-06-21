"use client";

import { useHighlightScorelineVisibility } from "@/components/highlights/HighlightScorelineVisibilityProvider";
import { cn } from "@/lib/utils";

export function HighlightScorelineToggle() {
  const { visible, toggleVisible, canControl, pending } = useHighlightScorelineVisibility();

  if (!canControl && !visible) return null;

  return (
    <button
      type="button"
      role={canControl ? "switch" : undefined}
      aria-checked={canControl ? visible : undefined}
      aria-label="Predicción IA"
      onClick={canControl ? () => void toggleVisible() : undefined}
      disabled={pending || (!canControl)}
      className={cn(
        "inline-flex h-6 items-center justify-center rounded-full px-2.5 text-[8px] font-bold uppercase tracking-[0.12em] transition-opacity",
        visible
          ? "bg-[#CCFF00] text-black hover:opacity-90"
          : "bg-white/10 text-white/40 hover:bg-white/20",
        pending && "opacity-50",
        !canControl && "cursor-default"
      )}
    >
      AI
    </button>
  );
}
