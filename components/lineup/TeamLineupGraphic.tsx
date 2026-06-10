"use client";

import { FootballPitchSurface } from "@/components/lineup/FootballPitchSurface";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import { MODAL_FIELD_WRAPPER_SCALE, PITCH_ASPECT_CLASS } from "@/lib/lineup/field-layout";
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
  widthPx?: number;
  heightPx?: number;
  chipScale?: number;
};

export function TeamLineupGraphic({
  slots,
  teamName,
  className,
  size = "default",
  onPlayerClick,
  onFieldReady,
  squadPlayerNames,
  widthPx,
  heightPx,
  chipScale = 1,
}: TeamLineupGraphicProps) {
  const isModal = size === "modal";
  const sized = widthPx != null && heightPx != null && widthPx > 0 && heightPx > 0;

  return (
    <div className={cn("flex w-full flex-col items-center", className)}>
      <div
        className={cn(
          "relative shrink-0 self-center overflow-visible",
          !sized && PITCH_ASPECT_CLASS,
          !sized &&
            (isModal ? "w-full max-w-[min(98vw,18.5rem)]" : "w-full max-w-[min(92vw,16.5rem)] sm:max-w-[17rem]")
        )}
        style={
          sized
            ? {
                width: widthPx,
                height: heightPx,
                maxWidth: "100%",
              }
            : isModal
              ? {
                  transform: `scale(${MODAL_FIELD_WRAPPER_SCALE})`,
                  transformOrigin: "center center",
                }
              : undefined
        }
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <FootballPitchSurface onReady={onFieldReady} />
        </div>

        {slots.map((slot) => (
          <div
            key={slot.key}
            className="absolute z-10"
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              transform: `translate(-50%, -50%) scale(${chipScale})`,
            }}
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
