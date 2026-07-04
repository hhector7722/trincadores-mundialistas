"use client";

import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { mvpSelectionKey } from "@/lib/lineup/mvp-selection-key";
import type { BenchLayoutConfig } from "@/lib/lineup/fit-field-modal-layout";
import { squadDisplayNames } from "@/lib/lineup/short-player-name";
import { PlayerSticker } from "@/components/players/player-sticker";
import type { BenchPlayer } from "@/lib/lineup/bench-players";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

export function benchPlayerKey(teamName: string, player: BenchPlayer): string {
  return mvpSelectionKey(teamName, player);
}

type BenchDensity = "default" | "compact" | "minimal" | "mvp" | "inline";

type BenchPlayersStripProps = {
  teamName: string;
  players: BenchPlayer[];
  onPlayerClick: (player: BenchPlayer) => void;
  selectedKey?: string | null;
  disabled?: boolean;
  showTeamHeader?: boolean;
  formationLabel?: string;
  position?: "top" | "bottom" | "none";
  /** `mvp`: rejilla compacta sin scroll; formación va en cabecera del modal. */
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

  const resolvedDensity: BenchDensity = density ?? (compact ? "compact" : "default");
  const labels = squadDisplayNames(players.map((player) => player.name));
  const isMvp = resolvedDensity === "mvp";
  const isInline = resolvedDensity === "inline";
  const isMinimal = resolvedDensity === "minimal";
  const isCompact = resolvedDensity === "compact" || isMinimal;
  const useFitGrid = Boolean(gridLayout && gridLayout.columns > 0);

  if (isInline) {
    const ordered = [...players]
      .map((player, index) => ({ player, label: labels[index]! }))
      .sort((a, b) => {
        const na = a.player.shirtNumber;
        const nb = b.player.shirtNumber;
        if (na == null && nb == null) return 0;
        if (na == null) return 1;
        if (nb == null) return -1;
        return na - nb;
      });

    const fontPx = gridLayout?.nameFontPx ?? 9;

    return (
      <section
        className={cn("w-full min-w-0 shrink-0 self-stretch", className)}
        style={gridLayout?.heightPx ? { minHeight: gridLayout.heightPx } : undefined}
      >
        <p
          className="m-0 w-full text-left leading-snug text-[var(--tm-fg)]"
          style={{ fontSize: fontPx, lineHeight: 1.25 }}
        >
          {ordered.map(({ player, label }, index) => {
            const key = benchPlayerKey(teamName, player);
            const active = selectedKey === key;

            return (
              <span key={key}>
                {index > 0 ? ", " : null}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onPlayerClick(player)}
                  className={cn(
                    "inline text-left whitespace-nowrap transition-colors",
                    "hover:opacity-90 active:opacity-80",
                    disabled && "opacity-60"
                  )}
                >
                  <span className="font-display font-bold text-[var(--tm-accent)]">
                    {player.shirtNumber ?? "—"}
                  </span>{" "}
                  <span className={cn(active ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]")}>
                    {label}
                  </span>
                </button>
              </span>
            );
          })}
        </p>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "w-full shrink-0 self-center overflow-hidden",
        isMvp ? "max-w-full px-0" : isMinimal ? "max-w-full px-0 opacity-75" : "max-w-lg px-0.5",
        position === "top" && (isMvp || isMinimal ? "pb-0" : isCompact ? "pb-0.5" : "pb-1"),
        position === "bottom" && (isMvp || isMinimal ? "pt-0" : isCompact ? "pt-0.5" : "pt-1"),
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
            isCompact ? "mb-0.5 text-[9px]" : "mb-1 text-[10px]"
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
              : isMinimal
                ? "flex flex-wrap justify-center gap-px overflow-hidden"
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
                  : isMinimal
                    ? "min-h-9 min-w-[2.35rem] shrink-0 px-0.5 py-0"
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
              {player.stickerUrl ? (
                <PlayerSticker 
                  player={{ sticker_url: player.stickerUrl, player_name: player.name }}
                  className="mb-0.5"
                  width={isMinimal ? 24 : 32}
                  height={isMinimal ? 24 : 32}
                />
              ) : (
                <span
                  className={cn(
                    "font-display font-bold leading-none",
                    !(useFitGrid || isMvp) && (isMinimal ? "text-[7px]" : isCompact ? "text-[8px]" : "text-[9px]"),
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
              )}
              <span
                className={cn(
                  "whitespace-normal text-center leading-tight",
                  !(useFitGrid || isMvp) && (isMinimal ? "mt-0 text-[6px] leading-none" : isCompact ? "mt-0 text-[7px]" : "mt-0.5 text-[8px]"),
                  active ? "text-[var(--tm-accent)]" : "text-[var(--tm-muted)]"
                )}
                style={
                  useFitGrid
                    ? { fontSize: gridLayout!.nameFontPx }
                    : isMvp
                      ? { fontSize: 8 }
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
