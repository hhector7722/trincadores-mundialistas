"use client";

import { useHighlightScorelineVisibility } from "@/components/highlights/HighlightScorelineVisibilityProvider";
import { cn } from "@/lib/utils";

export function HighlightScorelineToggle() {
  const { visible, toggleVisible, canControl, pending } = useHighlightScorelineVisibility();

  if (!canControl) return null;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={visible}
      aria-label={
        visible
          ? "Ocultar marcador en highlights del hero"
          : "Mostrar marcador en highlights del hero"
      }
      onClick={() => void toggleVisible()}
      disabled={pending}
      className="flex h-12 w-10 shrink-0 items-center justify-center disabled:opacity-60"
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-full border border-white/55 bg-transparent p-0.5 transition-[border-color]",
          visible && "border-white/85",
        )}
      >
        <span
          className={cn(
            "block h-3.5 w-3.5 rounded-full border border-white/70 bg-transparent transition-transform duration-200 ease-out",
            visible ? "translate-x-3.5" : "translate-x-0",
          )}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}
