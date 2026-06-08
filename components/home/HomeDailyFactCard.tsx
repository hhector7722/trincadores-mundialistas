import type { DailyFact } from "@/lib/home/daily-fact";

type HomeDailyFactCardProps = {
  fact: DailyFact | null;
};

export function HomeDailyFactCard({ fact }: HomeDailyFactCardProps) {
  if (!fact) return null;

  return (
    <div
      className="@container flex h-full min-h-0 min-w-0 flex-col justify-center rounded-2xl p-[clamp(0.5rem,3cqw,0.75rem)] tm-stat-card"
      aria-label="Dato shanelador del dia"
    >
      <div className="grid grid-cols-[minmax(0,4.75rem)_minmax(0,1fr)] items-start gap-1">
        <span className="min-w-0 text-[9px] font-semibold uppercase leading-snug tracking-wide text-white/50">
          Dato shanelador del día
        </span>
        <p className="min-w-0 text-[10px] font-medium leading-relaxed text-[#CCFF00]">
          {fact.text}
        </p>
      </div>
    </div>
  );
}
