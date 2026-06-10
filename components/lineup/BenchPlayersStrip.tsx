"use client";

import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { mvpSelectionKey } from "@/lib/lineup/mvp-selection-key";
import type { BenchLayoutConfig } from "@/lib/lineup/fit-field-modal-layout";
import { squadDisplayNames } from "@/lib/lineup/short-player-name";
import type { BenchPlayer } from "@/lib/lineup/bench-players";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

export function benchPlayerKey(teamName: string, player: BenchPlayer): string {
  return mvpSelectionKey(teamName, player);
}

type BenchDensity = "default" | "compact" | "secondary" | "minimal" | "mvp";

type BenchPlayersStripProps = {
  teamName: string;
  players: BenchPlayer[];
  onPlayerClick: (player: BenchPlayer) => void;
  selectedKey?: string | null;
  disabled?: boolean;
  showTeamHeader?: boolean;
  formationLabel?: string;
  position?: "top" | "bottom" | "none";
  /** `secondary`: convocatoria legible en pantalla de alineación. `mvp`: rejilla compacta sin scroll. */
  density?: BenchDensity;
  /** Medidas calculadas por `useFitFieldModalLayout`. */
  gridLayout?: BenchLayoutConfig;
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
  formationLabel,
  position = "bottom",
  density,
  gridLayout,
  compact = false,
  className,
}: BenchPlayersStripProps) {
  if (players.length === 0) return null;

  const resolvedDensity: BenchDensity =
    density ?? (compact ? "compact" : "default");
  const labels = squadDisplayNames(players.map((player) => player.name));
  const isMvp = resolvedDensity === "mvp";
  const isSecondary = resolvedDensity === "secondary";
  const isMinimal = resolvedDensity === "minimal";
  const isCompact = resolvedDensity === "compact" || isMinimal;
  const useFitGrid = Boolean(gridLayout && gridLayout.columns > 0);

  return (
    <section
      className={cn(
        "w-full shrink-0 self-center overflow-hidden",
        isMvp || isSecondary ? "max-w-full px-0" : isMinimal ? "max-w-full px-0 opacity-80" : "max-w-lg px-0.5",
        position === "top" && (isMvp || isSecondary || isMinimal ? "pb-0.5" : isCompact ? "pb-0.5" : "pb-1"),
        position === "bottom" && (isMvp || isSecondary || isMinimal ? "pt-0.5" : isCompact ? "pt-0.5" : "pt-1"),
        className
      )}
      style={useFitGrid ? { height: gridLayout!.heightPx } : undefined}
    >
      {showTeamHeader && (isMvp || !isMinimal) ? (
        <h4
          className={cn(
            "flex items-center justify-center gap-1 font-medium text-[var(--tm-muted)]",
            isMvp
              ? "sr-only"
              : isSecondary
                ? "mb-1 min-h-4 text-[10px]"
                : isCompact
                  ? "mb-0.5 min-h-4 text-[9px]"
                  : "mb-1 min-h-5 text-[10px]"
          )}
        >
          <TeamFlagBadge name={teamName} size="xs" />
          <span>{teamNameEs(teamName)}</span>
          {formationLabel ? (
            <>
              <span aria-hidden>·</span>
              <span className="font-semibold text-[var(--tm-fg)]">{formationLabel}</span>
            </>
          ) : null}
        </h4>
      ) : showTeamHeader && isMinimal ? (
        <h4 className="sr-only">{teamNameEs(teamName)} — suplentes</h4>
      ) : !showTeamHeader && !isMinimal && !isMvp ? (
        <h4
          className={cn(
            "text-center font-medium text-[var(--tm-muted)]",
            isSecondary ? "mb-1 text-[10px]" : isCompact ? "mb-0.5 text-[9px]" : "mb-1 text-[10px]"
          )}
        >
          Resto de convocatoria ({players.length})
        </h4>
      ) : null}

      <div
        className={cn(
          useFitGrid
            ? "grid h-full gap-x-0.5 gap-y-0.5 overflow-hidden"
            : isMvp
              ? "grid grid-cols-6 gap-x-1 gap-y-0.5 overflow-hidden sm:grid-cols-7"
              : isSecondary
                ? "grid grid-cols-6 gap-x-1 gap-y-1 overflow-hidden sm:grid-cols-8"
                : isMinimal
                  ? "flex flex-wrap justify-center gap-0.5 overflow-hidden"
                  : cn(
                      "grid gap-x-0.5 gap-y-0.5 overflow-hidden",
                      isCompact ? "grid-cols-8 sm:grid-cols-10" : "grid-cols-6 sm:grid-cols-8"
                    )
        )}
        style={
          useFitGrid
            ? {
                gridTemplateColumns: `repeat(${gridLayout!.columns}, minmax(0, 1fr))`,
              }
            : undefined
        }
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
                "flex w-full flex-col items-center justify-center text-center transition-colors",
                isMvp || useFitGrid
                  ? "min-h-0 rounded-sm px-0 py-0"
                  : isSecondary
                    ? "min-h-10 w-full rounded-md px-0.5 py-0.5"
                    : isMinimal
                      ? "min-h-9 min-w-[2.5rem] shrink-0 px-0.5 py-0"
                      : isCompact
                        ? "min-h-10 w-full px-0.5 py-0.5"
                        : "min-h-6 w-full px-0.5 py-0.5",
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
                  !(useFitGrid || isMvp) &&
                    (isSecondary
                      ? "text-[11px]"
                      : isMinimal
                        ? "text-[8px]"
                        : isCompact
                          ? "text-[8px]"
                          : "text-[9px]"),
                  active ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]"
                )}
                style={
                  useFitGrid
                    ? { fontSize: gridLayout!.numberFontPx }
                    : isMvp
                      ? { fontSize: 10 }
                      : undefined
                }
              >
                {player.shirtNumber ?? "—"}
              </span>
              <span
                className={cn(
                  "whitespace-normal break-words text-center leading-tight",
                  !(useFitGrid || isMvp) &&
                    (isSecondary
                      ? "mt-0.5 text-[9px] font-medium leading-snug"
                      : isMinimal
                        ? "mt-0 text-[7px] leading-none"
                        : isCompact
                          ? "mt-0 text-[7px]"
                          : "mt-0.5 text-[8px]"),
                  active
                    ? "text-[var(--tm-accent)]"
                    : isSecondary
                      ? "text-[var(--tm-fg)]/85"
                      : "text-[var(--tm-muted)]"
                )}
                style={
                  useFitGrid
                    ? { fontSize: gridLayout!.nameFontPx, fontWeight: isSecondary ? 500 : 400 }
                    : isMvp
                      ? { fontSize: 9, fontWeight: 500 }
                      : undefined
                }
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
