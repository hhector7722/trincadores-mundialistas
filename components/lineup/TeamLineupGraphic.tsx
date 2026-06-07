import Image from "next/image";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import type { FormationId, LineupSlot } from "@/lib/lineup/types";
import { cn } from "@/lib/utils";

type TeamLineupGraphicProps = {
  slots: LineupSlot[];
  formation: FormationId;
  className?: string;
  onPlayerClick?: (playerName: string) => void;
};

export function TeamLineupGraphic({
  slots,
  formation,
  className,
  onPlayerClick,
}: TeamLineupGraphicProps) {
  return (
    <div
      className={cn(
        "relative aspect-[3/2] w-full max-w-[220px] shrink-0 self-center sm:max-w-[260px]",
        className
      )}
    >
      <Image
        src="/icons/goya.png"
        alt=""
        fill
        className="object-contain object-center"
        sizes="(max-width: 260px) 100vw, 260px"
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
