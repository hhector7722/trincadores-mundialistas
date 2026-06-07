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
  const jerseyFill = useKitColors ? kit.kit : "rgba(0,0,0,0.3)";
  const jerseyStroke = useKitColors ? kit.border : "rgba(255,255,255,0.25)";
  const dorsalColor = useKitColors ? kit.dorsal : "var(--tm-accent)";

  const content = (
    <>
      <svg
        viewBox="0 0 48 52"
        aria-hidden
        className={cn(
          "shrink-0",
          isModal ? "h-[22px] w-[18px]" : "h-11 w-9 sm:h-12 sm:w-10",
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
          fontSize={isModal ? "12" : "17"}
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {dorsal}
        </text>
      </svg>
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
