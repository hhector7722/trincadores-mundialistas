import { getTeamKitColors } from "@/lib/lineup/team-kit-colors";
import { shirtPlayerName } from "@/lib/lineup/short-player-name";
import type { LineupSlot } from "@/lib/lineup/types";
import { cn } from "@/lib/utils";

type LineupPlayerChipProps = {
  slot: LineupSlot;
  teamName: string;
  onClick?: () => void;
  variant?: "default" | "modal";
};

export function LineupPlayerChip({
  slot,
  teamName,
  onClick,
  variant = "default",
}: LineupPlayerChipProps) {
  const isModal = variant === "modal";
  const kit = getTeamKitColors(teamName);
  const dorsal = slot.shirtNumber != null && slot.shirtNumber > 0 ? String(slot.shirtNumber) : "—";
  const interactive = Boolean(onClick) && !slot.isPlaceholder;
  const useKitColors = !slot.isPlaceholder;

  const content = (
    <>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center border shadow-sm",
          isModal
            ? "h-5 w-5 rounded-full"
            : "h-10 w-10 rounded-full sm:h-11 sm:w-11",
          slot.isPlaceholder && "border-dashed border-white/25 bg-black/30",
          interactive && "transition-transform active:scale-95"
        )}
        style={
          useKitColors
            ? {
                backgroundColor: kit.kit,
                borderColor: kit.border,
              }
            : undefined
        }
      >
        <span
          className={cn(
            "font-display font-bold leading-none",
            isModal ? "text-[7px]" : "text-sm sm:text-base",
            !useKitColors && "text-[var(--tm-accent)]"
          )}
          style={useKitColors ? { color: kit.dorsal } : undefined}
        >
          {dorsal}
        </span>
      </div>
      <div className="w-full rounded-md border border-white/10 bg-black/55 px-1 py-0.5 text-center backdrop-blur-sm">
        <p
          className={cn(
            "whitespace-normal text-center font-semibold leading-tight text-white",
            isModal ? "text-[8px]" : "text-[9px] sm:text-[10px]"
          )}
        >
          {shirtPlayerName(slot.name)}
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
