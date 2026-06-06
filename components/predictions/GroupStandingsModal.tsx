"use client";

import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { Modal } from "@/components/ui/modal";
import type { GroupStandingDetail } from "@/lib/pool/group-standings";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type GroupStandingsModalProps = {
  open: boolean;
  onClose: () => void;
  group: GroupStandingDetail | null;
};

const STAT_COLUMNS = [
  { key: "pts", label: "PTS" },
  { key: "pj", label: "PJ" },
  { key: "pg", label: "PG" },
  { key: "pe", label: "PE" },
  { key: "pp", label: "PP" },
  { key: "gf", label: "GF" },
  { key: "gc", label: "GC" },
  { key: "dg", label: "DG" },
] as const;

function formatDg(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function GroupStandingsModal({ open, onClose, group }: GroupStandingsModalProps) {
  if (!group) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Grupo ${group.code}`}
      hideHeaderDivider
      backdropClassName="bg-[#2a1058]/40 backdrop-blur-[2px]"
    >
      <div className="overflow-x-auto px-3 pb-4 sm:px-4">
        <table className="w-full min-w-[20rem] border-collapse text-[11px] sm:text-xs">
          <thead>
            <tr className="text-[var(--tm-muted)]">
              <th className="pb-2 pr-2 text-left font-medium">Equipo</th>
              {STAT_COLUMNS.map((col) => (
                <th key={col.key} className="px-0.5 pb-2 text-center font-medium tabular-nums">
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
                <td className="py-2 pr-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <TeamFlagBadge name={row.team} size="xs" className="shrink-0" />
                    <span className="truncate font-medium">{teamNameEs(row.team)}</span>
                  </div>
                </td>
                <td className="px-0.5 py-2 text-center font-semibold tabular-nums text-[var(--tm-accent)]">
                  {row.pts}
                </td>
                <td className="px-0.5 py-2 text-center tabular-nums">{row.pj}</td>
                <td className="px-0.5 py-2 text-center tabular-nums">{row.pg}</td>
                <td className="px-0.5 py-2 text-center tabular-nums">{row.pe}</td>
                <td className="px-0.5 py-2 text-center tabular-nums">{row.pp}</td>
                <td className="px-0.5 py-2 text-center tabular-nums">{row.gf}</td>
                <td className="px-0.5 py-2 text-center tabular-nums">{row.gc}</td>
                <td className="px-0.5 py-2 text-center tabular-nums">{formatDg(row.dg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
