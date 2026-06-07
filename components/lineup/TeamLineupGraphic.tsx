import Image from "next/image";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import { GOYA_FIELD_SRC } from "@/lib/lineup/field-asset";
import type { FormationId, LineupSlot } from "@/lib/lineup/types";
import { cn } from "@/lib/utils";

type TeamLineupGraphicProps = {
  slots: LineupSlot[];
  formation: FormationId;
  className?: string;
  /** `modal`: ocupa el ancho del panel de alineaciones. */
  size?: "default" | "modal";
  onPlayerClick?: (playerName: string) => void;
};

export function TeamLineupGraphic({
  slots,
  formation,
  className,
  size = "default",
  onPlayerClick,
}: TeamLineupGraphicProps) {
  const isModal = size === "modal";

  return (
    <div
      className={cn(
        "relative aspect-[3/2] w-full shrink-0 self-center",
        isModal ? "max-w-none" : "max-w-[300px] sm:max-w-[360px]",
        className
      )}
    >
      <Image
        src={GOYA_FIELD_SRC}
        alt=""
        fill
        className="object-contain object-center"
        sizes={isModal ? "(max-width: 512px) 100vw, 512px" : "(max-width: 360px) 100vw, 360px"}
        priority
      />

      <div className="absolute left-3 top-3 rounded bg-black/50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-sm">
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
            onClick={
              onPlayerClick && !slot.isPlaceholder ? () => onPlayerClick(slot.name) : undefined
            }
          />
        </div>
      ))}
    </div>
  );
}
