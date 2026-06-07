import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import type { GroupStandingDetail } from "@/lib/pool/group-standings";
import { teamAbbr, teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

export const GROUP_STANDINGS_STAT_COLUMNS = [
  { key: "pts", label: "PTS" },
  { key: "pj", label: "PJ" },
  { key: "pg", label: "PG" },
  { key: "pe", label: "PE" },
  { key: "pp", label: "PP" },
  { key: "gf", label: "GF" },
  { key: "gc", label: "GC" },
  { key: "dg", label: "DG" },
] as const;

export function formatGroupDg(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

type GroupStandingsTableProps = {
  group: GroupStandingDetail;
  compact?: boolean;
  variant?: "default" | "grid";
  className?: string;
  onTeamClick?: (teamName: string) => void;
};

export function GroupStandingsTable({
  group,
  compact = false,
  variant = "default",
  className,
  onTeamClick,
}: GroupStandingsTableProps) {
  const isGrid = variant === "grid";
  const isCompact = compact || isGrid;

  function renderTeamCell(row: GroupStandingDetail["teams"][number]) {
    const fullName = teamNameEs(row.team);
    const abbr = teamAbbr(row.team);
    const flagSize = isGrid ? "xxs" : isCompact ? "xxs" : "xs";
    const displayLabel = isGrid || isCompact ? abbr : fullName;

    const inner = (
      <>
        <TeamFlagBadge
          name={row.team}
          size={flagSize}
          className={cn("shrink-0", isGrid && "mx-auto")}
        />
        <span
          className={cn(
            "font-medium leading-tight",
            isGrid
              ? "max-w-[3rem] truncate text-center text-[7px] font-semibold uppercase tracking-wide sm:max-w-[3.25rem] sm:text-[8px]"
              : cn("truncate", isCompact && "max-w-[3.5rem] text-[8px]", !isCompact && "text-[11px] sm:text-xs")
          )}
        >
          {displayLabel}
        </span>
      </>
    );

    const cellClass = cn(
      "flex min-w-0 items-center",
      isGrid ? "flex-col gap-0.5 px-0.5" : "gap-0.5"
    );

    if (onTeamClick) {
      return (
        <button
          type="button"
          onClick={() => onTeamClick(row.team)}
          className={cn(
            cellClass,
            "rounded-md transition-colors hover:bg-[rgba(111,43,255,0.16)]",
            isGrid ? "w-full py-0.5" : "p-0.5"
          )}
          aria-label={`Ver alineación de ${fullName}`}
        >
          {inner}
        </button>
      );
    }

    return <div className={cellClass}>{inner}</div>;
  }

  return (
    <div
      className={cn(
        isGrid ? "flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-visible px-1 pb-1" : "overflow-x-auto",
        !isGrid && (isCompact ? "px-1 pb-1" : "px-3 pb-4 sm:px-4"),
        className
      )}
    >
      <table
        className={cn(
          "w-full border-collapse",
          isGrid
            ? "min-w-0 flex-1 text-[8px] leading-tight sm:text-[9px]"
            : isCompact
              ? "min-w-0 text-[8px] leading-tight sm:text-[9px]"
              : "min-w-[20rem] text-[11px] sm:text-xs"
        )}
      >
        <thead>
          <tr className="text-[var(--tm-muted)]">
            <th
              className={cn(
                "font-medium",
                isGrid
                  ? "min-w-[3.25rem] pb-0.5 text-center sm:min-w-[3.75rem]"
                  : cn("text-left", isCompact ? "pb-0.5 pr-1" : "pb-2 pr-2")
              )}
            >
              {isGrid ? "Sel." : "Equipo"}
            </th>
            {GROUP_STANDINGS_STAT_COLUMNS.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-px text-center font-medium tabular-nums",
                  isGrid ? "pb-0.5" : isCompact ? "pb-0.5" : "pb-2"
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group.teams.map((row, index) => (
            <tr
              key={row.team}
              className={cn(
                "border-t border-[var(--tm-border)]",
                index === 0 && "text-[var(--tm-fg)]"
              )}
            >
              <td className={cn(isGrid ? "py-0.5 pr-0 align-top" : isCompact ? "py-0.5 pr-1" : "py-2 pr-2")}>
                {renderTeamCell(row)}
              </td>
              <td
                className={cn(
                  "text-center font-semibold tabular-nums text-[var(--tm-accent)]",
                  isGrid ? "px-px py-0.5" : isCompact ? "px-0.5 py-0.5" : "px-0.5 py-2"
                )}
              >
                {row.pts}
              </td>
              <td
                className={cn(
                  "text-center tabular-nums",
                  isGrid ? "px-px py-0.5" : isCompact ? "px-0.5 py-0.5" : "px-0.5 py-2"
                )}
              >
                {row.pj}
              </td>
              <td
                className={cn(
                  "text-center tabular-nums",
                  isGrid ? "px-px py-0.5" : isCompact ? "px-0.5 py-0.5" : "px-0.5 py-2"
                )}
              >
                {row.pg}
              </td>
              <td
                className={cn(
                  "text-center tabular-nums",
                  isGrid ? "px-px py-0.5" : isCompact ? "px-0.5 py-0.5" : "px-0.5 py-2"
                )}
              >
                {row.pe}
              </td>
              <td
                className={cn(
                  "text-center tabular-nums",
                  isGrid ? "px-px py-0.5" : isCompact ? "px-0.5 py-0.5" : "px-0.5 py-2"
                )}
              >
                {row.pp}
              </td>
              <td
                className={cn(
                  "text-center tabular-nums",
                  isGrid ? "px-px py-0.5" : isCompact ? "px-0.5 py-0.5" : "px-0.5 py-2"
                )}
              >
                {row.gf}
              </td>
              <td
                className={cn(
                  "text-center tabular-nums",
                  isGrid ? "px-px py-0.5" : isCompact ? "px-0.5 py-0.5" : "px-0.5 py-2"
                )}
              >
                {row.gc}
              </td>
              <td
                className={cn(
                  "text-center tabular-nums",
                  isGrid ? "px-px py-0.5" : isCompact ? "px-0.5 py-0.5" : "px-0.5 py-2"
                )}
              >
                {formatGroupDg(row.dg)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
