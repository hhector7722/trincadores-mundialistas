"use client";

import { FootballPitchSurface } from "@/components/lineup/FootballPitchSurface";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import { teamKitColorsClash } from "@/lib/lineup/team-kit-colors";
import type { MatchFieldSlot } from "@/lib/lineup/match-field-geometry";
import { cn } from "@/lib/utils";

type MatchMvpFieldGraphicProps = {
  homeSlots: MatchFieldSlot[];
  awaySlots: MatchFieldSlot[];
  homeTeam: string;
  awayTeam: string;
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
  selectedKey,
  disabled,
  onSelect,
  onFieldReady,
  className,
}: MatchMvpFieldGraphicProps) {
  const awayKitClash = teamKitColorsClash(homeTeam, awayTeam);

  function renderSlot(teamName: string, slot: MatchFieldSlot, isAway: boolean) {
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
          variant="match"
          selected={active}
          disabled={disabled}
          awayKitClashBorder={isAway && awayKitClash}
          onClick={
            !slot.isPlaceholder
              ? () => onSelect(key)
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-[3/2] w-full shrink-0 self-center max-w-none overflow-visible",
        className
      )}
    >
      <div className="absolute inset-0 bg-[#143d24]">
        <FootballPitchSurface onReady={onFieldReady} />
      </div>

      {awaySlots.map((slot) => renderSlot(awayTeam, slot, true))}
      {homeSlots.map((slot) => renderSlot(homeTeam, slot, false))}
    </div>
  );
}
