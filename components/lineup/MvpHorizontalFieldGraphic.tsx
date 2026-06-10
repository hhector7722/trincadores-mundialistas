"use client";

import { HorizontalPitchSurface } from "@/components/lineup/HorizontalPitchSurface";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import { HORIZONTAL_PITCH_ASPECT } from "@/lib/lineup/fit-mvp-horizontal-layout";
import type { MvpHorizontalSlot } from "@/lib/lineup/mvp-horizontal-geometry";
import { mvpSelectionKey } from "@/lib/lineup/mvp-selection-key";
import { teamKitColorsClash } from "@/lib/lineup/team-kit-colors";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type MvpHorizontalFieldGraphicProps = {
  awaySlots: MvpHorizontalSlot[];
  homeSlots: MvpHorizontalSlot[];
  awayTeam: string;
  homeTeam: string;
  awaySquadPlayerNames?: string[];
  homeSquadPlayerNames?: string[];
  selectedKey: string | null;
  disabled?: boolean;
  onSelect: (key: string) => void;
  onFieldReady?: () => void;
  className?: string;
  widthPx?: number;
  heightPx?: number;
  chipScale?: number;
};

export function MvpHorizontalFieldGraphic({
  awaySlots,
  homeSlots,
  awayTeam,
  homeTeam,
  awaySquadPlayerNames,
  homeSquadPlayerNames,
  selectedKey,
  disabled,
  onSelect,
  onFieldReady,
  className,
  widthPx,
  heightPx,
  chipScale = 1,
}: MvpHorizontalFieldGraphicProps) {
  const sized = widthPx != null && heightPx != null && widthPx > 0 && heightPx > 0;

  if (!sized) {
    return (
      <div
        aria-hidden
        className={cn(
          "relative shrink-0 aspect-[105/68] w-full max-w-full rounded-sm border border-[var(--tm-border)] bg-[rgba(42,107,60,0.28)]",
          className
        )}
      />
    );
  }

  const awayKitClash = teamKitColorsClash(homeTeam, awayTeam);
  const starterCount = awaySlots.length + homeSlots.length;

  function renderSlot(
    teamName: string,
    slot: MvpHorizontalSlot,
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
      aria-label={`Campo táctico MVP horizontal: ${starterCount} titulares, ${teamNameEs(awayTeam)} a la izquierda y ${teamNameEs(homeTeam)} a la derecha`}
      className={cn("relative shrink-0 overflow-visible", className)}
      style={{
        width: widthPx,
        height: heightPx,
        maxWidth: "100%",
        aspectRatio: String(HORIZONTAL_PITCH_ASPECT),
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <HorizontalPitchSurface onReady={onFieldReady} />
      </div>

      {awaySlots.map((slot) => renderSlot(awayTeam, slot, true, awaySquadPlayerNames))}
      {homeSlots.map((slot) => renderSlot(homeTeam, slot, false, homeSquadPlayerNames))}
    </div>
  );
}
