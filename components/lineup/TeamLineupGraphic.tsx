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
        "relative aspect-[3/4] w-full max-w-lg shrink-0 self-center overflow-hidden rounded-2xl border border-white/10 shadow-2xl",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-950" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 8%, transparent 8%, transparent 16%)",
        }}
      />
      <div className="absolute inset-x-[8%] inset-y-[4%] rounded-lg border border-white/20" />
      <div className="absolute left-1/2 top-[4%] h-[14%] w-[44%] -translate-x-1/2 border border-white/20" />
      <div className="absolute bottom-[4%] left-1/2 h-[14%] w-[44%] -translate-x-1/2 border border-white/20" />
      <div className="absolute left-1/2 top-1/2 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />

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
