import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import type { GroupStandingRow } from "@/lib/pool/group-standings";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type CalendarGroupsPanelProps = {
  groups: GroupStandingRow[];
  gridColumn: string;
  gridRow: number;
  className?: string;
  onGroupClick?: (groupCode: string) => void;
};

export function CalendarGroupsPanel({
  groups,
  gridColumn,
  gridRow,
  className,
  onGroupClick,
}: CalendarGroupsPanelProps) {
  const style: CSSProperties = {
    gridColumn,
    gridRow,
  };

  return (
    <div
      style={style}
      className={cn(
        "tm-cal-groups-panel tm-cal-dock-surface tm-surface-fade flex h-full min-h-0 min-w-0 flex-col overflow-hidden backdrop-blur-xl",
        className
      )}
      aria-label="Clasificación de grupos"
    >
      <p className="tm-cal-groups-title shrink-0 text-center font-display font-semibold uppercase tracking-wide text-[var(--tm-accent)]">
        GRUPOS
      </p>
      <div className="tm-cal-groups-list min-h-0 flex-1 overflow-hidden">
        {groups.map((group) => (
          <button
            key={group.code}
            type="button"
            onClick={() => onGroupClick?.(group.code)}
            className="tm-cal-group-card flex min-h-0 w-full min-w-0 shrink-0 touch-manipulation items-center transition-colors hover:bg-[rgba(111,43,255,0.22)] active:bg-[rgba(111,43,255,0.28)]"
            aria-label={`Ver clasificación del grupo ${group.code}`}
          >
            <span className="tm-cal-group-letter shrink-0 font-display font-medium text-[var(--tm-fg)]">
              {group.code}
            </span>
            <div className="tm-cal-group-flags flex min-w-0 flex-1 items-center">
              {group.teams.map((team) => (
                <TeamFlagBadge
                  key={`${group.code}-${team}`}
                  name={team}
                  size="cal"
                  className="tm-cal-group-flag pointer-events-none shrink-0"
                />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
