"use client";

import React, { type ReactNode } from "react";
import { FootballPitchSurface } from "@/components/lineup/FootballPitchSurface";
import { LineupModalFieldShell } from "@/components/lineup/LineupModalFieldShell";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import { PITCH_ASPECT_CLASS } from "@/lib/lineup/field-layout";
import type { LineupSlot } from "@/lib/lineup/types";
import { LayoutEngine, LayoutElementInput, LayoutConstraints } from "@/lib/lineup/tactical-layout-engine";
import { cn } from "@/lib/utils";

const DEFAULT_CONSTRAINTS: LayoutConstraints = {
  margins: { side: 1, vertical: 1 },
  spacing: { minHorizontal: 5, minVertical: 5 },
  chipSize: { minScale: 0.65, maxScale: 1.5, baseWidth: 10, baseHeight: 12 },
  nameAreaBounds: { width: 16, height: 4 },
  optimization: { mode: "balanced", maxIterations: 50, tolerance: 0.02 },
  fieldBounds: { xMin: 0, xMax: 100, yMin: 0, yMax: 100, isAwayHalf: false },
};

type TeamLineupGraphicProps = {
  slots: LineupSlot[];
  teamName: string;
  className?: string;
  /** Suplentes encima del terreno, mismo ancho que el campo. */
  benchAbove?: ReactNode;
  size?: "default" | "modal";
  onPlayerClick?: (playerName: string) => void;
  onFieldReady?: () => void;
  squadPlayers?: { player_name: string; sticker_url?: string | null }[];
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
  squadPlayers,
  widthPx,
  heightPx,
  chipScale = 1,
}: TeamLineupGraphicProps) {
  const isModal = size === "modal";
  const sized = widthPx != null && heightPx != null && widthPx > 0 && heightPx > 0;
  const pitchMaxW = "w-full max-w-[min(92vw,16.5rem)] sm:max-w-[17rem]";

  const layoutResult = React.useMemo(() => {
    const inputs: LayoutElementInput[] = slots.map(s => ({
      id: s.key,
      role: s.role,
      referenceX: s.x,
      referenceY: s.y,
    }));
    return LayoutEngine.calculate(inputs, DEFAULT_CONSTRAINTS);
  }, [slots]);

  const finalChipScale = chipScale * layoutResult.chipScale;

  const fieldContent = (
    <>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <FootballPitchSurface onReady={onFieldReady} />
      </div>

      {layoutResult.positions.map((pos) => {
        const slot = slots.find(s => s.key === pos.id);
        if (!slot) return null;
        return (
          <div
            key={slot.key}
            className="absolute z-10"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `translate(-50%, -50%) scale(${finalChipScale})`,
            }}
          >
          <LineupPlayerChip
            slot={slot}
            teamName={teamName}
            squadPlayerNames={squadPlayers?.map(p => p.player_name)}
            stickerUrl={squadPlayers?.find((p) => p.player_name === slot.name)?.sticker_url ?? null}
            variant={isModal ? "modal" : "default"}
            onClick={
              onPlayerClick && !slot.isPlaceholder ? () => onPlayerClick(slot.name) : undefined
            }
          />
          </div>
        );
      })}
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
    <div className={cn("flex w-full flex-col flex-1", className)}>
      <div className={cn("flex w-full shrink-0 flex-col flex-1 items-stretch", !sized && pitchMaxW)}>
        {benchAbove ? <div className="mb-1 w-full min-w-0 shrink-0">{benchAbove}</div> : null}
        <div
          className={cn(
            "relative w-full shrink-0 overflow-visible",
            !sized && (isModal ? "flex-1" : PITCH_ASPECT_CLASS)
          )}
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
