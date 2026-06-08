"use client";

import Image from "next/image";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import { GOYA_FIELD_SRC } from "@/lib/lineup/field-asset";
import type { LineupSlot } from "@/lib/lineup/types";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type MatchMvpFieldGraphicProps = {
  homeSlots: LineupSlot[];
  awaySlots: LineupSlot[];
  homeTeam: string;
  awayTeam: string;
  selectedKey: string | null;
  disabled?: boolean;
  onSelect: (key: string) => void;
  onFieldReady?: () => void;
  className?: string;
};

function playerKey(teamName: string, slot: LineupSlot): string {
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

  function renderSlot(teamName: string, slot: LineupSlot) {
    const key = playerKey(teamName, slot);
    const active = selectedKey === key;

    return (
      <div
        key={`${teamName}-${slot.key}`}
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
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
        "relative aspect-[3/2] w-full shrink-0 self-center max-w-none overflow-visible",
        className
      )}
    >
      <div className="absolute inset-0">
        <Image
          src={GOYA_FIELD_SRC}
          alt=""
          fill
          unoptimized
          className="object-contain object-center"
          sizes="(max-width: 512px) 100vw, 512px"
          priority
          onLoad={handleFieldReady}
          onError={handleFieldReady}
        />
      </div>

      <div className="pointer-events-none absolute left-2 top-2 z-20 max-w-[42%] truncate rounded bg-black/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white/85 backdrop-blur-sm">
        {teamNameEs(awayTeam)}
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 z-20 max-w-[42%] truncate rounded bg-black/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white/85 backdrop-blur-sm">
        {teamNameEs(homeTeam)}
      </div>

      {awaySlots.map((slot) => renderSlot(awayTeam, slot))}
      {homeSlots.map((slot) => renderSlot(homeTeam, slot))}
    </div>
  );
}
