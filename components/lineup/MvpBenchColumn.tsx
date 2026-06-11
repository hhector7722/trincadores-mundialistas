"use client";

import { SubstitutionMarkerIcon } from "@/components/live/SubstitutionMarkerIcon";
import { substitutionMarkerForPlayer } from "@/lib/live/substitution-markers";
import type { SubstitutionMarkers } from "@/lib/live/types";
import {
  mvpPlayersMatch,
  mvpSelectionKey,
  type MvpSelectablePlayer,
} from "@/lib/lineup/mvp-selection-key";
import type { BenchLayoutConfig } from "@/lib/lineup/fit-mvp-horizontal-layout";
import { squadDisplayNames } from "@/lib/lineup/short-player-name";
import type { BenchPlayer } from "@/lib/lineup/bench-players";
import { cn } from "@/lib/utils";

type MvpBenchColumnProps = {
  teamName: string;
  players: BenchPlayer[];
  onPlayerClick: (player: BenchPlayer) => void;
  selectedKey?: string | null;
  selectedPlayer?: (MvpSelectablePlayer & { teamName: string }) | null;
  disabled?: boolean;
  readOnly?: boolean;
  align?: "left" | "right";
  gridLayout?: BenchLayoutConfig;
  substitutionMarkers?: SubstitutionMarkers | null;
  className?: string;
};

export function MvpBenchColumn({
  teamName,
  players,
  onPlayerClick,
  selectedKey = null,
  selectedPlayer = null,
  disabled,
  readOnly = false,
  align = "left",
  gridLayout,
  substitutionMarkers = null,
  className,
}: MvpBenchColumnProps) {
  if (players.length === 0) return null;

  const labels = squadDisplayNames(players.map((player) => player.name));
  const fontPx = gridLayout?.nameFontPx ?? 10;

  return (
    <section
      className={cn(
        "min-w-0 shrink-0 overflow-hidden",
        align === "right" ? "text-right" : "text-left",
        className
      )}
      style={gridLayout?.heightPx ? { minHeight: gridLayout.heightPx } : undefined}
    >
      <p
        className={cn(
          "m-0 w-full leading-none",
          align === "left" ? "text-left" : "text-right"
        )}
        style={{ fontSize: fontPx, lineHeight: 1.1 }}
      >
        {players.map((player, index) => {
          const key = mvpSelectionKey(teamName, player);
          const active = selectedPlayer
            ? mvpPlayersMatch(teamName, player, selectedPlayer)
            : selectedKey === key;
          const dorsal = player.shirtNumber ?? "—";
          const subMarker = substitutionMarkers
            ? substitutionMarkerForPlayer(player.name, player.shirtNumber, substitutionMarkers)
            : null;

          return (
            <span key={key} className="inline">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPlayerClick(player)}
                className={cn(
                  "inline min-h-0 px-0.5 py-0 align-baseline transition-colors",
                  !readOnly && "touch-manipulation hover:opacity-90 active:opacity-80",
                  readOnly && "pointer-events-none cursor-default",
                  disabled && "opacity-60"
                )}
              >
                <span className="font-display font-bold text-[var(--tm-accent)]">{dorsal}</span>
                {active ? (
                  <span className="inline-block rounded border border-[var(--tm-accent)] bg-[var(--tm-accent)] px-0.5 font-bold leading-none text-[var(--tm-primary-fg)]">
                    {" "}
                    {labels[index]}
                  </span>
                ) : (
                  <span className="font-medium text-[var(--tm-fg)]/90">
                    {" "}
                    {labels[index]}
                  </span>
                )}
                {subMarker ? (
                  <>
                    {" "}
                    <SubstitutionMarkerIcon kind={subMarker} />
                  </>
                ) : null}
              </button>
              {index < players.length - 1 ? (
                <span className="text-[var(--tm-muted)]" aria-hidden>
                  ,{" "}
                </span>
              ) : null}
            </span>
          );
        })}
      </p>
    </section>
  );
}
