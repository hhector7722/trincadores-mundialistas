"use client";

import { shirtPlayerName } from "@/lib/lineup/short-player-name";
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
        "w-full shrink-0 px-1",
        position === "top" ? "pb-1.5" : "pt-1.5"
      )}
    >
      <p className="mb-1.5 truncate text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--tm-muted)]">
        Reservas {teamNameEs(teamName)}
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
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
                "flex min-h-10 min-w-[3.75rem] max-w-[5.25rem] flex-col items-center justify-center gap-0.5 rounded-lg border px-1.5 py-1 text-center transition-colors",
                active
                  ? "border-[var(--tm-accent)] bg-[rgba(212,255,0,0.12)]"
                  : "border-[var(--tm-border)] bg-[rgba(111,43,255,0.08)] hover:bg-[rgba(111,43,255,0.16)]",
                disabled && "opacity-60"
              )}
            >
              <span className="font-display text-[13px] font-bold leading-none text-[var(--tm-accent)]">
                {player.shirtNumber ?? "—"}
              </span>
              <span className="w-full truncate text-[9px] font-medium leading-tight text-[var(--tm-fg)]">
                {shirtPlayerName(player.name)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
