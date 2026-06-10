"use client";

import { FootballPitchSurface } from "@/components/lineup/FootballPitchSurface";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import { PITCH_ASPECT_CLASS } from "@/lib/lineup/field-layout";
import type { LineupSlot } from "@/lib/lineup/types";
import { cn } from "@/lib/utils";

type TeamLineupGraphicProps = {
  slots: LineupSlot[];
  teamName: string;
  className?: string;
  /** `modal`: campo ampliado dentro del panel. */
  size?: "default" | "modal";
  onPlayerClick?: (playerName: string) => void;
  onFieldReady?: () => void;
  squadPlayerNames?: string[];
};

export function TeamLineupGraphic({
  slots,
  teamName,
  className,
  size = "default",
  onPlayerClick,
  onFieldReady,
  squadPlayerNames,
}: TeamLineupGraphicProps) {
  const isModal = size === "modal";

  return (
    <div className={cn("flex w-full flex-col items-center", className)}>
      <div
        className={cn(
          "relative w-full shrink-0 self-center overflow-visible",
          PITCH_ASPECT_CLASS,
          isModal ? "max-w-[min(98vw,18.5rem)]" : "max-w-[min(92vw,16.5rem)] sm:max-w-[17rem]"
        )}
      >
        <div className="absolute inset-0">
          <FootballPitchSurface onReady={onFieldReady} />
        </div>

        {slots.map((slot) => (
          <div
            key={slot.key}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            <LineupPlayerChip
              slot={slot}
              teamName={teamName}
              squadPlayerNames={squadPlayerNames}
              variant={isModal ? "modal" : "default"}
              onClick={
                onPlayerClick && !slot.isPlaceholder ? () => onPlayerClick(slot.name) : undefined
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
