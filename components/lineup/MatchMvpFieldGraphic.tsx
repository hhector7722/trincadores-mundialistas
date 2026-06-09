"use client";

import { useMemo } from "react";
import { FootballPitchSurface } from "@/components/lineup/FootballPitchSurface";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import {
  MVP_PITCH_ASPECT_CLASS,
  separateOverlappingSlots,
} from "@/lib/lineup/field-layout";
import { teamKitColorsClash } from "@/lib/lineup/team-kit-colors";
import type { MatchFieldSlot } from "@/lib/lineup/match-field-geometry";
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
};

function playerKey(teamName: string, slot: MatchFieldSlot): string {
  return `${teamName}-${slot.name}-${slot.shirtNumber ?? "x"}`;
}

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
}: MatchMvpFieldGraphicProps) {
  const awayKitClash = teamKitColorsClash(homeTeam, awayTeam);

  const { separatedAway, separatedHome } = useMemo(
    () => ({
      separatedAway: separateOverlappingSlots(awaySlots) as MatchFieldSlot[],
      separatedHome: separateOverlappingSlots(homeSlots) as MatchFieldSlot[],
    }),
    [awaySlots, homeSlots]
  );

  function renderSlot(
    teamName: string,
    slot: MatchFieldSlot,
    isAway: boolean,
    squadPlayerNames?: string[]
  ) {
    const key = playerKey(teamName, slot);
    const active = selectedKey === key;

    return (
      <div
        key={`${teamName}-${slot.key}`}
        className="absolute z-10"
        style={{
          left: `${slot.x}%`,
          top: `${slot.y}%`,
          transform: `translate(-50%, -50%) scale(${slot.scale})`,
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
      className={cn(
        "relative w-full shrink-0 self-center max-w-[15rem] overflow-visible",
        MVP_PITCH_ASPECT_CLASS,
        className
      )}
    >
      <div className="absolute inset-0 rounded-lg bg-[#143d24]">
        <FootballPitchSurface onReady={onFieldReady} />
      </div>

      {separatedAway.map((slot) => renderSlot(awayTeam, slot, true, awaySquadPlayerNames))}
      {separatedHome.map((slot) => renderSlot(homeTeam, slot, false, homeSquadPlayerNames))}
    </div>
  );
}
