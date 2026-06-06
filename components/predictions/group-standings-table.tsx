import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import type { GroupStandingDetail } from "@/lib/pool/group-standings";
import { teamNameEs } from "@/lib/teams/display";
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
};

export function GroupStandingsTable({
  group,
  compact = false,
  variant = "default",
  className,
}: GroupStandingsTableProps) {
  const isGrid = variant === "grid";
  const isCompact = compact || isGrid;

  return (
    <div
      className={cn(
        "overflow-x-auto",
        isGrid ? "px-0.5 pb-0.5" : isCompact ? "px-1 pb-1" : "px-3 pb-4 sm:px-4",
        className
      )}
    >
      <table
        className={cn(
          "w-full border-collapse",
          isGrid
            ? "min-w-0 text-[7px] leading-tight sm:text-[8px]"
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
                isGrid ? "w-5 pb-0.5 text-center" : cn("text-left", isCompact ? "pb-0.5 pr-1" : "pb-2 pr-2")
              )}
            >
              {isGrid ? " " : "Equipo"}
            </th>
            {GROUP_STANDINGS_STAT_COLUMNS.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-0.5 text-center font-medium tabular-nums",
                  isCompact ? "pb-0.5" : "pb-2"
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
              <td className={cn(isGrid ? "py-0.5 pr-0" : isCompact ? "py-0.5 pr-1" : "py-2 pr-2")}>
                <div
                  className={cn(
                    "flex min-w-0 items-center",
                    isGrid ? "justify-center" : "gap-0.5"
                  )}
                >
                  <TeamFlagBadge
                    name={row.team}
                    size={isGrid ? "xs" : isCompact ? "xxs" : "xs"}
                    className="shrink-0"
                  />
                  {!isGrid ? (
                    <span className={cn("truncate font-medium", isCompact && "max-w-[3.5rem]")}>
                      {isCompact ? row.team.slice(0, 3).toUpperCase() : teamNameEs(row.team)}
                    </span>
                  ) : null}
                </div>
              </td>
              <td
                className={cn(
                  "px-0.5 text-center font-semibold tabular-nums text-[var(--tm-accent)]",
                  isCompact ? "py-0.5" : "py-2"
                )}
              >
                {row.pts}
              </td>
              <td className={cn("px-0.5 text-center tabular-nums", isCompact ? "py-0.5" : "py-2")}>
                {row.pj}
              </td>
              <td className={cn("px-0.5 text-center tabular-nums", isCompact ? "py-0.5" : "py-2")}>
                {row.pg}
              </td>
              <td className={cn("px-0.5 text-center tabular-nums", isCompact ? "py-0.5" : "py-2")}>
                {row.pe}
              </td>
              <td className={cn("px-0.5 text-center tabular-nums", isCompact ? "py-0.5" : "py-2")}>
                {row.pp}
              </td>
              <td className={cn("px-0.5 text-center tabular-nums", isCompact ? "py-0.5" : "py-2")}>
                {row.gf}
              </td>
              <td className={cn("px-0.5 text-center tabular-nums", isCompact ? "py-0.5" : "py-2")}>
                {row.gc}
              </td>
              <td className={cn("px-0.5 text-center tabular-nums", isCompact ? "py-0.5" : "py-2")}>
                {formatGroupDg(row.dg)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
