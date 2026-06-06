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
  className?: string;
};

export function GroupStandingsTable({ group, compact = false, className }: GroupStandingsTableProps) {
  return (
    <div className={cn("overflow-x-auto", compact ? "px-1 pb-1" : "px-3 pb-4 sm:px-4", className)}>
      <table
        className={cn(
          "w-full border-collapse",
          compact ? "min-w-0 text-[8px] leading-tight sm:text-[9px]" : "min-w-[20rem] text-[11px] sm:text-xs"
        )}
      >
        <thead>
          <tr className="text-[var(--tm-muted)]">
            <th className={cn("pr-1 text-left font-medium", compact ? "pb-0.5" : "pb-2 pr-2")}>
              Equipo
            </th>
            {GROUP_STANDINGS_STAT_COLUMNS.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-0.5 text-center font-medium tabular-nums",
                  compact ? "pb-0.5" : "pb-2"
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
              <td className={cn(compact ? "py-0.5 pr-1" : "py-2 pr-2")}>
                <div className="flex min-w-0 items-center gap-0.5">
                  <TeamFlagBadge
                    name={row.team}
                    size={compact ? "xxs" : "xs"}
                    className="shrink-0"
                  />
                  <span className={cn("truncate font-medium", compact && "max-w-[3.5rem]")}>
                    {compact ? row.team.slice(0, 3).toUpperCase() : teamNameEs(row.team)}
                  </span>
                </div>
              </td>
              <td
                className={cn(
                  "px-0.5 text-center font-semibold tabular-nums text-[var(--tm-accent)]",
                  compact ? "py-0.5" : "py-2"
                )}
              >
                {row.pts}
              </td>
              <td className={cn("px-0.5 text-center tabular-nums", compact ? "py-0.5" : "py-2")}>
                {row.pj}
              </td>
              <td className={cn("px-0.5 text-center tabular-nums", compact ? "py-0.5" : "py-2")}>
                {row.pg}
              </td>
              <td className={cn("px-0.5 text-center tabular-nums", compact ? "py-0.5" : "py-2")}>
                {row.pe}
              </td>
              <td className={cn("px-0.5 text-center tabular-nums", compact ? "py-0.5" : "py-2")}>
                {row.pp}
              </td>
              <td className={cn("px-0.5 text-center tabular-nums", compact ? "py-0.5" : "py-2")}>
                {row.gf}
              </td>
              <td className={cn("px-0.5 text-center tabular-nums", compact ? "py-0.5" : "py-2")}>
                {row.gc}
              </td>
              <td className={cn("px-0.5 text-center tabular-nums", compact ? "py-0.5" : "py-2")}>
                {formatGroupDg(row.dg)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
