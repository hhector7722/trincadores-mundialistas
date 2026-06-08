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
        "w-full max-w-lg shrink-0 self-center px-1",
        position === "top" ? "pb-2" : "pt-2"
      )}
    >
      <h4 className="mb-2 flex min-h-7 items-center justify-center gap-2 text-sm font-semibold text-[var(--tm-fg)]">
        <TeamFlagBadge name={teamName} size="xs" />
        <span>{teamNameEs(teamName)}</span>
      </h4>
      <p className="text-sm leading-snug text-[var(--tm-fg)]">
        {players.map((player, index) => {
          const key = benchPlayerKey(teamName, player);
          const active = selectedKey === key;

          return (
            <span key={player.key}>
              {index > 0 ? ", " : null}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(key)}
                className={cn(
                  "inline text-left whitespace-nowrap transition-colors",
                  "hover:opacity-90 active:opacity-80",
                  active && "rounded-sm bg-[rgba(212,255,0,0.12)] px-0.5",
                  disabled && "opacity-60"
                )}
              >
                <span className="font-display font-bold text-[var(--tm-accent)]">
                  {player.shirtNumber ?? "—"}
                </span>{" "}
                <span className={cn("hover:text-[var(--tm-accent)]", active && "text-[var(--tm-accent)]")}>
                  {shortPlayerName(player.name)}
                </span>
              </button>
            </span>
          );
        })}
      </p>
    </section>
  );
}
