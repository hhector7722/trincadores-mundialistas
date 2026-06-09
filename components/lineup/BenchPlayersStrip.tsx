"use client";

import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { squadDisplayNames } from "@/lib/lineup/short-player-name";
import type { BenchPlayer } from "@/lib/lineup/bench-players";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

export function benchPlayerKey(teamName: string, player: BenchPlayer): string {
  return `${teamName}-${player.name}-${player.shirtNumber ?? "x"}`;
}

type BenchPlayersStripProps = {
  teamName: string;
  players: BenchPlayer[];
  onPlayerClick: (player: BenchPlayer) => void;
  selectedKey?: string | null;
  disabled?: boolean;
  showTeamHeader?: boolean;
  position?: "top" | "bottom" | "none";
  className?: string;
};

export function BenchPlayersStrip({
  teamName,
  players,
  onPlayerClick,
  selectedKey = null,
  disabled,
  showTeamHeader = true,
  position = "bottom",
  className,
}: BenchPlayersStripProps) {
  if (players.length === 0) return null;

  const labels = squadDisplayNames(players.map((player) => player.name));

  return (
    <section
      className={cn(
        "w-full max-w-lg shrink-0 self-center px-0.5",
        position === "top" && "pb-1",
        position === "bottom" && "pt-1",
        className
      )}
    >
      {showTeamHeader ? (
        <h4 className="mb-1 flex min-h-5 items-center justify-center gap-1 text-[10px] font-medium text-[var(--tm-muted)]">
          <TeamFlagBadge name={teamName} size="xs" />
          <span>{teamNameEs(teamName)}</span>
        </h4>
      ) : (
        <h4 className="mb-1 text-center text-[10px] font-medium text-[var(--tm-muted)]">
          Resto de convocatoria ({players.length})
        </h4>
      )}
      <div className="grid grid-cols-6 gap-x-0.5 gap-y-0.5 sm:grid-cols-8">
        {players.map((player, index) => {
          const key = benchPlayerKey(teamName, player);
          const active = selectedKey === key;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onPlayerClick(player)}
              className={cn(
                "flex w-full min-h-6 flex-col items-center justify-center px-0.5 py-0.5 text-center transition-colors",
                "hover:opacity-90 active:opacity-80",
                active && "rounded-sm bg-[rgba(212,255,0,0.1)]",
                disabled && "opacity-60"
              )}
            >
              <span
                className={cn(
                  "font-display text-[9px] font-medium leading-none text-[var(--tm-subtle)]",
                  active && "text-[var(--tm-accent)]"
                )}
              >
                {player.shirtNumber ?? "—"}
              </span>
              <span
                className={cn(
                  "mt-0.5 text-[8px] leading-tight text-[var(--tm-muted)]",
                  active && "text-[var(--tm-accent)]"
                )}
              >
                {labels[index]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
