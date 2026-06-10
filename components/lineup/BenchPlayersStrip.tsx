"use client";

import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { mvpSelectionKey } from "@/lib/lineup/mvp-selection-key";
import { squadDisplayNames } from "@/lib/lineup/short-player-name";
import type { BenchPlayer } from "@/lib/lineup/bench-players";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

export function benchPlayerKey(teamName: string, player: BenchPlayer): string {
  return mvpSelectionKey(teamName, player);
}

type BenchDensity = "default" | "compact" | "minimal";

type BenchPlayersStripProps = {
  teamName: string;
  players: BenchPlayer[];
  onPlayerClick: (player: BenchPlayer) => void;
  selectedKey?: string | null;
  disabled?: boolean;
  showTeamHeader?: boolean;
  position?: "top" | "bottom" | "none";
  /** `compact`: grid reducido. `minimal`: fila única para modal MVP. */
  density?: BenchDensity;
  /** @deprecated Usar density="compact" */
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
  density,
  compact = false,
  className,
}: BenchPlayersStripProps) {
  if (players.length === 0) return null;

  const resolvedDensity: BenchDensity = density ?? (compact ? "compact" : "default");
  const labels = squadDisplayNames(players.map((player) => player.name));
  const isMinimal = resolvedDensity === "minimal";
  const isCompact = resolvedDensity === "compact" || isMinimal;

  return (
    <section
      className={cn(
        "w-full shrink-0 self-center",
        isMinimal ? "max-w-full px-0 opacity-75" : "max-w-lg px-0.5",
        position === "top" && (isMinimal ? "pb-0" : isCompact ? "pb-0.5" : "pb-1"),
        position === "bottom" && (isMinimal ? "pt-0" : isCompact ? "pt-0.5" : "pt-1"),
        className
      )}
    >
      {showTeamHeader && !isMinimal ? (
        <h4
          className={cn(
            "flex items-center justify-center gap-1 font-medium text-[var(--tm-muted)]",
            isCompact ? "mb-0.5 min-h-4 text-[9px]" : "mb-1 min-h-5 text-[10px]"
          )}
        >
          <TeamFlagBadge name={teamName} size="xs" />
          <span>{teamNameEs(teamName)}</span>
        </h4>
      ) : showTeamHeader && isMinimal ? (
        <h4 className="sr-only">{teamNameEs(teamName)} — suplentes</h4>
      ) : !showTeamHeader && !isMinimal ? (
        <h4
          className={cn(
            "text-center font-medium text-[var(--tm-muted)]",
            isCompact ? "mb-0.5 text-[9px]" : "mb-1 text-[10px]"
          )}
        >
          Resto de convocatoria ({players.length})
        </h4>
      ) : null}

      <div
        className={cn(
          isMinimal
            ? "flex gap-px overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : cn(
                "grid gap-x-0.5 gap-y-0.5",
                isCompact
                  ? "max-h-[3rem] grid-cols-8 overflow-y-auto overscroll-contain sm:grid-cols-10"
                  : "grid-cols-6 sm:grid-cols-8"
              )
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
                "flex shrink-0 flex-col items-center justify-center text-center transition-colors",
                isMinimal
                  ? "min-h-9 min-w-[2.35rem] px-0.5 py-0"
                  : isCompact
                    ? "min-h-10 w-full px-0.5 py-0.5"
                    : "min-h-6 w-full px-0.5 py-0.5",
                "hover:opacity-90 active:opacity-80",
                active && "rounded-sm bg-[rgba(212,255,0,0.1)]",
                disabled && "opacity-60"
              )}
            >
              <span
                className={cn(
                  isMinimal ? "text-[7px]" : isCompact ? "text-[8px]" : "text-[9px]",
                  "font-display font-medium leading-none text-[var(--tm-subtle)]",
                  active && "text-[var(--tm-accent)]"
                )}
              >
                {player.shirtNumber ?? "—"}
              </span>
              <span
                className={cn(
                  isMinimal ? "mt-0 text-[6px] leading-none" : isCompact ? "mt-0 text-[7px]" : "mt-0.5 text-[8px]",
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
