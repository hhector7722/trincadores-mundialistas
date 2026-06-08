"use client";

import Image from "next/image";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import { GOYA_FIELD_SRC } from "@/lib/lineup/field-asset";
import type { FormationId, LineupSlot } from "@/lib/lineup/types";
import { cn } from "@/lib/utils";

type TeamLineupGraphicProps = {
  slots: LineupSlot[];
  formation: FormationId;
  teamName: string;
  className?: string;
  /** `modal`: ocupa el ancho del panel de alineaciones. */
  size?: "default" | "modal";
  onPlayerClick?: (playerName: string) => void;
  /** Se dispara cuando la imagen del campo terminó de cargar (o falló). */
  onFieldReady?: () => void;
};

export function TeamLineupGraphic({
  slots,
  formation,
  teamName,
  className,
  size = "default",
  onPlayerClick,
  onFieldReady,
}: TeamLineupGraphicProps) {
  const isModal = size === "modal";

  function handleFieldReady() {
    onFieldReady?.();
  }

  return (
    <div
      className={cn(
        "w-full shrink-0 self-center",
        isModal && "overflow-visible py-2 sm:py-3",
        className
      )}
    >
      <div
        className={cn(
          "relative aspect-[3/2] w-full",
          isModal
            ? "max-w-none overflow-visible"
            : "mx-auto max-w-[300px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl sm:max-w-[360px]"
        )}
      >
      <div className={cn("absolute inset-0", !isModal && "bg-[#3a1218]")}>
        <Image
          src={GOYA_FIELD_SRC}
          alt=""
          fill
          unoptimized
          className="object-contain object-center"
          sizes={isModal ? "(max-width: 576px) 100vw, 576px" : "(max-width: 360px) 100vw, 360px"}
          priority
          onLoad={handleFieldReady}
          onError={handleFieldReady}
        />
      </div>

      <div
        className={cn(
          "absolute rounded bg-black/50 font-bold uppercase tracking-widest text-white/80 backdrop-blur-sm",
          isModal ? "left-4 top-4 px-2.5 py-1 text-[11px]" : "left-3 top-3 px-2 py-1 text-[10px]"
        )}
      >
        {formation}
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
    </div>
  );
}
