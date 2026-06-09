"use client";

import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { shortPlayerName } from "@/lib/lineup/short-player-name";
import type { BenchPlayer } from "@/lib/lineup/bench-players";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type MvpBenchStripProps = {
  teamName: string;
  players: BenchPlayer[];
  selectedKey: string | null;
  disabled?: boolean;
  onSelect: (key: string) => void;
  position: "top" | "bottom";
};

function benchPlayerKey(teamName: string, player: BenchPlayer): string {
  return `${teamName}-${player.name}-${player.shirtNumber ?? "x"}`;
}

export function MvpBenchStrip({
  teamName,
  players,
  selectedKey,
  disabled,
  onSelect,
  position,
}: MvpBenchStripProps) {
  if (players.length === 0) return null;

  return (
    <section
      className={cn(
        "w-full max-w-lg shrink-0 self-center px-0.5",
        position === "top" ? "pb-1" : "pt-1"
      )}
    >
      <h4 className="mb-1 flex min-h-5 items-center justify-center gap-1 text-[10px] font-medium text-[var(--tm-muted)]">
        <TeamFlagBadge name={teamName} size="xs" />
        <span>{teamNameEs(teamName)}</span>
      </h4>
      <div className="grid grid-cols-6 gap-x-0.5 gap-y-0.5 sm:grid-cols-8">
        {players.map((player) => {
          const key = benchPlayerKey(teamName, player);
          const active = selectedKey === key;

          return (
            <button
              key={player.key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(key)}
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
                {shortPlayerName(player.name)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
