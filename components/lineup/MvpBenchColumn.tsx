"use client";

import { mvpSelectionKey } from "@/lib/lineup/mvp-selection-key";
import type { BenchLayoutConfig } from "@/lib/lineup/fit-mvp-horizontal-layout";
import { squadDisplayNames } from "@/lib/lineup/short-player-name";
import type { BenchPlayer } from "@/lib/lineup/bench-players";
import { cn } from "@/lib/utils";

type MvpBenchColumnProps = {
  teamName: string;
  players: BenchPlayer[];
  onPlayerClick: (player: BenchPlayer) => void;
  selectedKey?: string | null;
  disabled?: boolean;
  align?: "left" | "right";
  gridLayout?: BenchLayoutConfig;
  className?: string;
};

export function MvpBenchColumn({
  teamName,
  players,
  onPlayerClick,
  selectedKey = null,
  disabled,
  align = "left",
  gridLayout,
  className,
}: MvpBenchColumnProps) {
  if (players.length === 0) return null;

  const labels = squadDisplayNames(players.map((player) => player.name));
  const useFitGrid = Boolean(gridLayout && gridLayout.columns > 0);

  return (
    <section
      className={cn(
        "min-w-0 shrink-0 overflow-hidden",
        align === "right" ? "text-right" : "text-left",
        className
      )}
      style={useFitGrid ? { height: gridLayout!.heightPx } : undefined}
    >
      <div
        className={cn(
          "grid h-full gap-x-0.5 gap-y-0.5 overflow-hidden",
          align === "right" && "justify-items-end"
        )}
        style={
          useFitGrid
            ? {
                gridTemplateColumns: `repeat(${gridLayout!.columns}, minmax(0, 1fr))`,
              }
            : { gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }
        }
      >
        {players.map((player, index) => {
          const key = mvpSelectionKey(teamName, player);
          const active = selectedKey === key;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onPlayerClick(player)}
              className={cn(
                "flex min-h-0 w-full flex-col items-center justify-center rounded-sm px-0 py-0 text-center transition-colors",
                align === "right" && "items-end",
                "hover:opacity-90 active:opacity-80",
                active && "bg-[rgba(212,255,0,0.14)] ring-1 ring-[var(--tm-accent)]/40",
                disabled && "opacity-60"
              )}
              style={
                useFitGrid
                  ? { minHeight: gridLayout!.rowHeightPx, height: gridLayout!.rowHeightPx }
                  : undefined
              }
            >
              <span
                className={cn(
                  "font-display font-bold leading-none",
                  active ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]"
                )}
                style={{ fontSize: gridLayout?.numberFontPx ?? 10 }}
              >
                {player.shirtNumber ?? "—"}
              </span>
              <span
                className={cn(
                  "whitespace-normal break-words text-center leading-tight",
                  active ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]/85"
                )}
                style={{
                  fontSize: gridLayout?.nameFontPx ?? 9,
                  fontWeight: 500,
                }}
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
