import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamAbbr } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type TeamPickerGridItemProps = {
  team: string;
  ariaLabel: string;
  selected?: boolean;
  onClick: () => void;
};

/** Bandera + abreviatura sin mini-card; flota sobre el fondo del modal. */
export function TeamPickerGridItem({
  team,
  ariaLabel,
  selected = false,
  onClick,
}: TeamPickerGridItemProps) {
  return (
    <li className="flex min-w-0">
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={selected || undefined}
        className={cn(
          "flex w-full min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-1 text-center transition-opacity",
          "hover:opacity-80 active:opacity-70",
          selected && "opacity-100"
        )}
      >
        <TeamFlagBadge name={team} size="sm" className="shrink-0" />
        <span
          className={cn(
            "w-full min-w-0 truncate text-center text-[8px] font-semibold uppercase tracking-wide sm:text-[10px]",
            selected ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]"
          )}
        >
          {teamAbbr(team)}
        </span>
      </button>
    </li>
  );
}

export const TEAM_PICKER_GRID_CLASS =
  "grid grid-cols-6 items-start gap-x-2 gap-y-3 overflow-y-auto p-2.5 sm:gap-x-2.5 sm:gap-y-3.5 sm:p-3";
