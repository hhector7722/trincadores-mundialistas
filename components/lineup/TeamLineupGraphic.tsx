"use client";

import { FootballPitchSurface } from "@/components/lineup/FootballPitchSurface";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import {
  PITCH_ASPECT_CLASS,
  separateOverlappingSlots,
} from "@/lib/lineup/field-layout";
import type { LineupSlot } from "@/lib/lineup/types";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

type TeamLineupGraphicProps = {
  slots: LineupSlot[];
  formationLabel: string;
  teamName: string;
  className?: string;
  /** `modal`: ocupa el ancho del panel de alineaciones. */
  size?: "default" | "modal";
  onPlayerClick?: (playerName: string) => void;
  onFieldReady?: () => void;
  squadPlayerNames?: string[];
};

export function TeamLineupGraphic({
  slots,
  formationLabel,
  teamName,
  className,
  size = "default",
  onPlayerClick,
  onFieldReady,
  squadPlayerNames,
}: TeamLineupGraphicProps) {
  const isModal = size === "modal";
  const positionedSlots = useMemo(() => separateOverlappingSlots(slots), [slots]);

  return (
    <div className={cn("flex w-full flex-col items-center gap-1.5", className)}>
      <div
        className={cn(
          "shrink-0 rounded bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-sm",
          isModal ? "self-start" : "self-center"
        )}
      >
        {formationLabel}
      </div>

      <div
        className={cn(
          "relative w-full shrink-0 self-center",
          PITCH_ASPECT_CLASS,
          isModal ? "max-w-[13.5rem] overflow-visible" : "max-w-[11rem] overflow-hidden rounded-2xl border border-white/10 shadow-2xl sm:max-w-[12.5rem]"
        )}
      >
        <div className={cn("absolute inset-0", !isModal && "rounded-2xl bg-[#143d24]")}>
          <FootballPitchSurface className="object-contain object-center" onReady={onFieldReady} />
        </div>

        {positionedSlots.map((slot) => (
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
