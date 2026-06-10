"use client";

/**
 * @deprecated Campo MVP vertical legacy. Usar `MvpHorizontalFieldGraphic` (pipeline activo en `MvpPredictionPanel`).
 */

import { FootballPitchSurface } from "@/components/lineup/FootballPitchSurface";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import { MODAL_FIELD_WRAPPER_SCALE, MVP_PITCH_ASPECT_CLASS } from "@/lib/lineup/field-layout";
import { type MatchFieldSlot } from "@/lib/lineup/match-field-geometry";
import { mvpSelectionKey } from "@/lib/lineup/mvp-selection-key";
import { teamKitColorsClash } from "@/lib/lineup/team-kit-colors";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type MatchMvpFieldGraphicProps = {
  homeSlots: MatchFieldSlot[];
  awaySlots: MatchFieldSlot[];
  homeTeam: string;
  awayTeam: string;
  homeSquadPlayerNames?: string[];
  awaySquadPlayerNames?: string[];
  selectedKey: string | null;
  disabled?: boolean;
  onSelect: (key: string) => void;
  onFieldReady?: () => void;
  className?: string;
  widthPx?: number;
  heightPx?: number;
  chipScale?: number;
};

/** @deprecated Ver `MvpHorizontalFieldGraphic`. */
export function MatchMvpFieldGraphic({
  homeSlots,
  awaySlots,
  homeTeam,
  awayTeam,
  homeSquadPlayerNames,
  awaySquadPlayerNames,
  selectedKey,
  disabled,
  onSelect,
  onFieldReady,
  className,
  widthPx,
  heightPx,
  chipScale = 1,
}: MatchMvpFieldGraphicProps) {
  const awayKitClash = teamKitColorsClash(homeTeam, awayTeam);
  const starterCount = homeSlots.length + awaySlots.length;
  const sized = widthPx != null && heightPx != null && widthPx > 0 && heightPx > 0;

  function renderSlot(
    teamName: string,
    slot: MatchFieldSlot,
    isAway: boolean,
    squadPlayerNames?: string[]
  ) {
    const key = mvpSelectionKey(teamName, slot);
    const active = selectedKey === key;
    const scale = slot.scale * chipScale;

    return (
      <div
        key={`${teamName}-${slot.key}`}
        className={cn("absolute", active ? "z-20" : "z-10")}
        style={{
          left: `${slot.x}%`,
          top: `${slot.y}%`,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <LineupPlayerChip
          slot={slot}
          teamName={teamName}
          squadPlayerNames={squadPlayerNames}
          variant="match"
          selected={active}
          disabled={disabled}
          awayKitClashBorder={isAway && awayKitClash}
          onClick={!slot.isPlaceholder ? () => onSelect(key) : undefined}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Campo táctico MVP: ${starterCount} titulares, ${teamNameEs(awayTeam)} arriba y ${teamNameEs(homeTeam)} abajo`}
      className={cn(
        "relative shrink-0 overflow-visible",
        !sized && "w-full max-w-[min(99vw,24rem)]",
        !sized && MVP_PITCH_ASPECT_CLASS,
        className
      )}
      style={
        sized
          ? {
              width: widthPx,
              height: heightPx,
              maxWidth: "100%",
            }
          : {
              transform: `scale(${MODAL_FIELD_WRAPPER_SCALE})`,
              transformOrigin: "center center",
            }
      }
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <FootballPitchSurface onReady={onFieldReady} />
      </div>

      {awaySlots.map((slot) => renderSlot(awayTeam, slot, true, awaySquadPlayerNames))}
      {homeSlots.map((slot) => renderSlot(homeTeam, slot, false, homeSquadPlayerNames))}
    </div>
  );
}
