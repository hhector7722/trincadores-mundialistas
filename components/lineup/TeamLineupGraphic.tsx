"use client";

import type { ReactNode } from "react";
import { FootballPitchSurface } from "@/components/lineup/FootballPitchSurface";
import { LineupModalFieldShell } from "@/components/lineup/LineupModalFieldShell";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import { PITCH_ASPECT_CLASS } from "@/lib/lineup/field-layout";
import type { LineupSlot } from "@/lib/lineup/types";
import { cn } from "@/lib/utils";

type TeamLineupGraphicProps = {
  slots: LineupSlot[];
  teamName: string;
  className?: string;
  /** Suplentes encima del terreno, mismo ancho que el campo. */
  benchAbove?: ReactNode;
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
  benchAbove,
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
  const pitchMaxW = "w-full max-w-[min(92vw,16.5rem)] sm:max-w-[17rem]";

  const fieldContent = (
    <>
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
    </>
  );

  if (isModal && !sized) {
    return (
      <LineupModalFieldShell className={className} benchAbove={benchAbove}>
        {fieldContent}
      </LineupModalFieldShell>
    );
  }

  return (
    <div className={cn("flex w-full flex-col items-center", className)}>
      <div className={cn("flex shrink-0 flex-col items-center self-center", !sized && pitchMaxW)}>
        {benchAbove ? <div className="mb-1 w-full shrink-0">{benchAbove}</div> : null}
        <div
          className={cn("relative w-full shrink-0 overflow-visible", !sized && PITCH_ASPECT_CLASS)}
          style={
            sized
              ? {
                  width: widthPx,
                  height: heightPx,
                  maxWidth: "100%",
                }
              : undefined
          }
        >
          {fieldContent}
        </div>
      </div>
    </div>
  );
}
