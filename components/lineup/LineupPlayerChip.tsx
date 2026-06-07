import { cn } from "@/lib/utils";
import type { LineupSlot } from "@/lib/lineup/types";

type LineupPlayerChipProps = {
  slot: LineupSlot;
  onClick?: () => void;
  variant?: "default" | "modal";
};

export function LineupPlayerChip({ slot, onClick, variant = "default" }: LineupPlayerChipProps) {
  const isModal = variant === "modal";
  const dorsal = slot.shirtNumber != null && slot.shirtNumber > 0 ? String(slot.shirtNumber) : "—";
  const interactive = Boolean(onClick) && !slot.isPlaceholder;

  const content = (
    <>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center border shadow-sm",
          isModal
            ? "h-5 w-5 rounded-full border-[var(--tm-accent)]/45 bg-[rgba(10,8,24,0.82)]"
            : "h-10 w-10 rounded-lg sm:h-11 sm:w-11",
          !isModal &&
            (slot.isPlaceholder
              ? "border-dashed border-white/25 bg-black/30"
              : "border-[var(--tm-accent)]/40 bg-[rgba(10,8,24,0.85)]"),
          isModal &&
            slot.isPlaceholder &&
            "border-dashed border-white/25 bg-black/30",
          interactive && "transition-transform active:scale-95"
        )}
      >
        <span
          className={cn(
            "font-display font-bold text-[var(--tm-accent)]",
            isModal ? "text-[7px] leading-none" : "text-sm sm:text-base"
          )}
        >
          {dorsal}
        </span>
      </div>
      <div className="w-full rounded-md border border-white/10 bg-black/55 px-1 py-0.5 text-center backdrop-blur-sm">
        <p
          className={cn(
            "truncate font-semibold leading-tight text-white",
            isModal ? "text-[8px]" : "text-[9px] sm:text-[10px]"
          )}
        >
          {slot.name}
        </p>
        {!isModal ? (
          <p className="text-[8px] font-medium uppercase tracking-wide text-white/55 sm:text-[9px]">
            {slot.positionLabel}
          </p>
        ) : null}
      </div>
    </>
  );

  const shellClass = cn(
    "flex shrink-0 flex-col items-center gap-0.5",
    isModal ? "w-[3.25rem] min-h-9" : "w-[4.5rem] min-h-12 sm:w-[5.25rem]",
    slot.isPlaceholder && "opacity-70"
  );

  if (!interactive) {
    return <div className={shellClass}>{content}</div>;
  }

  return (
    <button type="button" onClick={onClick} className={shellClass}>
      {content}
    </button>
  );
}
