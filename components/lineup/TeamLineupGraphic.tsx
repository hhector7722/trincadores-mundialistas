"use client";

import { FootballPitchSurface } from "@/components/lineup/FootballPitchSurface";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import type { LineupSlot } from "@/lib/lineup/types";
import { cn } from "@/lib/utils";

type TeamLineupGraphicProps = {
  slots: LineupSlot[];
  formationLabel: string;
  teamName: string;
  className?: string;
  /** `modal`: ocupa el ancho del panel de alineaciones. */
  size?: "default" | "modal";
  onPlayerClick?: (playerName: string) => void;
  /** Se dispara cuando el campo terminó de cargar (o falló). */
  onFieldReady?: () => void;
};

export function TeamLineupGraphic({
  slots,
  formationLabel,
  teamName,
  className,
  size = "default",
  onPlayerClick,
  onFieldReady,
}: TeamLineupGraphicProps) {
  const isModal = size === "modal";

  return (
    <div
      className={cn(
        "relative aspect-[3/2] w-full shrink-0 self-center",
        isModal
          ? "max-w-none overflow-visible"
          : "max-w-[300px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl sm:max-w-[360px]",
        className
      )}
    >
      <div className={cn("absolute inset-0", !isModal && "rounded-2xl bg-[#143d24]")}>
        <FootballPitchSurface className="object-contain object-center" onReady={onFieldReady} />
      </div>

      <div className="absolute left-3 top-3 rounded bg-black/50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-sm">
        {formationLabel}
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
            variant={isModal ? "modal" : "default"}
            onClick={
              onPlayerClick && !slot.isPlaceholder ? () => onPlayerClick(slot.name) : undefined
            }
          />
        </div>
      ))}
    </div>
  );
}
