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
  /** Lista compacta con scroll para el modal MVP. */
  compact?: boolean;
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
  compact = false,
  className,
}: BenchPlayersStripProps) {
  if (players.length === 0) return null;

  const labels = squadDisplayNames(players.map((player) => player.name));

  return (
    <section
      className={cn(
        "w-full max-w-lg shrink-0 self-center px-0.5",
        position === "top" && (compact ? "pb-0.5" : "pb-1"),
        position === "bottom" && (compact ? "pt-0.5" : "pt-1"),
        className
      )}
    >
      {showTeamHeader ? (
        <h4
          className={cn(
            "flex items-center justify-center gap-1 font-medium text-[var(--tm-muted)]",
            compact ? "mb-0.5 min-h-4 text-[9px]" : "mb-1 min-h-5 text-[10px]"
          )}
        >
          <TeamFlagBadge name={teamName} size="xs" />
          <span>{teamNameEs(teamName)}</span>
        </h4>
      ) : (
        <h4
          className={cn(
            "text-center font-medium text-[var(--tm-muted)]",
            compact ? "mb-0.5 text-[9px]" : "mb-1 text-[10px]"
          )}
        >
          Resto de convocatoria ({players.length})
        </h4>
      )}
      <div
        className={cn(
          "grid gap-x-0.5 gap-y-0.5",
          compact ? "max-h-[3.75rem] grid-cols-8 overflow-y-auto overscroll-contain" : "grid-cols-6 sm:grid-cols-8"
        )}
      >
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
                "flex w-full flex-col items-center justify-center px-0.5 text-center transition-colors",
                compact ? "min-h-5 py-0" : "min-h-6 py-0.5",
                "hover:opacity-90 active:opacity-80",
                active && "rounded-sm bg-[rgba(212,255,0,0.1)]",
                disabled && "opacity-60"
              )}
            >
              <span
                className={cn(
                  compact ? "text-[8px]" : "text-[9px]",
                  "font-display font-medium leading-none text-[var(--tm-subtle)]",
                  active && "text-[var(--tm-accent)]"
                )}
              >
                {player.shirtNumber ?? "—"}
              </span>
              <span
                className={cn(
                  compact ? "mt-0 text-[7px]" : "mt-0.5 text-[8px]",
                  "leading-tight text-[var(--tm-muted)]",
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
