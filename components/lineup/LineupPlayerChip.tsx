import { getTeamKitColors } from "@/lib/lineup/team-kit-colors";
import { shirtPlayerName } from "@/lib/lineup/short-player-name";
import type { LineupSlot } from "@/lib/lineup/types";
import { cn } from "@/lib/utils";

type LineupPlayerChipProps = {
  slot: LineupSlot;
  teamName: string;
  onClick?: () => void;
  variant?: "default" | "modal" | "match";
  selected?: boolean;
  disabled?: boolean;
};

export function LineupPlayerChip({
  slot,
  teamName,
  onClick,
  variant = "default",
  selected = false,
  disabled = false,
}: LineupPlayerChipProps) {
  const isModal = variant === "modal";
  const isMatch = variant === "match";
  const kit = getTeamKitColors(teamName);
  const dorsal = slot.shirtNumber != null && slot.shirtNumber > 0 ? String(slot.shirtNumber) : "—";
  const interactive = Boolean(onClick) && !slot.isPlaceholder && !disabled;
  const useKitColors = !slot.isPlaceholder;
  const jerseyFill = useKitColors ? kit.kit : "rgba(0,0,0,0.3)";
  const jerseyStroke = useKitColors ? kit.border : "rgba(255,255,255,0.25)";
  const dorsalColor = useKitColors ? kit.dorsal : "var(--tm-accent)";

  const content = (
    <>
      <svg
        viewBox="0 3 48 45"
        aria-hidden
        className={cn(
          "block shrink-0",
          isMatch
            ? "h-[3rem] w-[2.4375rem] sm:h-[3.25rem] sm:w-[2.625rem]"
            : isModal
              ? "h-[38px] w-[32px]"
              : "h-[4.25rem] w-[3.25rem] sm:h-[4.75rem] sm:w-14",
          interactive && "transition-transform active:scale-95"
        )}
      >
        <path
          d="M24 4.5C18.8 4.5 15 7 13.4 10.6L6.8 13.2 3 21.8 8.4 23.4V47.5H39.6V23.4L45 21.8 41.2 13.2 34.6 10.6C33 7 29.2 4.5 24 4.5Zm0 3.2c2.6 0 4.7 1 5.9 2.7-1.4-.8-3-1.2-5.9-1.2s-4.5.4-5.9 1.2c1.2-1.7 3.3-2.7 5.9-2.7Z"
          fill={jerseyFill}
          stroke={jerseyStroke}
          strokeWidth="1.2"
          strokeLinejoin="round"
          strokeDasharray={slot.isPlaceholder ? "2.5 2" : undefined}
        />
        <text
          x="24"
          y="29"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={dorsalColor}
          fontSize={isMatch ? "13" : isModal ? "14" : "19"}
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {dorsal}
        </text>
      </svg>
      <div
        className={cn(
          "-mt-px w-full rounded-md border bg-black/55 text-center backdrop-blur-sm",
          isMatch ? "px-1 py-0.5" : "px-1 py-0.5",
          selected ? "border-[var(--tm-accent)]" : "border-white/10"
        )}
      >
        <p
          className={cn(
            "whitespace-normal text-center font-semibold leading-tight text-white",
            isMatch ? "text-[8px] sm:text-[9px]" : isModal ? "text-[8px]" : "text-[9px] sm:text-[10px]"
          )}
        >
          {shirtPlayerName(slot.name)}
        </p>
        {!isModal && !isMatch ? (
          <p className="text-[8px] font-medium uppercase tracking-wide text-white/55 sm:text-[9px]">
            {slot.positionLabel}
          </p>
        ) : null}
      </div>
    </>
  );

  const shellClass = cn(
    "flex shrink-0 flex-col items-center gap-0",
    isMatch
      ? "w-[3.5rem] min-h-10 sm:w-[3.75rem] sm:min-h-11"
      : isModal
        ? "w-[3.5rem] min-h-9"
        : "w-[4.5rem] min-h-12 sm:w-[5.25rem]",
    slot.isPlaceholder && "opacity-70",
    disabled && "opacity-60"
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
