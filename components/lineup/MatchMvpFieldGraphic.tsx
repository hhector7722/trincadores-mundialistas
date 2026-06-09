"use client";

import { FootballPitchSurface } from "@/components/lineup/FootballPitchSurface";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import { MVP_PITCH_ASPECT_CLASS } from "@/lib/lineup/field-layout";
import {
  type MatchFieldSlot,
} from "@/lib/lineup/match-field-geometry";
import { mvpSelectionKey } from "@/lib/lineup/mvp-selection-key";
import { teamKitColorsClash } from "@/lib/lineup/team-kit-colors";
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

  function renderSlot(
    teamName: string,
    slot: MatchFieldSlot,
    isAway: boolean,
    squadPlayerNames?: string[]
  ) {
    const key = mvpSelectionKey(teamName, slot);
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
        "relative w-full shrink-0 self-center max-w-[16.5rem] overflow-visible",
        MVP_PITCH_ASPECT_CLASS,
        className
      )}
    >
      <div className="absolute inset-0 rounded-lg bg-[#143d24]">
        <FootballPitchSurface onReady={onFieldReady} />
      </div>

      {awaySlots.map((slot) => renderSlot(awayTeam, slot, true, awaySquadPlayerNames))}
      {homeSlots.map((slot) => renderSlot(homeTeam, slot, false, homeSquadPlayerNames))}
    </div>
  );
}
