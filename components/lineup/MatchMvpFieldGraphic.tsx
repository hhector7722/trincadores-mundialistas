"use client";

import Image from "next/image";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import { GOYA_FIELD_SRC } from "@/lib/lineup/field-asset";
import type { MatchFieldSlot } from "@/lib/lineup/match-field-geometry";
import { teamNameEs } from "@/lib/teams/display";
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
  function handleFieldReady() {
    onFieldReady?.();
  }

  function renderSlot(teamName: string, slot: MatchFieldSlot) {
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
        "w-full shrink-0 self-center overflow-visible py-1 sm:py-1.5",
        className
      )}
    >
      <div
        className={cn(
          "relative aspect-[3/2] w-full min-h-[min(40dvh,20rem)] max-w-none overflow-visible"
        )}
      >
      <div className="absolute inset-0">
        <Image
          src={GOYA_FIELD_SRC}
          alt=""
          fill
          unoptimized
          className="object-contain object-center"
          sizes="(max-width: 576px) 100vw, 576px"
          priority
          onLoad={handleFieldReady}
          onError={handleFieldReady}
        />
      </div>

      <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[46%] truncate rounded bg-black/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white/85 backdrop-blur-sm">
        {teamNameEs(awayTeam)}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 z-20 max-w-[46%] truncate rounded bg-black/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white/85 backdrop-blur-sm">
        {teamNameEs(homeTeam)}
      </div>

      {awaySlots.map((slot) => renderSlot(awayTeam, slot))}
      {homeSlots.map((slot) => renderSlot(homeTeam, slot))}
      </div>
    </div>
  );
}
