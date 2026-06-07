import { cn } from "@/lib/utils";
import type { LineupSlot } from "@/lib/lineup/types";

type LineupPlayerChipProps = {
  slot: LineupSlot;
  onClick?: () => void;
};

export function LineupPlayerChip({ slot, onClick }: LineupPlayerChipProps) {
  const dorsal = slot.shirtNumber != null && slot.shirtNumber > 0 ? String(slot.shirtNumber) : "—";
  const interactive = Boolean(onClick) && !slot.isPlaceholder;

  const content = (
    <>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-sm sm:h-11 sm:w-11",
          slot.isPlaceholder
            ? "border-dashed border-white/25 bg-black/30"
            : "border-[var(--tm-accent)]/40 bg-[rgba(10,8,24,0.85)]",
          interactive && "transition-transform active:scale-95"
        )}
      >
        <span className="font-display text-sm font-bold text-[var(--tm-accent)] sm:text-base">
          {dorsal}
        </span>
      </div>
      <div className="w-full rounded-md border border-white/10 bg-black/55 px-1 py-0.5 text-center backdrop-blur-sm">
        <p className="truncate text-[9px] font-semibold leading-tight text-white sm:text-[10px]">
          {slot.name}
        </p>
        <p className="text-[8px] font-medium uppercase tracking-wide text-white/55 sm:text-[9px]">
          {slot.positionLabel}
        </p>
      </div>
    </>
  );

  if (!interactive) {
    return (
      <div
        className={cn(
          "flex w-[4.5rem] min-h-12 shrink-0 flex-col items-center gap-0.5 sm:w-[5.25rem]",
          slot.isPlaceholder && "opacity-70"
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-[4.5rem] min-h-12 shrink-0 flex-col items-center gap-0.5 sm:w-[5.25rem]",
        slot.isPlaceholder && "opacity-70"
      )}
    >
      {content}
    </button>
  );
}
